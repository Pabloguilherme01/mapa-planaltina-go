export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';
export const themeStorageKey = 'planaltina-appearance-v1';
export function parseThemeChoice(value: unknown): ThemeChoice {
  return value === 'dark' || value === 'light' ? value : 'system';
}
export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ResolvedTheme {
  return choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;
}
