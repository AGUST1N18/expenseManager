export class FakeStorage {
  constructor(initial = {}) {
    this.items = new Map(Object.entries(initial));
    this.failOnRead = false;
    this.failOnWrite = false;
    this.failOnRemove = false;
    this.writeError = new Error('cuota de almacenamiento excedida');
    this.readCount = 0;
    this.writeCount = 0;
  }

  getItem(key) {
    this.readCount += 1;
    if (this.failOnRead) {
      throw this.writeError;
    }
    return this.items.has(key) ? this.items.get(key) : null;
  }

  setItem(key, value) {
    this.writeCount += 1;
    if (this.failOnWrite) {
      throw this.writeError;
    }
    this.items.set(key, String(value));
  }

  removeItem(key) {
    if (this.failOnRemove) {
      throw this.writeError;
    }
    this.items.delete(key);
  }

  simulateQuotaExceeded() {
    this.failOnWrite = true;
    this.writeError = new Error('cuota de almacenamiento excedida');
  }

  simulateUnavailable() {
    this.failOnRead = true;
    this.failOnWrite = true;
    this.failOnRemove = true;
    this.writeError = new Error('el almacenamiento no está disponible');
  }

  raw(key) {
    return this.items.has(key) ? this.items.get(key) : null;
  }

  seed(key, value) {
    this.items.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
}
