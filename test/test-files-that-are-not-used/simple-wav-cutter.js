// simple-wav-cutter.js
const fs   = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

function extractAudio(inPath, outPath, startSample, durSamples, sampleRate) {
  const startSec = startSample / sampleRate;
  const durSec   = durSamples  / sampleRate;
  return new Promise((res, rej) => {
    ffmpeg(inPath)
      .setStartTime(startSec)
      .setDuration(durSec)
      .output(outPath)
      .on('end',  res)
      .on('error', rej)
      .run();
  });
}

async function run() {
  const [,, wavFile, annotFile] = process.argv;
  if (!wavFile || !annotFile) {
    console.error("Usage: node simple-wav-cutter.js <file.wav> <file_annot.json>");
    process.exit(1);
  }
  const { levels, sampleRate } = JSON.parse(fs.readFileSync(annotFile, 'utf8'));
  const outDir = path.resolve(__dirname, 'clips');
  fs.mkdirSync(outDir, { recursive: true });

  for (const lvl of levels) {
    for (const item of lvl.items) {
      const outName = `${path.basename(wavFile, '.wav')}_${lvl.name}_${item.id}.wav`;
      console.log(`Cutting ${lvl.name}#${item.id} → ${outName}`);
      await extractAudio(
        wavFile,
        path.join(outDir, outName),
        item.sampleStart,
        item.sampleDur,
        sampleRate
      );
    }
  }
  console.log("✅ Done! Check the clips/ folder.");
}

run().catch(err=>console.error(err));