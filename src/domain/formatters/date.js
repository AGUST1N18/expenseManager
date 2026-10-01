import { monthName } from '@/domain/catalog/months.js';
import { isValidDate, parseDate } from '@/domain/dates/parseDate.js';

export function formatDate(iso) {
  if (!isValidDate(iso)) return '';
  const { year, month, day } = parseDate(iso);
  return `${day} de ${monthName(month)} de ${year}`;
}

export function formatDaysRemaining(days) {
  if (days < 0) return `Hace ${Math.abs(days)} ${Math.abs(days) === 1 ? 'día' : 'días'}`;
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

export function formatPaymentDate(iso) {
  const date = formatDate(iso);
  return date === '' ? '' : `Pagado el ${date}`;
}

export function formatCancellationDate(iso) {
  const date = formatDate(iso);
  return date === '' ? '' : `Cancelada el ${date}`;
}
