/* wav-cutter.js
What does this file do:
1)Connect to your MongoDB and pull each WAV out of GridFS into ./tmp/.
2)Read every _annot.json in emuDBrepo/myEmuDB, grab each level’s items array.
3)For each item, compute start & duration in seconds.
4)Use ffmpeg to cut exactly that span out of the temp WAV.
5)Write each slice as clips/<basename>_<levelName>_<item.id>.wav.
6)Log progress and skip invalid segments. */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

// Fetch a file from GridFS by id into outPath
function fetchFromGridFS(bucket, id, outPath) {
  return new Promise((resolve, reject) => {
    bucket.openDownloadStream(new ObjectId(id))
      .pipe(fs.createWriteStream(outPath))
      .on('error', reject)
      .on('finish', resolve);
  });
}

// Extract audio segment using ffmpeg given startSec and durSec
function extractAudio(inPath, outPath, startSec, durSec) {
  console.log(`>> [extractAudio] startSec=${startSec} (${typeof startSec}), durSec=${durSec} (${typeof durSec})`);
  return new Promise((resolve, reject) => {
    ffmpeg(inPath)
      .setStartTime(startSec)
      .setDuration(durSec)
      .output(outPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

async function run() {
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017');
  const db     = client.db('metadata_db');
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  const repoDir = path.resolve(__dirname, 'emuDBrepo', 'myEmuDB');
  const tmpDir  = path.resolve(__dirname, 'tmp');
  const clipDir = path.resolve(__dirname, 'clips');
  [tmpDir, clipDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

  // Fetch all audio file metadata
  const files = await db.collection('filemetadatas')
    .find({ fileType: 'audio' })
    .toArray();

  // Window size for EVENT annotations: adjust as needed
  const windowSec = 0.3; // 200 ms total window

  for (const meta of files) {
    const baseName  = path.basename(meta.fileName, '.wav');
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

    // Download the WAV into tmp
    const tmpWav = path.join(tmpDir, `${baseName}.wav`);
    console.log(`Downloading ${meta.fileName} → ${tmpWav}`);
    try {
      await fetchFromGridFS(bucket, meta.gridFSRef, tmpWav);
    } catch (err) {
      console.error(`Failed to download ${baseName}: ${err.message}`);
      continue;
    }

    // Iterate through levels & items
    for (const lvl of levels) {
      for (const item of lvl.items) {
        let startSample = item.sampleStart;
        let durSamples  = item.sampleDur;

        if (lvl.type === 'EVENT') {
          // For events, center a small window
          const halfSamples = Math.floor((windowSec * sampleRate) / 2);
          startSample = Math.max(0, (item.sampleStart || 0) - halfSamples);
          durSamples  = halfSamples * 2;
        }

        // Compute seconds
        const startSec = startSample / sampleRate;
        const durSec   = durSamples  / sampleRate;

        // Validate numeric start/duration
        if (!isFinite(startSec) || !isFinite(durSec) || durSec <= 0) {
          console.warn(`Skipping ${baseName} ${lvl.name}#${item.id}: invalid times (startSec=${startSec}, durSec=${durSec})`);
          continue;
        }

        const clipName = `${baseName}_${lvl.name}_${item.id}.wav`;
        const outPath  = path.join(clipDir, clipName);
        console.log(`Cutting ${baseName} ${lvl.name}#${item.id} → ${clipName} ` +
                    `(start=${startSec.toFixed(3)}s, dur=${durSec.toFixed(3)}s)`);
        try {
          await extractAudio(tmpWav, outPath, startSec, durSec);
        } catch (err) {
          console.error(`Error cutting ${clipName}: ${err.message}`);
        }
      }
    }

    // Cleanup temp file
    fs.unlinkSync(tmpWav);
  }

  console.log(`✅ All valid audio clips written in ${clipDir}`);
  client.close();
}

run().catch(err => {
  console.error('Error in wav-cutter:', err);
  process.exit(1);
});