/** Normalize API payloads — prevents .map/.filter crashes on Vercel/production */
export function ensureArray(value, label = 'data') {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  console.warn(`[Overview] Expected array for ${label}, got:`, typeof value, value);
  return [];
}

export function logOverviewError(scope, error) {
  console.error(`[Overview:${scope}]`, error?.message ?? error, error);
}
