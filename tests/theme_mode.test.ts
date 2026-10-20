import { describe, it, expect } from 'vitest';
import { resolveTheme, parseThemeChoice } from '../src/utils/themeMode.ts';
describe('preferência de aparência nativa', () => {
  it('respeita a escolha e o modo escuro do sistema operacional', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
  it('não aceita valores desconhecidos no armazenamento local', () => {
    expect(parseThemeChoice('dark')).toBe('dark');
    expect(parseThemeChoice('system')).toBe('system');
    expect(parseThemeChoice('<script>')).toBe('system');
    expect(parseThemeChoice(null)).toBe('system');
  });
});
