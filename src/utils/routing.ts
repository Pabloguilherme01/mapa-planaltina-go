export function pageRoute(pathname: string): '/' | '/fontes' {
  return pathname.replace(/\/+$/, '').endsWith('/fontes') ? '/fontes' : '/';
}

export function sitePath(route: '/' | '/fontes', base: string): string {
  const prefix = `${base.replace(/\/+$/, '')}/`;
  return route === '/' ? prefix : `${prefix}fontes/`;
}
