import { describe, expect, it } from 'vitest';
import { MONTH_NAMES, monthName } from '@/domain/catalog/months.js';
import { formatMoney, round2 } from '@/domain/formatters/money.js';
import {
  formatCancellationDate,
  formatDate,
  formatDaysRemaining,
  formatPaymentDate,
} from '@/domain/formatters/date.js';

describe('round2 (único lugar donde se redondea)', () => {
  it('redondea a dos decimales', () => {
    expect(round2(8333.3333333)).toBe(8333.33);
    expect(round2(4583.3333333)).toBe(4583.33);
    expect(round2(0.125)).toBe(0.13);
    expect(round2(15000)).toBe(15000);
  });

  it('evita el error de coma flotante al redondear', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
  });

  it('devuelve cero ante valores no numéricos', () => {
    expect(round2(Number.NaN)).toBe(0);
    expect(round2(undefined)).toBe(0);
  });
});

describe('formatMoney (FR-004)', () => {
  it('muestra un monto entero sin decimales', () => {
    expect(formatMoney(15000)).toBe('$ 15000');
    expect(formatMoney(360000)).toBe('$ 360000');
  });

  it('muestra dos decimales cuando el monto los tiene', () => {
    expect(formatMoney(8333.3333333)).toBe('$ 8333.33');
    expect(formatMoney(1599.99)).toBe('$ 1599.99');
  });

  it('respeta el símbolo de moneda configurado', () => {
    expect(formatMoney(15000, { currencySymbol: '€' })).toBe('€ 15000');
    expect(formatMoney(8333.3333333, { currencySymbol: 'US$' })).toBe('US$ 8333.33');
  });

  it('redondea en la presentación, no en el dato', () => {
    const monthly = 35000 / 12;
    expect(monthly).not.toBe(2916.67);
    expect(formatMoney(monthly)).toBe('$ 2916.67');
  });

  it('muestra cero ante valores no numéricos', () => {
    expect(formatMoney(Number.NaN)).toBe('$ 0');
  });
});

describe('formatDate (FR-012, FR-028)', () => {
  it('escribe la fecha en español', () => {
    expect(formatDate('2026-10-05')).toBe('5 de octubre de 2026');
    expect(formatDate('2026-01-01')).toBe('1 de enero de 2026');
    expect(formatDate('2028-02-29')).toBe('29 de febrero de 2028');
  });

  it('devuelve texto vacío ante una fecha inválida', () => {
    expect(formatDate('2026-02-30')).toBe('');
    expect(formatDate('ayer')).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

describe('formatDaysRemaining', () => {
  it('usa Hoy, Mañana y el plural correcto', () => {
    expect(formatDaysRemaining(0)).toBe('Hoy');
    expect(formatDaysRemaining(1)).toBe('Mañana');
    expect(formatDaysRemaining(4)).toBe('En 4 días');
    expect(formatDaysRemaining(7)).toBe('En 7 días');
    expect(formatDaysRemaining(21)).toBe('En 21 días');
  });

  it('informa los días ya transcurridos', () => {
    expect(formatDaysRemaining(-1)).toBe('Hace 1 día');
    expect(formatDaysRemaining(-5)).toBe('Hace 5 días');
  });
});

describe('Catálogo de nombres de mes y día', () => {
  it('expone los doce meses en español', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(MONTH_NAMES[0]).toBe('enero');
    expect(MONTH_NAMES[11]).toBe('diciembre');
  });

  it('devuelve el nombre del mes y texto vacío si no existe', () => {
    expect(monthName(10)).toBe('octubre');
    expect(monthName(13)).toBe('');
  });
});

describe('Fechas de pago y de baja (FR-038, FR-039)', () => {
  it('rotula la fecha del último pago', () => {
    expect(formatPaymentDate('2026-10-05')).toBe('Pagado el 5 de octubre de 2026');
  });

  it('rotula la fecha de baja', () => {
    expect(formatCancellationDate('2026-10-01')).toBe('Cancelada el 1 de octubre de 2026');
  });

  it('devuelve cadena vacía cuando la fecha no existe', () => {
    expect(formatPaymentDate(null)).toBe('');
    expect(formatPaymentDate(undefined)).toBe('');
    expect(formatCancellationDate(null)).toBe('');
    expect(formatCancellationDate(undefined)).toBe('');
  });

  it('devuelve cadena vacía cuando la fecha es inválida', () => {
    expect(formatPaymentDate('ayer')).toBe('');
    expect(formatCancellationDate('2026-02-30')).toBe('');
  });
});
