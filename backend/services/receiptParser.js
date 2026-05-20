const { EXPENSE_CATEGORIES } = require('../models/Transaction');

const CATEGORY_KEYWORDS = {
  Food: ['restaurant', 'cafe', 'coffee', 'grocery', 'food', 'pizza', 'burger', 'starbucks', 'mcdonald', 'subway', 'kitchen', 'dining', 'bakery', 'deli', 'eat', 'grubhub', 'doordash', 'swiggy', 'zomato'],
  Travel: ['uber', 'lyft', 'ola', 'gas', 'fuel', 'parking', 'taxi', 'cab', 'airline', 'flight', 'hotel', 'shell', 'exxon', 'chevron', 'bp', 'metro', 'transit', 'petrol'],
  Shopping: ['walmart', 'target', 'amazon', 'flipkart', 'costco', 'store', 'mart', 'retail', 'mall', 'shop', 'ikea', 'best buy', 'reliance', 'dmart'],
  Bills: ['electric', 'water', 'internet', 'phone', 'utility', 'bill', 'insurance', 'subscription', 'comcast', 'verizon', 'broadband', 'recharge'],
  Entertainment: ['netflix', 'cinema', 'movie', 'spotify', 'game', 'theater', 'hulu', 'disney', 'steam', 'concert', 'ticket'],
  Education: ['university', 'school', 'books', 'tuition', 'course', 'college', 'academy'],
  Health: ['pharmacy', 'hospital', 'medical', 'doctor', 'cvs', 'walgreens', 'clinic', 'dental', 'health', 'rx', 'apollo', 'medplus'],
};

const PAYMENT_PATTERNS = [
  { method: 'Visa', regex: /\bvisa\b/i },
  { method: 'Mastercard', regex: /\bmaster\s*card\b/i },
  { method: 'RuPay', regex: /\brupay\b/i },
  { method: 'American Express', regex: /\bamex\b|\bamerican express\b/i },
  { method: 'Debit Card', regex: /\bdebit\b/i },
  { method: 'Credit Card', regex: /\bcredit\s*card\b/i },
  { method: 'Cash', regex: /\bcash\b/i },
  { method: 'UPI', regex: /\bupi\b|\bgpay\b|\bphonepe\b|\bpaytm\b|\bbhim\b/i },
  { method: 'PayPal', regex: /\bpaypal\b/i },
];

const TOTAL_KEYWORDS = /(?:grand\s*)?total|amount\s*due|balance\s*due|total\s*due|net\s*amount|pay\s*amount|amount\s*paid|bill\s*amount|net\s*payable|to\s*pay/i;
const SUBTOTAL_KEYWORDS = /sub\s*total|subtotal|items\s*total/i;
const TAX_KEYWORDS = /(?:sales\s*)?tax|gst|vat|cgst|sgst|igst|hst|pst|service\s*tax/i;

const normalizeOcrText = (raw) => {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[|]/g, 'I')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

const parseAmount = (str) => {
  if (!str) return null;
  const cleaned = String(str).replace(/[,\s]/g, '').replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 && n < 10000000 ? Math.round(n * 100) / 100 : null;
};

const findAmountsInLine = (line) => {
  const found = [];
  const decimalPatterns = [
    /(?:rs\.?|inr|₹|\$)\s*([\d,]+\.\d{2})/gi,
    /\b([\d,]+\.\d{2})\b/g,
  ];
  for (const pattern of decimalPatterns) {
    let m;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(line)) !== null) {
      const val = parseAmount(m[1]);
      if (val && val >= 0.01) found.push(val);
    }
  }
  if (found.length) return found;

  const wholePatterns = [/(?:rs\.?|inr|₹|\$)\s*([\d,]+)/gi];
  for (const pattern of wholePatterns) {
    let m;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(line)) !== null) {
      const val = parseAmount(m[1]);
      if (val && val >= 0.01) found.push(val);
    }
  }
  return found;
};

