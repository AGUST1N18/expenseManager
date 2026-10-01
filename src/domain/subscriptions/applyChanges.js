export const EDITABLE_FIELDS = ['name', 'amount', 'frequency', 'category', 'nextChargeDate'];

export function applyChanges(subscription, changes = {}) {
  const updated = { ...subscription };

  for (const field of EDITABLE_FIELDS) {
    if (Object.hasOwn(changes, field)) {
      updated[field] = field === 'name' ? changes.name.trim() : changes[field];
    }
  }

  return updated;
}
