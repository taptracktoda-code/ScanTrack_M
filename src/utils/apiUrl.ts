export function ensureApiBasePath(value: string) {
  const url = new URL(value);
  const pathname = url.pathname.replace(/\/+$/, '');
  if (!/\/api$/i.test(pathname)) {
    url.pathname = `${pathname}/api`;
  }
  return url.toString().replace(/\/$/, '');
}
