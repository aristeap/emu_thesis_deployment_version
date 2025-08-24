
// Fetch a file from GridFS by id into outPath
function fetchFromGridFS(bucket, id, outPath) {
  return new Promise((resolve, reject) => {
    bucket.openDownloadStream(new ObjectId(id))
      .pipe(fs.createWriteStream(outPath))
      .on('error', reject)
      .on('finish', resolve);
  });
}

// Extract video segment with precise seek after input
function extractVideo(inPath, outPath, startSec, durSec) {
  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .outputOptions([
        `-ss ${startSec}`,              // precise seek after input
        `-t ${durSec}`,                 // clip duration
        '-avoid_negative_ts make_zero',  // reset timestamps
        '-c:v libx264',                  // re-encode video smoothly
        '-preset veryfast',              // speed/quality tradeoff
        '-c:a copy'                      // copy audio unchanged
      ])
      .format('mp4')
      .save(outPath)
      .on('start', cmd => console.log('FFmpeg command:', cmd))
      .on('error', err => reject(err))
      .on('end', () => resolve());
  });
}

async function run() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db     = client.db('metadata_db');
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  const repoDir = path.resolve(__dirname, 'emuDBrepo', 'myEmuDB');
  const tmpDir  = path.resolve(__dirname, 'tmp');
  const clipDir = path.resolve(__dirname, 'clips2');
  [tmpDir, clipDir].forEach(d => fs.mkdirSync(d, { recursive: true }));
  // clear any old clips
  fs.readdirSync(clipDir).forEach(f => {
    const fp = path.join(clipDir, f);
    if (fs.statSync(fp).isFile()) fs.unlinkSync(fp);
  });

  // Fetch all video file metadata
  const files = await db.collection('filemetadatas')
    .find({ fileType: 'video' })
    .toArray();

  // Window size for EVENT annotations
  const windowSec = 0.3; // 300 ms total

  for (const meta of files) {
    const baseName  = path.basename(meta.fileName, path.extname(meta.fileName));
    const annotPath = path.join(repoDir, `${baseName}_annot.json`);

    if (!fs.existsSync(annotPath)) {
      console.warn(`Skipping ${baseName}: no annotation JSON`);
      continue;
    }

    let json;
    try {
      json = JSON.parse(fs.readFileSync(annotPath, 'utf8'));
    } catch (err) {
      console.warn(`Skipping ${baseName}: invalid JSON (${err.message})`);
      continue;
    }

    const { levels, sampleRate } = json;
    if (!Array.isArray(levels) || typeof sampleRate !== 'number') {
      console.warn(`Skipping ${baseName}: no levels or invalid sampleRate`);
      continue;
    }

    // Download the MP4 into tmp
    const tmpVideo = path.join(tmpDir, `${baseName}.mp4`);
    console.log(`Downloading ${meta.fileName} → ${tmpVideo}`);
    try {
      await fetchFromGridFS(bucket, meta.gridFSRef, tmpVideo);
    } catch (err) {
      console.error(`Failed to download ${baseName}: ${err.message}`);
      continue;
    }

    // Probe the actual video duration
    let videoDur = Infinity;
    try {
      const metaInfo = await new Promise((res, rej) => {
        ffmpeg.ffprobe(tmpVideo, (err, data) => err ? rej(err) : res(data));
      });
      videoDur = metaInfo.format.duration;
    } catch (err) {
      console.warn(`Could not probe duration for ${baseName}: ${err.message}`);
    }

    // Now cut each annotation
    for (const lvl of levels) {
      for (const item of lvl.items) {
        let startSample = item.sampleStart;
        let durSamples  = item.sampleDur;

        if (lvl.type === 'EVENT') {
          const half = Math.floor((windowSec * sampleRate) / 2);
          startSample = Math.max(0, startSample - half);
          durSamples  = half * 2;
        }

        const startSec = startSample / sampleRate;
        let durSec     = durSamples  / sampleRate;

        // skip only if it truly starts beyond the video
        // if (startSec > videoDur) {
        //   console.warn(`Skipping ${baseName} ${lvl.name}#${item.id}: start ${startSec}s beyond video duration ${videoDur}s`);
        //   continue;
        // }

        // clamp duration to remaining video length, but never negative
        const remaining = videoDur - startSec;
        durSec = Math.min(durSec, remaining);
        durSec = Math.max(0, durSec);

        if (!isFinite(startSec) || !isFinite(durSec) || durSec <= 0) {
          console.warn(`Skipping ${baseName} ${lvl.name}#${item.id}: invalid or zero-length clip (start=${startSec}, dur=${durSec})`);
          continue;
        }

        const clipName = `${baseName}_${lvl.name}_${item.id}.mp4`;
        const outPath  = path.join(clipDir, clipName);
        console.log(`Cutting ${baseName} ${lvl.name}#${item.id} → ${clipName}`);
        try {
          await extractVideo(tmpVideo, outPath, startSec, durSec);
        } catch (err) {
          console.error(`Error cutting ${clipName}: ${err.message}`);
        }
      }
    }

    fs.unlinkSync(tmpVideo);
  }

  console.log(`✅ All valid video clips written in ${clipDir}`);
  client.close();
}

run().catch(err => {
  console.error('Error in video-cutter:', err);
  process.exit(1);
});