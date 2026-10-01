export const DEFAULT_CURRENCY_SYMBOL = '$';

export function round2(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value, { currencySymbol = DEFAULT_CURRENCY_SYMBOL } = {}) {
  const rounded = round2(value);

  if (Number.isInteger(rounded)) {
    return `${currencySymbol} ${rounded}`;
  }

  return `${currencySymbol} ${rounded.toFixed(2)}`;
}