const extractTotalAmount = (text, lines) => {
  // Lines with TOTAL keyword — take last number on line
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (TOTAL_KEYWORDS.test(line) && !SUBTOTAL_KEYWORDS.test(line)) {
      const nums = findAmountsInLine(line);
      if (nums.length) return nums[nums.length - 1];
    }
  }

  // "TOTAL" on one line, amount on next
  for (let i = 0; i < lines.length - 1; i++) {
    if (/^total\b/i.test(lines[i]) || /\btotal\s*$/i.test(lines[i])) {
      const nums = findAmountsInLine(lines[i + 1]);
      if (nums.length) return nums[nums.length - 1];
      const sameLine = findAmountsInLine(lines[i]);
      if (sameLine.length) return sameLine[sameLine.length - 1];
    }
  }

  // All amounts in document — prefer largest in bottom half (totals usually at bottom)
  const allAmounts = [];
  lines.forEach((line, idx) => {
    if (SUBTOTAL_KEYWORDS.test(line) || TAX_KEYWORDS.test(line)) return;
    findAmountsInLine(line).forEach((val) => {
      allAmounts.push({ val, idx, line });
    });
  });

  if (!allAmounts.length) {
    const globalMatches = text.match(/[\d,]+\.\d{2}/g) || [];
    globalMatches.forEach((m) => {
      const v = parseAmount(m);
      if (v) allAmounts.push({ val: v, idx: 999, line: '' });
    });
  }

  if (!allAmounts.length) return null;

  const bottomHalf = allAmounts.filter((a) => a.idx >= lines.length / 2);
  const pool = bottomHalf.length ? bottomHalf : allAmounts;
  pool.sort((a, b) => b.val - a.val);
  return pool[0]?.val || null;
};

const extractSubtotal = (lines) => {
  for (const line of lines) {
    if (SUBTOTAL_KEYWORDS.test(line)) {
      const nums = findAmountsInLine(line);
      if (nums.length) return nums[nums.length - 1];
    }
  }
  return null;
};

const extractTax = (text, lines) => {
  for (const line of lines) {
    if (TAX_KEYWORDS.test(line)) {
      const nums = findAmountsInLine(line);
      if (nums.length) return nums[nums.length - 1];
    }
  }
  const taxMatch = text.match(/(?:tax|gst|vat|cgst|sgst)[:\s]*(?:rs\.?|inr|₹|\$)?\s*([\d,]+\.?\d*)/i);
  return taxMatch ? parseAmount(taxMatch[1]) : null;
};

const extractDate = (text) => {
  const patterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/g,
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+(\d{1,2})[\s,]+(\d{4})/gi,
    /(\d{1,2})[\s,]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,]+(\d{4})/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      try {
        let d;
        if (/[a-z]/i.test(match[0])) {
          d = new Date(match[0]);
        } else if (match[1]?.length === 4) {
          d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
        } else {
          const y = match[3].length === 2 ? 2000 + parseInt(match[3], 10) : parseInt(match[3], 10);
          d = new Date(y, parseInt(match[1], 10) - 1, parseInt(match[2], 10));
        }
        if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d <= new Date()) {
          return d.toISOString().split('T')[0];
        }
      } catch {
        /* continue */
      }
    }
  }
  return new Date().toISOString().split('T')[0];
};

const extractMerchant = (lines) => {
  const skip = /receipt|invoice|tax|bill|welcome|thank|tel|phone|fax|www\.|http|\.com|date|time|cashier|order|store\s*#|gstin|fssai|cin|tin|pan|copy|original|duplicate/i;
  const candidates = [];

  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length < 3 || line.length > 70) continue;
    if (skip.test(line)) continue;
    if (/^[\d\s\-.:]+$/.test(line)) continue;
    if (findAmountsInLine(line).length === 1 && line.length < 15) continue;
    candidates.push(line.replace(/[^\w\s&'.-]/g, '').trim());
  }

  return candidates.sort((a, b) => b.length - a.length)[0]?.slice(0, 80) || '';
};

const extractPaymentMethod = (text) => {
  for (const { method, regex } of PAYMENT_PATTERNS) {
    if (regex.test(text)) return method;
  }
  return '';
};

const extractItems = (lines) => {
  const items = [];
  const patterns = [
    /^(.{2,45}?)\s+(?:rs\.?|inr|₹|\$)?\s*([\d,]+\.\d{2})\s*$/i,
    /^(.{2,45}?)\s+([\d,]+\.\d{2})\s*$/,
    /^(\d+)\s+(.{2,40}?)\s+([\d,]+\.\d{2})/,
  ];

  for (const line of lines) {
    if (TOTAL_KEYWORDS.test(line) || TAX_KEYWORDS.test(line) || SUBTOTAL_KEYWORDS.test(line)) continue;
    if (/^[\d\s\-]+$/.test(line)) continue;

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const name = (match[2] && match[3] ? match[2] : match[1]).trim();
        const priceStr = match[3] || match[2];
        const price = parseAmount(priceStr);
        if (name.length > 2 && price && price < 50000 && !/total|subtotal|tax|change|balance/i.test(name)) {
          items.push({ name, price });
          break;
        }
      }
    }
  }

  const seen = new Set();
  return items.filter((i) => {
    const key = i.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 25);
};

