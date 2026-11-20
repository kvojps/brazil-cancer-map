export function readTheme(params: URLSearchParams): 'light' | 'dark' | null {
  const value = params.get('theme');
  return value === 'light' || value === 'dark' ? value : null;
}
