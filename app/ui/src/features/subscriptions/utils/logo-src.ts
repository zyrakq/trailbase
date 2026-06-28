export function logoSrc(url: string, updatedAt: number): string {
  if (!url || !url.startsWith('/subscription-logos/')) return url;
  return `${url}?_t=${updatedAt}`;
}
