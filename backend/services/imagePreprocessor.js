const path = require('path');
const fs = require('fs');

/**
 * Preprocess receipt image for better OCR accuracy.
 * Falls back to original path if sharp is unavailable.
 */
const preprocessForOCR = async (imagePath) => {
  try {
    const sharp = require('sharp');
    const outPath = imagePath.replace(path.extname(imagePath), '-ocr.png');

    await sharp(imagePath)
      .rotate() // auto-orient from EXIF
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen()
      .png({ quality: 100 })
      .toFile(outPath);

    return outPath;
  } catch (err) {
    console.warn('Image preprocessing skipped:', err.message);
    return imagePath;
  }
};

const cleanupPreprocessed = (processedPath, originalPath) => {
  if (processedPath && processedPath !== originalPath && fs.existsSync(processedPath)) {
    try {
      fs.unlinkSync(processedPath);
    } catch {
      /* ignore */
    }
  }
};

module.exports = { preprocessForOCR, cleanupPreprocessed };