const categorizeExpense = (text, merchant) => {
  const combined = `${merchant} ${text}`.toLowerCase();
  let best = { category: 'Other Expense', score: 0 };
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((k) => combined.includes(k)).length;
    if (score > best.score) best = { category, score };
  }
  return EXPENSE_CATEGORIES.includes(best.category) ? best.category : 'Other Expense';
};

const fieldStatus = (value) => {
  if (value === null || value === undefined || value === '') return 'missing';
  if (typeof value === 'number' && value > 0) return 'detected';
  if (typeof value === 'string' && value.trim()) return 'detected';
  if (Array.isArray(value) && value.length > 0) return 'detected';
  return 'missing';
};

const buildAnalysisReport = (data, lines, rawText) => {
  const { amount, merchant, date, category, tax, paymentMethod, items, subtotal } = data;
  const textLen = rawText?.length || 0;
  const ocrQuality = textLen > 100 ? 'good' : textLen > 30 ? 'fair' : 'poor';

  const fields = [
    { key: 'merchant', label: 'Merchant / Store', value: merchant || null, status: fieldStatus(merchant) },
    { key: 'date', label: 'Transaction Date', value: date || null, status: fieldStatus(date) },
    { key: 'amount', label: 'Total Amount', value: amount ? `$${amount}` : null, status: fieldStatus(amount) },
    { key: 'subtotal', label: 'Subtotal', value: subtotal ? `$${subtotal}` : null, status: fieldStatus(subtotal) },
    { key: 'tax', label: 'Tax / GST', value: tax ? `$${tax}` : null, status: fieldStatus(tax) },
    { key: 'category', label: 'Expense Category', value: category || null, status: fieldStatus(category) },
    { key: 'paymentMethod', label: 'Payment Method', value: paymentMethod || null, status: fieldStatus(paymentMethod) },
    { key: 'items', label: 'Line Items', value: items?.length ? `${items.length} item(s) found` : null, status: fieldStatus(items) },
  ];

  const warnings = [];
  if (!amount) warnings.push('Total amount could not be detected — please enter it manually.');
  if (!merchant) warnings.push('Store name was not clearly identified.');
  if (ocrQuality === 'poor') warnings.push('OCR quality is low. Use a clearer, well-lit photo of the full receipt.');
  if (textLen < 20) warnings.push('Very little text was read from the image.');

  const parts = [];
  if (merchant) parts.push(`from ${merchant}`);
  if (date) parts.push(`on ${date}`);
  if (amount) parts.push(`for $${amount}`);
  if (category) parts.push(`(category: ${category})`);

  let summary;
  if (amount || merchant) {
    summary = `This receipt appears to be a purchase ${parts.join(' ')}.`;
  } else if (textLen > 20) {
    summary = 'Text was read from the bill, but key amounts could not be identified automatically. Please review the raw text below and fill in the form.';
  } else {
    summary = 'Could not analyze this bill clearly. Please try a sharper image or enter details manually.';
  }

  return {
    summary,
    fields,
    warnings,
    ocrQuality,
    lineCount: lines.length,
    characterCount: textLen,
  };
};

const parseReceiptText = (rawText) => {
  const text = normalizeOcrText(rawText);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const merchant = extractMerchant(lines);
  const amount = extractTotalAmount(text, lines);
  const subtotal = extractSubtotal(lines);
  const tax = extractTax(text, lines);
  const date = extractDate(text);
  const paymentMethod = extractPaymentMethod(text);
  const items = extractItems(lines);
  const category = categorizeExpense(text, merchant);

  let confidence = 0;
  if (amount) confidence += 0.4;
  if (merchant) confidence += 0.25;
  if (date) confidence += 0.15;
  if (tax) confidence += 0.1;
  if (items.length) confidence += 0.1;
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  const notesParts = [];
  if (merchant) notesParts.push(`Merchant: ${merchant}`);
  if (paymentMethod) notesParts.push(`Payment: ${paymentMethod}`);
  if (tax) notesParts.push(`Tax: $${tax}`);
  if (items.length) notesParts.push(`Items: ${items.map((i) => `${i.name} ($${i.price})`).join(', ')}`);

  const extracted = {
    type: 'expense',
    amount: amount || '',
    subtotal: subtotal || '',
    date,
    merchant,
    category,
    tax: tax || '',
    paymentMethod,
    items,
    notes: notesParts.join(' | '),
    rawText: text,
    confidence,
  };

  const analysis = buildAnalysisReport(extracted, lines, text);

  return { ...extracted, analysis };
};

module.exports = { parseReceiptText, categorizeExpense, buildAnalysisReport };
