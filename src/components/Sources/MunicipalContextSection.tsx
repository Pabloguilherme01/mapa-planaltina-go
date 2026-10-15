import snapshot from '../../data/municipalContext.json';
import { DISTRICTS_URL, INDICATORS_URL, parseMunicipalContext } from '../../utils/municipalContext';
import { downloadText } from '../../utils/registryTools';

const context = parseMunicipalContext(snapshot);

export function MunicipalContextSection() {
  return <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5" aria-labelledby="municipal-context-title">
    <h2 id="municipal-context-title" className="text-lg font-bold">Planaltina em números — IBGE</h2>
    <p className="my-2 text-sm">Indicadores do Censo 2022, tabela SIDRA 4714. São referências históricas, não estimativas da população atual. Município 5217609, Goiás.</p>
    <dl className="my-4 grid gap-3 sm:grid-cols-3">{context.indicators.map(item => <div key={item.id} className="rounded-xl bg-[#F5F0E6] p-3">
      <dt className="text-sm font-semibold">{item.label}</dt><dd className="mt-1 text-xl font-bold text-[#355E3B]">{item.value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</dd><dd className="text-xs">{item.unit} • referência {context.referenceYear}</dd>
    </div>)}</dl>
    <h3 className="font-bold">Distritos no cadastro de localidades do IBGE</h3>
    <ul className="my-2 space-y-1 text-sm">{context.districts.map(district => <li key={district.id}>{district.name} • código {district.id}</li>)}</ul>
    <p className="text-sm">A lista de distritos não informa centros ou limites distritais nesta integração; não cria pins nem classifica endereços automaticamente.</p>
    <p className="mt-2 text-xs">Coleta: {new Date(context.retrievedAt).toLocaleDateString('pt-BR')}. Snapshot preservado na versão publicada. Dados públicos do IBGE; mantenha a atribuição e consulte as condições da fonte ao reutilizar.</p>
    <div className="mt-3 flex flex-wrap gap-3 text-sm">
      <a className="inline-flex min-h-11 items-center underline" href={INDICATORS_URL} target="_blank" rel="noreferrer">Fonte dos indicadores IBGE</a>
      <a className="inline-flex min-h-11 items-center underline" href={DISTRICTS_URL} target="_blank" rel="noreferrer">Fonte dos distritos IBGE</a>
      <button className="min-h-11 rounded-lg border border-neutral-500 px-3 font-semibold" type="button" onClick={() => downloadText('planaltina-contexto-ibge.json', JSON.stringify({ ...context, sources: [INDICATORS_URL, DISTRICTS_URL], notice: 'Indicadores referência 2022; distritos sem geometria. Atribuir ao IBGE.' }, null, 2), 'application/json;charset=utf-8')}>Baixar dados IBGE (JSON)</button>
    </div>
  </section>;
}
