import type { MapPoint } from '../../types/index.ts';

const pageSize = 40;

export function createClusterPanel(points: readonly MapPoint[], onSelect: (point: MapPoint) => void) {
  const panel = document.createElement('section');
  panel.className = 'municipal-cluster-panel';
  panel.setAttribute('aria-label', 'Selecionar local no agrupamento');

  const heading = document.createElement('strong');
  heading.textContent = `${points.length} locais neste ponto`;
  const options = document.createElement('div');
  options.className = 'municipal-cluster-options';
  panel.append(heading, options);

  const range = document.createElement('p');
  range.className = 'municipal-cluster-hint';
  range.setAttribute('role', 'status');
  const previous = document.createElement('button');
  const next = document.createElement('button');
  previous.type = next.type = 'button';
  previous.textContent = 'Anteriores';
  next.textContent = 'Próximos';
  previous.className = next.className = 'municipal-cluster-choice';
  if (points.length > pageSize) {
    const controls = document.createElement('div');
    controls.className = 'flex';
    controls.append(previous, next);
    panel.append(range, controls);
  }

  function showPage(start: number, focusList: boolean) {
    const end = Math.min(start + pageSize, points.length);
    const buttons = points.slice(start, end).map(point => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'municipal-cluster-choice';
      option.textContent = `${point.name} · ${point.category}`;
      option.onclick = () => onSelect(point);
      return option;
    });
    options.replaceChildren(...buttons);
    options.scrollTop = 0;
    previous.disabled = start === 0;
    next.disabled = end === points.length;
    range.textContent = `Locais ${start + 1} a ${end} de ${points.length}`;
    previous.onclick = () => showPage(start - pageSize, true);
    next.onclick = () => showPage(end, true);
    if (focusList) buttons[0]?.focus({ preventScroll: true });
  }

  showPage(0, false);
  return panel;
}
