import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DOMAIN_DIR = 'src/domain';
const TIME_BOUNDARY_MODULE = 'src/domain/dates/today.js';
const FORBIDDEN_IMPORTS = ['react', 'react-dom', 'localStorage', 'fetch', 'window', 'document'];
const IMPLICIT_TIME_SOURCES = [
  { pattern: /\bDate\s*\.\s*now\s*\(/, description: 'Date.now()' },
  { pattern: /\bperformance\s*\.\s*now\s*\(/, description: 'performance.now()' },
  { pattern: /\bnew\s+Date\s*\(/, description: 'new Date()' },
];

function collectJsFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectJsFiles(fullPath));
      continue;
    }
    if (entry.endsWith('.js')) files.push(fullPath);
  }
  return files;
}

describe('Guardia arquitectónica de src/domain', () => {
  const files = collectJsFiles(DOMAIN_DIR);

  it('encuentra archivos de dominio para verificar', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('no importa React, almacenamiento, red ni APIs de plataforma', () => {
    const offenders = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf-8');
      for (const forbidden of FORBIDDEN_IMPORTS) {
        const importPattern = new RegExp(`(?:import|from)\\s[^\\n]*\\b${forbidden}\\b`);
        if (importPattern.test(source)) {
          offenders.push(`${file} importa o referencia "${forbidden}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no usa la hora del sistema de forma implícita', () => {
    const offenders = [];
    for (const file of files) {
      if (file === TIME_BOUNDARY_MODULE) continue;
      const source = readFileSync(file, 'utf-8');
      for (const { pattern, description } of IMPLICIT_TIME_SOURCES) {
        if (pattern.test(source)) offenders.push(`${file} usa ${description}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('concentra la lectura del reloj en dates/today.js', () => {
    const source = readFileSync(TIME_BOUNDARY_MODULE, 'utf-8');
    expect(source).toMatch(/new\s+Date\s*\(\s*\)/);
  });
});
