import { formatIsoDate } from './parseDate.js';

export function today(now = new Date()) {
  return formatIsoDate({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}
