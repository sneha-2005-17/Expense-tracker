/** Build a consistent scan result object for the analysis + form steps. */
export const buildScanPayload = (data, previewUrl) => {
  const extracted = data.extracted || {};
  return {
    extracted,
    analysis: data.analysis || extracted.analysis || {},
    receiptImage: data.receiptImage || '',
    rawText: data.rawText || extracted.rawText || '',
    ocrEngine: data.ocrEngine || 'OCR',
    message: data.message || '',
    partial: Boolean(data.partial || data.success === false),
    success: data.success !== false,
    previewUrl: previewUrl || '',
  };
};
