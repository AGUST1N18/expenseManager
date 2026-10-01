const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year, month) {
  const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return lengths[month - 1] ?? 0;
}

export function parseDate(iso) {
  if (typeof iso !== 'string') return null;
  const match = ISO_DATE_PATTERN.exec(iso);
  if (match === null) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function formatIsoDate({ year, month, day }) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isValidDate(iso) {
  const parts = parseDate(iso);
  if (parts === null) return false;
  if (parts.month < 1 || parts.month > 12) return false;
  if (parts.day < 1) return false;
  return parts.day <= daysInMonth(parts.year, parts.month);
}
