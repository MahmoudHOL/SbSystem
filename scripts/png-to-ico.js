/**
 * تحويل 1.png إلى build/icon.ico لاستخدامه في Setup
 * تشغيل: node scripts/png-to-ico.js
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const toIco = require('to-ico');

const root = path.join(__dirname, '..');
const srcPng = path.join(root, '1.png');
const outDir = path.join(root, 'build');
const outIco = path.join(outDir, 'icon.ico');

async function run() {
  if (!fs.existsSync(srcPng)) {
    console.error('لم يُعثر على 1.png في جذر المشروع.');
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const sizes = [256, 128, 64, 48, 32, 16];
  const buffers = await Promise.all(
    sizes.map((size) =>
      sharp(srcPng)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  const ico = await toIco(buffers);
  fs.writeFileSync(outIco, ico);
  console.log('تم إنشاء build/icon.ico بنجاح.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
