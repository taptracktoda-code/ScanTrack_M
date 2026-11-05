import { ensureApiBasePath } from './apiUrl';

describe('ensureApiBasePath', () => {
  it('adds /api when given a Laravel host root', () => {
    expect(ensureApiBasePath('https://example.test')).toBe('https://example.test/api');
  });

  it('preserves an existing /api suffix', () => {
    expect(ensureApiBasePath('https://example.test/api')).toBe('https://example.test/api');
  });

  it('preserves a nested base path and removes trailing slashes', () => {
    expect(ensureApiBasePath('https://example.test/backend/')).toBe('https://example.test/backend/api');
  });
});
