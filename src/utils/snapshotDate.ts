/** A collection timestamp must identify a real UTC instant, never a future one. */
export function isSnapshotDate(value: unknown, now = Date.now()): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp > now) return false;
  const canonical = value.includes('.') ? value : value.replace('Z', '.000Z');
  return new Date(timestamp).toISOString() === canonical;
}
