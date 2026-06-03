// Temporary script — safe to delete after running
const sharp = require("sharp");
const fs = require("fs");

const SRC = "public/worldcup-logo.png.png";

const PNG_TASKS = [
  { output: "public/icon-192.png",          size: 192 },
  { output: "public/icon-512.png",          size: 512 },
  { output: "public/apple-touch-icon.png",  size: 180 },
  { output: "src/app/icon.png",             size: 512 },
  { output: "src/app/apple-icon.png",       size: 180 },
];

const ICO_SIZES  = [16, 32, 48];
const ICO_OUTPUT = "src/app/favicon.ico";

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const HEADER = 6;
  const ENTRY  = 16;
  const dirEnd = HEADER + ENTRY * count;

  const offsets = [];
  let pos = dirEnd;
  for (const buf of pngBuffers) { offsets.push(pos); pos += buf.length; }

  const ico = Buffer.alloc(pos);
  ico.writeUInt16LE(0, 0);      // Reserved
  ico.writeUInt16LE(1, 2);      // Type: ICO
  ico.writeUInt16LE(count, 4);  // Count

  for (let i = 0; i < count; i++) {
    const base = HEADER + i * ENTRY;
    const w    = sizes[i];
    const png  = pngBuffers[i];
    ico.writeUInt8(w >= 256 ? 0 : w, base);       // Width  (0 means 256)
    ico.writeUInt8(w >= 256 ? 0 : w, base + 1);   // Height
    ico.writeUInt8(0, base + 2);                   // ColorCount
    ico.writeUInt8(0, base + 3);                   // Reserved
    ico.writeUInt16LE(1, base + 4);                // Planes
    ico.writeUInt16LE(32, base + 6);               // BitCount
    ico.writeUInt32LE(png.length, base + 8);       // BytesInRes
    ico.writeUInt32LE(offsets[i], base + 12);      // ImageOffset
    png.copy(ico, offsets[i]);
  }

  return ico;
}

async function run() {
  if (!fs.existsSync(SRC)) {
    console.error("Source not found:", SRC);
    process.exit(1);
  }

  const src = fs.readFileSync(SRC);

  for (const { output, size } of PNG_TASKS) {
    fs.mkdirSync(require("path").dirname(output), { recursive: true });
    await sharp(src)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(output);
    console.log("OK", output);
  }

  const icoBuffers = await Promise.all(
    ICO_SIZES.map((s) =>
      sharp(src)
        .resize(s, s, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );

  fs.writeFileSync(ICO_OUTPUT, buildIco(icoBuffers, ICO_SIZES));
  console.log("OK", ICO_OUTPUT);
  console.log("Done.");
}

run().catch((err) => { console.error(err); process.exit(1); });
