export const SERVER_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (process.env.REACT_APP_SERVER_URL || 'http://localhost:5000')
    : '';

export const getReceiptImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
};
