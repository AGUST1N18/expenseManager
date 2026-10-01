import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const dataLayerFiles = ['src/data/**/*.js', 'src/data/**/*.jsx'];

const sourceFiles = [
  '*.js',
  '*.jsx',
  'src/**/*.js',
  'src/**/*.jsx',
  'tests/**/*.js',
  'tests/**/*.jsx',
];

export default [
  {
    ignores: [
      'dist/**',
      'dist-ssr/**',
      'coverage/**',
      'node_modules/**',
      'opencode/**',
      'public/**',
      '*.local',
    ],
  },
  {
    files: sourceFiles,
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['tests/**/*.js', 'tests/**/*.jsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['src/**/*.js', 'src/**/*.jsx'],
    ignores: dataLayerFiles,
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Constitución I: el acceso a localStorage solo está permitido en src/data/.',
        },
        {
          name: 'sessionStorage',
          message: 'Constitución I: el acceso a sessionStorage solo está permitido en src/data/.',
        },
        {
          name: 'indexedDB',
          message: 'Constitución I: el acceso a indexedDB solo está permitido en src/data/.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'document',
          property: 'cookie',
          message: 'Constitución I: el acceso a cookies está prohibido.',
        },
        {
          property: 'localStorage',
          message:
            'Constitución I: el acceso directo a localStorage está prohibido; usá el repositorio.',
        },
      ],
    },
  },
  {
    files: ['src/domain/**/*.js'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'document',
          message: 'Constitución II: el dominio no debe depender del DOM.',
        },
        {
          name: 'window',
          message: 'Constitución II: el dominio no debe depender del navegador.',
        },
        {
          name: 'localStorage',
          message: 'Constitución II: el dominio no puede acceder al almacenamiento.',
        },
        {
          name: 'fetch',
          message: 'Constitución II: el dominio no puede acceder a la red.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.name="Date"][property.name="now"]',
          message: 'Constitución II: la hora del sistema debe inyectarse como parámetro { now }.',
        },
        {
          selector: 'CallExpression[callee.name="fetch"]',
          message: 'Constitución II: el dominio no puede acceder a la red.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: 'Constitución II: el dominio no puede importar React.',
            },
            {
              name: 'react-dom',
              message: 'Constitución II: el dominio no puede importar React.',
            },
          ],
          patterns: [
            {
              group: [
                '**/data',
                '**/data/**',
                '**/services',
                '**/services/**',
                '**/state',
                '**/state/**',
                '**/components',
                '**/components/**',
              ],
              message: 'Constitución II: el dominio no puede depender de la capa de aplicación.',
            },
          ],
        },
      ],
    },
  },
];
