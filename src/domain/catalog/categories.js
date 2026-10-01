export const CATEGORIES = [
  { value: 'ENTRETENIMIENTO', label: 'Entretenimiento' },
  { value: 'TRABAJO', label: 'Trabajo' },
  { value: 'SALUD', label: 'Salud' },
  { value: 'EDUCACION', label: 'Educación' },
  { value: 'HOGAR', label: 'Hogar' },
  { value: 'UTILIDADES', label: 'Utilidades' },
  { value: 'FINANZAS', label: 'Finanzas' },
  { value: 'OTROS', label: 'Otros' },
];

export const CATEGORY_VALUES = CATEGORIES.map((category) => category.value);

const CATEGORY_VALUE_SET = new Set(CATEGORY_VALUES);

export function isValidCategory(value) {
  return typeof value === 'string' && CATEGORY_VALUE_SET.has(value);
}

export function categoryLabel(value) {
  const category = CATEGORIES.find((entry) => entry.value === value);
  return category === undefined ? value : category.label;
}
