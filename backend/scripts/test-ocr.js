const path = require('path');
const sharp = require('sharp');
const { extractTextFromImage } = require('../services/ocrService');
const { parseReceiptText } = require('../services/receiptParser');

async function main() {
  const outPath = path.join(__dirname, '../uploads/test-receipt.png');
  const svg = `
    <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <text x="20" y="40" font-size="28" font-family="Arial" fill="black">COFFEE SHOP</text>
      <text x="20" y="80" font-size="18" font-family="Arial" fill="black">05/19/2026</text>
      <text x="20" y="120" font-size="18" font-family="Arial" fill="black">Latte 4.50</text>
      <text x="20" y="150" font-size="18" font-family="Arial" fill="black">Muffin 3.00</text>
      <text x="20" y="200" font-size="22" font-family="Arial" fill="black">TOTAL 7.50</text>
    </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(outPath);

  console.log('Running OCR on', outPath);
  const t0 = Date.now();
  const { text, engine } = await extractTextFromImage(outPath);
  console.log(`OCR done in ${Date.now() - t0}ms (${engine}), ${text.length} chars`);
  console.log('Text:', text.replace(/\n/g, ' | '));

  const extracted = parseReceiptText(text);
  console.log('Amount:', extracted.amount);
  console.log('Merchant:', extracted.merchant);
  console.log('Summary:', extracted.analysis?.summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
