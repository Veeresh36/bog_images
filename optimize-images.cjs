const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const MAX_WIDTH = 1200;
const QUALITY = 78;
const SRC_DIR = ".";
const OUT_DIR = "optimized";
const MIN_SAVINGS_KB = 5;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

async function run() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.toLowerCase().endsWith(".webp"));
  let totalBefore = 0, totalAfter = 0, processed = 0;

  for (const fname of files) {
    const srcPath = path.join(SRC_DIR, fname);
    if (!fs.statSync(srcPath).isFile()) continue;

    const beforeSize = fs.statSync(srcPath).size;
    const outPath = path.join(OUT_DIR, fname);

    try {
      const meta = await sharp(srcPath).metadata();
      let pipeline = sharp(srcPath);
      if (meta.width > MAX_WIDTH) {
        pipeline = pipeline.resize({ width: MAX_WIDTH });
      }
      await pipeline.webp({ quality: QUALITY }).toFile(outPath);
    } catch (e) {
      console.log(`SKIP (couldn't open): ${fname} - ${e.message}`);
      continue;
    }

    const afterSize = fs.statSync(outPath).size;
    const savingsKB = (beforeSize - afterSize) / 1024;

    if (savingsKB < MIN_SAVINGS_KB) {
      fs.unlinkSync(outPath);
      console.log(`KEEP ORIGINAL (already efficient): ${fname}`);
      continue;
    }

    totalBefore += beforeSize;
    totalAfter += afterSize;
    processed++;
    console.log(`${fname}: ${(beforeSize/1024).toFixed(0)} KB -> ${(afterSize/1024).toFixed(0)} KB (${(100*(1-afterSize/beforeSize)).toFixed(0)}% smaller)`);
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Processed: ${processed} images`);
  if (totalBefore) {
    console.log(`Total: ${(totalBefore/1024).toFixed(0)} KB -> ${(totalAfter/1024).toFixed(0)} KB (${(100*(1-totalAfter/totalBefore)).toFixed(0)}% smaller)`);
  }
  console.log(`\nCheck ./${OUT_DIR}/ - if it looks good, copy those files over the originals, commit, and push.`);
  console.log("jsDelivr cache: purge via https://www.jsdelivr.com/tools/purge since @main is cached ~7 days.");
}

run();
