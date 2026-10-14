export function hasGoogleMapsApiKey(apiKey?: string): boolean {
  if (!apiKey) return false;
  const normalized = apiKey.trim();
  return normalized.length > 0 && normalized !== 'YOUR_API_KEY_HERE';
}
