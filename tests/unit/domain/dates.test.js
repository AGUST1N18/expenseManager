import { describe, expect, it } from 'vitest';
import { addMonths } from '@/domain/dates/addMonths.js';
import { diffDays } from '@/domain/dates/diffDays.js';
import { endOfYear } from '@/domain/dates/endOfYear.js';
import {
  daysInMonth,
  formatIsoDate,
  isLeapYear,
  isValidDate,
  parseDate,
} from '@/domain/dates/parseDate.js';
import { today } from '@/domain/dates/today.js';

describe('parseDate', () => {
  it('descompone una fecha ISO en partes numéricas', () => {
    expect(parseDate('2026-10-05')).toEqual({ year: 2026, month: 10, day: 5 });
  });

  it('devuelve null ante formatos no soportados', () => {
    expect(parseDate('05/10/2026')).toBeNull();
    expect(parseDate('2026-10')).toBeNull();
    expect(parseDate('')).toBeNull();
    expect(parseDate(undefined)).toBeNull();
    expect(parseDate(20261005)).toBeNull();
  });
});

describe('formatIsoDate', () => {
  it('completa con ceros a la izquierda', () => {
    expect(formatIsoDate({ year: 2026, month: 1, day: 5 })).toBe('2026-01-05');
  });
});

describe('isLeapYear y daysInMonth', () => {
  it('reconoce años bisiestos según el calendario gregoriano', () => {
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
  });

  it('devuelve la longitud de cada mes', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2026, 13)).toBe(0);
  });
});

describe('isValidDate (FR-005)', () => {
  it('acepta el 29 de febrero de un año bisiesto', () => {
    expect(isValidDate('2028-02-29')).toBe(true);
  });

  it('rechaza el 29 de febrero de un año no bisiesto', () => {
    expect(isValidDate('2026-02-29')).toBe(false);
  });

  it('rechaza el día 31 en meses de 30 días', () => {
    expect(isValidDate('2026-04-31')).toBe(false);
    expect(isValidDate('2026-09-31')).toBe(false);
  });

  it('rechaza meses y días fuera de rango', () => {
    expect(isValidDate('2026-00-10')).toBe(false);
    expect(isValidDate('2026-13-10')).toBe(false);
    expect(isValidDate('2026-10-00')).toBe(false);
    expect(isValidDate('2026-10-32')).toBe(false);
  });

  it('acepta el último día de cada mes válido', () => {
    expect(isValidDate('2026-01-31')).toBe(true);
    expect(isValidDate('2026-04-30')).toBe(true);
    expect(isValidDate('2026-02-28')).toBe(true);
  });
});

describe('addMonths (FR-005 y caso límite del día 31)', () => {
  it('avanza un mes conservando el día', () => {
    expect(addMonths('2026-10-05', 1)).toBe('2026-11-05');
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
  });

  it('ajusta el día 31 al último día del mes destino', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('ajusta el día 31 al 29 de febrero en año bisiesto', () => {
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
  });

  it('salta varios meses y años', () => {
    expect(addMonths('2026-10-05', 12)).toBe('2027-10-05');
    expect(addMonths('2026-10-05', 3)).toBe('2027-01-05');
  });

  it('retrocede meses y años', () => {
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(addMonths('2026-01-15', -12)).toBe('2025-01-15');
    expect(addMonths('2026-01-31', -1)).toBe('2025-12-31');
  });

  it('rechaza fechas inválidas y meses no enteros', () => {
    expect(() => addMonths('2026-02-30', 1)).toThrow();
    expect(() => addMonths('2026-10-05', 1.5)).toThrow();
  });
});

describe('diffDays (FR-027, FR-032)', () => {
  it('devuelve 0 para el mismo día, con el hoy incluido', () => {
    expect(diffDays('2026-10-01', '2026-10-01')).toBe(0);
  });

  it('cuenta días calendario hacia adelante y hacia atrás', () => {
    expect(diffDays('2026-10-01', '2026-10-05')).toBe(4);
    expect(diffDays('2026-10-01', '2026-10-08')).toBe(7);
    expect(diffDays('2026-10-05', '2026-10-01')).toBe(-4);
  });

  it('cruza meses y años', () => {
    expect(diffDays('2026-10-01', '2027-03-01')).toBe(151);
    expect(diffDays('2027-03-01', '2026-10-01')).toBe(-151);
    expect(diffDays('2028-02-28', '2028-03-01')).toBe(2);
  });

  it('rechaza fechas inválidas', () => {
    expect(() => diffDays('2026-10-01', '2026-02-30')).toThrow();
  });
});

describe('endOfYear (FR-022)', () => {
  it('devuelve el 31 de diciembre del año de referencia', () => {
    expect(endOfYear('2026-10-01')).toBe('2026-12-31');
    expect(endOfYear('2028-02-29')).toBe('2028-12-31');
  });

  it('rechaza fechas inválidas', () => {
    expect(() => endOfYear('2026-13-01')).toThrow();
  });
});

describe('today (fecha local)', () => {
  it('devuelve la fecha local en formato YYYY-MM-DD', () => {
    expect(today(new Date(2026, 9, 1, 12, 0, 0))).toBe('2026-10-01');
  });

  it('usa las partes locales del instante, no las UTC', () => {
    const instant = new Date(2026, 9, 1, 23, 45, 0);
    expect(today(instant)).toBe(
      formatIsoDate({
        year: instant.getFullYear(),
        month: instant.getMonth() + 1,
        day: instant.getDate(),
      }),
    );
  });

  it('rellena con ceros meses y días de un solo dígito', () => {
    expect(today(new Date(2028, 1, 29, 8, 0, 0))).toBe('2028-02-29');
  });
});
