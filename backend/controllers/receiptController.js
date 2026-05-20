const path = require('path');
const { extractTextFromImage } = require('../services/ocrService');
const { parseReceiptText } = require('../services/receiptParser');

// @desc    Scan receipt image with OCR and extract expense data
// @route   POST /api/receipts/scan
const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a receipt image' });
    }

    const imagePath = req.file.path;
    const relativePath = path
      .join('/uploads/receipts', String(req.user._id), path.basename(imagePath))
      .replace(/\\/g, '/');

    console.log(`Scanning receipt: ${imagePath} (${req.file.size} bytes)`);

    let text = '';
    let engine = 'unknown';
    try {
      const ocrResult = await extractTextFromImage(imagePath);
      text = ocrResult.text || '';
      engine = ocrResult.engine;
      console.log(`OCR complete (${engine}): ${text.length} characters`);
    } catch (ocrErr) {
      console.error('OCR failed:', ocrErr);
      const extracted = parseReceiptText('');
      extracted.analysis.warnings.unshift(
        `OCR could not read this image: ${ocrErr.message}. Try a clearer, well-lit photo.`
      );
      return res.status(200).json({
        success: false,
        partial: true,
        message: 'Could not read text from this image. You can still enter details manually.',
        receiptImage: relativePath,
        rawText: '',
        extracted,
        analysis: extracted.analysis,
        ocrEngine: 'tesseract',
      });
    }

    // Always parse whatever text we got — even partial
    const extracted = parseReceiptText(text || '');
    const hasUsefulData = extracted.amount || extracted.merchant || text.length > 15;

    if (!text || text.trim().length < 3) {
      return res.status(200).json({
        success: false,
        partial: true,
        message:
          'No readable text found on this image. Tips: use good lighting, hold the camera steady, capture the full receipt, and avoid blur.',
        receiptImage: relativePath,
        rawText: text || '',
        extracted,
        analysis: extracted.analysis,
        ocrEngine: engine,
      });
    }

    if (!hasUsefulData) {
      return res.status(200).json({
        success: true,
        partial: true,
        message:
          'Some text was read but amounts could not be detected. Review the analysis below and edit the form.',
        extracted,
        receiptImage: relativePath,
        rawText: text,
        ocrEngine: engine,
      });
    }

    res.json({
      success: true,
      partial: !extracted.amount,
      message: extracted.amount
        ? 'Bill analyzed successfully. Review the details below.'
        : 'Partial analysis complete. Please verify the total amount.',
      extracted,
      receiptImage: relativePath,
      rawText: text,
      ocrEngine: engine,
    });
  } catch (error) {
    console.error('Receipt scan error:', error);
    const extracted = parseReceiptText('');
    extracted.analysis.warnings.unshift(error.message || 'Unexpected scan error');
    res.status(200).json({
      success: false,
      partial: true,
      message: 'Something went wrong while scanning. You can still enter details manually.',
      extracted,
      analysis: extracted.analysis,
      rawText: '',
      ocrEngine: 'unknown',
    });
  }
};

module.exports = { scanReceipt };
