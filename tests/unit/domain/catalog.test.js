import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_VALUES,
  categoryLabel,
  isValidCategory,
} from '@/domain/catalog/categories.js';
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  STATUS_ACTIVE,
  STATUS_CANCELLED,
  STATUS_PAUSED,
  STATUS_VALUES,
  frequencyLabel,
  isValidFrequency,
  isValidStatus,
  statusLabel,
} from '@/domain/catalog/frequencies.js';

describe('Catálogo de categorías (FR-003)', () => {
  it('expone exactamente las 8 categorías predeterminadas en español', () => {
    expect(CATEGORIES.map((category) => category.label)).toEqual([
      'Entretenimiento',
      'Trabajo',
      'Salud',
      'Educación',
      'Hogar',
      'Utilidades',
      'Finanzas',
      'Otros',
    ]);
  });

  it('persiste los valores en mayúsculas y sin tildes', () => {
    for (const value of CATEGORY_VALUES) {
      expect(value).toBe(value.toUpperCase());
      expect(value).toMatch(/^[A-Z_]+$/);
    }
  });

  it('asocia cada valor con su etiqueta visible', () => {
    expect(categoryLabel('EDUCACION')).toBe('Educación');
    expect(categoryLabel('ENTRETENIMIENTO')).toBe('Entretenimiento');
  });

  it('devuelve el valor recibido cuando la etiqueta no existe', () => {
    expect(categoryLabel('DESCONOCIDA')).toBe('DESCONOCIDA');
  });

  it('acepta solo valores del catálogo', () => {
    expect(isValidCategory('TRABAJO')).toBe(true);
    expect(isValidCategory('Trabajo')).toBe(false);
    expect(isValidCategory('Educación')).toBe(false);
    expect(isValidCategory('')).toBe(false);
    expect(isValidCategory(undefined)).toBe(false);
  });
});

describe('Catálogo de frecuencias (FR-002)', () => {
  it('define un conjunto cerrado de dos frecuencias', () => {
    expect(FREQUENCIES.MONTHLY).toBe('MENSUAL');
    expect(FREQUENCIES.YEARLY).toBe('ANUAL');
    expect(isValidFrequency('MENSUAL')).toBe(true);
    expect(isValidFrequency('ANUAL')).toBe(true);
    expect(isValidFrequency('SEMANAL')).toBe(false);
  });

  it('expone las etiquetas visibles en español', () => {
    expect(FREQUENCY_LABELS[FREQUENCIES.MONTHLY]).toBe('Mensual');
    expect(FREQUENCY_LABELS[FREQUENCIES.YEARLY]).toBe('Anual');
    expect(frequencyLabel('ANUAL')).toBe('Anual');
    expect(frequencyLabel('SEMANAL')).toBe('SEMANAL');
  });
});

describe('Catálogo de estados (FR-006)', () => {
  it('define Activa, Pausada y Cancelada como únicos estados válidos', () => {
    expect(STATUS_ACTIVE).toBe('ACTIVA');
    expect(STATUS_PAUSED).toBe('PAUSADA');
    expect(STATUS_CANCELLED).toBe('CANCELADA');
    expect(STATUS_VALUES).toEqual(['ACTIVA', 'PAUSADA', 'CANCELADA']);
    expect(isValidStatus('ACTIVA')).toBe(true);
    expect(isValidStatus('PAUSADA')).toBe(true);
    expect(isValidStatus('CANCELADA')).toBe(true);
    expect(isValidStatus('BAJADA')).toBe(false);
  });

  it('expone las etiquetas visibles en español', () => {
    expect(statusLabel('ACTIVA')).toBe('Activa');
    expect(statusLabel('PAUSADA')).toBe('Pausada');
    expect(statusLabel('CANCELADA')).toBe('Cancelada');
    expect(statusLabel('DESCONOCIDO')).toBe('DESCONOCIDO');
  });
});
