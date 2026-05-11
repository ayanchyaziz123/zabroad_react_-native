const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', INR: '₹', BDT: '৳' };

export function formatPrice(amount, currency = 'USD') {
  if (amount == null || amount === '') return null;
  const num = parseFloat(amount);
  if (isNaN(num)) return null;
  const symbol = SYMBOLS[currency] || `${currency} `;
  const hasDecimals = num % 1 !== 0;
  const formatted = hasDecimals
    ? num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : Math.floor(num).toLocaleString('en-US');
  return `${symbol}${formatted}`;
}

export function sanitizePrice(text) {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
}
