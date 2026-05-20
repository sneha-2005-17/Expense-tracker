/** User-friendly message when API calls fail (network vs server error). */
export const getApiError = (err, fallback = 'Something went wrong') => {
  if (!err.response) {
    if (err.code === 'ECONNABORTED') {
      return 'Scan timed out. The first scan can take 1–2 minutes while OCR loads—please try again.';
    }
    return 'Cannot reach the server. From the project folder run: npm start (and ensure MongoDB is running).';
  }

  const data = err.response.data;
  if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
    return 'Server error. Restart with npm start from the project root, then try again.';
  }

  return data?.message || fallback;
};
