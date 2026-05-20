export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

export const getReceiptImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
};
