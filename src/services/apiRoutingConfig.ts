/** A publicação estática não pode ser redirecionada a uma API externa por configuração. */
export function resolveApiRouting(
  staticModeEnv: string | undefined,
  apiBaseEnv: string | undefined
): { staticMode: boolean; apiBase: string } {
  const staticMode = staticModeEnv === 'true';
  return {
    staticMode,
    apiBase: staticMode ? '' : (apiBaseEnv ?? '').replace(/\/+$/, ''),
  };
}
