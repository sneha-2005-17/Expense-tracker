const fs = require('fs');
const { createWorker, PSM } = require('tesseract.js');
const { preprocessForOCR, cleanupPreprocessed } = require('./imagePreprocessor');

let workerInstance = null;
let workerReady = false;

const initWorker = async () => {
  if (workerInstance && workerReady) return workerInstance;

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        process.stdout.write(`\rOCR: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
    preserve_interword_spaces: '1',
  });

  workerInstance = worker;
  workerReady = true;
  console.log('\nOCR worker ready');
  return worker;
};

const runTesseractOnFile = async (imagePath, psm = PSM.AUTO) => {
  const worker = await initWorker();
  await worker.setParameters({ tessedit_pageseg_mode: psm });
  const { data } = await worker.recognize(imagePath);
  return (data?.text || '').trim();
};

const runTesseractOCR = async (imagePath) => {
  let processedPath = imagePath;
  try {
    processedPath = await preprocessForOCR(imagePath);

    // Try multiple page segmentation modes — receipts vary a lot
    const modes = [PSM.AUTO, PSM.SINGLE_BLOCK, PSM.SPARSE_TEXT];
    let bestText = '';

    for (const mode of modes) {
      const text = await runTesseractOnFile(processedPath, mode);
      if (text.length > bestText.length) {
        bestText = text;
      }
      if (bestText.length > 80) break;
    }

    cleanupPreprocessed(processedPath, imagePath);
    return bestText;
  } catch (err) {
    cleanupPreprocessed(processedPath, imagePath);
    throw err;
  }
};

const runGoogleVisionOCR = async (imagePath) => {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Google Vision failed: ${errBody.slice(0, 200)}`);
  }

  const json = await response.json();
  const annotation = json.responses?.[0]?.fullTextAnnotation;
  return annotation?.text || json.responses?.[0]?.textAnnotations?.[0]?.description || '';
};

const extractTextFromImage = async (imagePath) => {
  const ocrEngine = process.env.OCR_ENGINE || 'tesseract';

  if (ocrEngine === 'google' && process.env.GOOGLE_VISION_API_KEY) {
    try {
      const text = await runGoogleVisionOCR(imagePath);
      if (text?.trim()) return { text: text.trim(), engine: 'google-vision' };
    } catch (err) {
      console.warn('Google Vision failed, falling back to Tesseract:', err.message);
    }
  }

  const text = await runTesseractOCR(imagePath);
  return { text, engine: 'tesseract' };
};

const prewarmOCR = async () => {
  try {
    await initWorker();
    console.log('OCR engine pre-warmed and ready for receipt scans');
  } catch (err) {
    console.warn('OCR pre-warm skipped:', err.message);
  }
};

module.exports = { extractTextFromImage, prewarmOCR };
