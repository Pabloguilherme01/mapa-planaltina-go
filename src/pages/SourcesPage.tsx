import { SchoolRegistrySection } from '../components/Sources/SchoolRegistrySection.tsx';
import { MunicipalContextSection } from '../components/Sources/MunicipalContextSection.tsx';
import { FuelRegistrySection } from '../components/Sources/FuelRegistrySection.tsx';
import { snapshotAgeLabel } from '../utils/snapshotDate.ts';
import React, { useEffect, useState } from 'react';
import { SourceInfo } from '../types/index.ts';
import { fetchSources } from '../services/apiClient.ts';
import { CommercialResearchSection } from '../components/Sources/CommercialResearchSection.tsx';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  HelpCircle,
  Info,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface SourcesPageProps {
  onBackToMap: () => void;
}

const provenanceCards = [
  {
    title: '1. Oficial',
    badge: 'Base Institucional',
    badgeClass: 'bg-emerald-100 text-emerald-900',
    titleClass: 'text-[#355E3B]',
    icon: Building2,
    description:
      'Registros publicados por órgãos públicos, com origem, identificador e data de coleta preservados. Nesta versão, estabelecimentos de saúde CNES/SES-GO entram aqui quando possuem coordenadas válidas.',
  },
  {
    title: '2. Dado aberto verificado',
    badge: 'Auditável',
    badgeClass: 'bg-blue-100 text-blue-900',
    titleClass: 'text-blue-900',
    icon: FileCheck,
    description:
      'Bases públicas auditáveis validadas por código censitário oficial, como a API IBGE 5217609 e snapshots de contingência cuja origem e geometria foram verificadas separadamente.',
  },
  {
    title: '3. Comunidade',
    badge: 'Colaborativo',
    badgeClass: 'bg-orange-100 text-[#984E2E]',
    titleClass: 'text-[#984E2E]',
    icon: ExternalLink,
    description:
      'Feições e pesquisas colaborativas alimentadas por moradores e entidades da sociedade civil, sempre separadas de dados oficiais e sujeitas a curadoria.',
  },
  {
    title: '4. DEMO (Simulação)',
    badge: 'Simulação',
    badgeClass: 'bg-[#E5B744] text-[#121E14]',
    titleClass: 'text-[#78350F]',
    icon: AlertCircle,
    description:
      'Pontos sintéticos mantidos para homologação da interface. São explicitamente separados dos registros reais e não possuem validade cadastral para deslocamento.',
  },
] as const;

function statusBadge(source: SourceInfo) {
  if (source.status === 'snapshot_fallback') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
        <ShieldCheck size={12} /> Snapshot preservado
      </span>
    );
  }
  if (source.verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
        <CheckCircle2 size={12} /> Fonte Ativa
      </span>
    );
  }
  if (source.status === 'connected' && source.id === 'osm') {
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-bold">
      Conectado · colaborativo
    </span>;
  }
  if (source.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
        <AlertCircle size={12} /> Falha de atualização
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold">
      Não Configurado
    </span>
  );
}

export const SourcesPage: React.FC<SourcesPageProps> = ({ onBackToMap }) => {
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetchSources();
      setSources(resp.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao sincronizar fontes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F5F0E6] text-[#121E14] font-sans pb-24 lg:pb-12 pt-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 mb-6">
        <button
          type="button"
          onClick={onBackToMap}
          className="touch-target w-fit px-4 py-2 rounded-xl bg-white text-[#355E3B] font-bold text-xs flex items-center gap-2 shadow-sm border border-neutral-200 hover:bg-neutral-50 active:scale-95 transition-all"
        >
          <ArrowLeft size={16} />
          <span>Voltar para o Mapa</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-100 text-[#355E3B]">
            <ShieldCheck size={28} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#121E14] tracking-tight">
              Fontes & Transparência Territorial
            </h1>
            <p className="text-xs text-neutral-600 font-medium">
              Planaltina, Goiás • Código IBGE 5217609
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#FFF4DC] border border-[#E5B744]/70 p-4 rounded-2xl mb-6 shadow-sm flex items-start gap-3 text-[#78350F]">
        <HelpCircle size={22} className="text-[#984E2E] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-extrabold text-sm mb-1">Política de Origem & Verificação</p>
          <p className="mb-1">
            O mapa publica <strong>pontos reais com procedência por registro</strong>. As fichas OSM são <strong>colaborativas e não verificadas oficialmente</strong>; pontos DEMO ficam restritos à homologação. Um registro só é publicado como real quando possui fonte auditável, data de coleta, classificação de procedência e coordenadas válidas.
          </p>
          <p>
            A camada institucional inicial é Saúde; comércio, escolas e serviços geolocalizados podem vir do OpenStreetMap. O sistema tenta atualizar o CNES/SES-GO e, se o órgão bloquear ou ficar indisponível, preserva somente o último snapshot validado e mostra esse modo explicitamente. Horários e contatos operacionais não são replicados; confirme atendimento antes do deslocamento.
          </p>
        </div>
      </div>

      <details className="mb-6 rounded-xl border border-neutral-300 p-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold text-[#355E3B]">Como classificamos a procedência</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {provenanceCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-bold flex items-center gap-2 ${card.titleClass}`}>
                    <Icon size={16} />
                    {card.title}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${card.badgeClass}`}>
                    {card.badge}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{card.description}</p>
              </article>
            );
          })}
        </div>
      </details>

      <MunicipalContextSection />
      <FuelRegistrySection />
      <SchoolRegistrySection />
      <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5" aria-labelledby="cartography-title">
        <h2 id="cartography-title" className="text-lg font-bold">Cartografia e integrações verificáveis</h2>
        <p className="my-2 text-sm">Limite municipal: malha simplificada do IBGE, código 5217609, obtida em 15/10/2026 UTC. Não substitui levantamento cadastral. Registros CNES fora da malha ficam separados para revisão, sem alterar a coordenada original.</p>
        <a className="inline-flex min-h-11 items-center underline" href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html" target="_blank" rel="noreferrer">Cartografia no IBGE</a>
        <p className="my-2 text-sm">Ônibus: integração de linhas e horários ainda não validada. Consulte o canal oficial; não são calculados itinerários nem chegadas em tempo real neste mapa.</p>
        <a className="inline-flex min-h-11 items-center underline" href="https://www.gov.br/pt-br/servicos/consultar-linhas-do-servico-rodoviario-interestadual-semiurbano-de-passageiros" target="_blank" rel="noreferrer">Consultar linhas na ANTT</a>
        <p className="my-2 text-sm">Ruas OpenStreetMap são carregadas online sob demanda do mapa visível, sem pré-download de tiles. Sem rede, pontos e limite municipal continuam disponíveis. Dados e malha são snapshots da publicação, não consultas contínuas.</p>
      </section>
      <section className="my-6 rounded-2xl border border-neutral-200 bg-white p-5" aria-labelledby="antt-official-title">
        <h2 id="antt-official-title" className="text-lg font-bold">Transporte semiurbano — fontes oficiais ANTT</h2>
        <p className="my-2 text-sm">
          A ANTT publica quadros de horários e relações de empresas, linhas e tarifas.
          Esses documentos são fontes de consulta, não dados operacionais já integrados a este mapa.
          Horários, preços e pontos de embarque ainda não são informados como itinerários confirmados
          para Planaltina-GO; é necessário distinguir Planaltina-GO de Planaltina-DF e confirmar
          a vigência diretamente com a ANTT e a operadora.
        </p>
        <div className="flex flex-col gap-1">
          <a className="inline-flex min-h-11 items-center underline" href="https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/informacoes-operacionais-do-semiurbano/quadro-de-horarios" target="_blank" rel="noopener noreferrer">
            Consultar quadro de horários na ANTT
          </a>
          <a className="inline-flex min-h-11 items-center underline" href="https://www.gov.br/antt/pt-br/assuntos/passageiros/transportesemiurbano/informacoes-operacionais-do-semiurbano/relacao-de-empresas-linhas-e-tarifas" target="_blank" rel="noopener noreferrer">
            Consultar empresas, linhas e tarifas na ANTT
          </a>
        </div>
        <p className="mt-2 text-xs text-neutral-600">Não há previsão de chegada, tarifa atual calculada ou roteamento de ônibus neste aplicativo.</p>
      </section>
      <CommercialResearchSection />

      <section aria-labelledby="adapter-status-title">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 id="adapter-status-title" className="text-xs font-bold uppercase tracking-wider text-[#355E3B]">
            Status Real dos Adaptadores de Dados (SourceAdapter)
          </h2>
          <button
            type="button"
            onClick={loadSources}
            className="touch-target text-xs text-[#355E3B] font-bold flex items-center gap-1.5 hover:underline"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar Conexões</span>
          </button>
        </div>

        {isLoading ? (
          <div role="status" className="p-8 bg-white rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500 animate-pulse">
            Verificando adaptadores municipais...
          </div>
        ) : error ? (
          <div role="alert" className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sources.map((src) => (
              <article key={src.id} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-[#121E14]">{src.name}</h3>
                      {statusBadge(src)}
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {src.agency} • Código: {src.municipalCode}
                    </span>
                  </div>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="touch-target p-2 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                    title="Visitar fonte"
                  >
                    <ExternalLink size={17} />
                  </a>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed">{src.statusMessage}</p>
                <p className="text-xs text-neutral-700">{snapshotAgeLabel(src.retrievedAt)}</p>

                <div className="p-2.5 rounded-xl bg-[#F5F0E6] text-[11px] text-neutral-600 flex items-start gap-1.5">
                  <Info size={14} className="text-[#355E3B] shrink-0 mt-0.5" />
                  <span>{src.notes}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500 font-medium border-t border-neutral-100">
                  <span>Licença: <strong className="text-neutral-700">{src.license}</strong></span>
                  <span aria-hidden="true">•</span>
                  <span>
                    Data do snapshot:{' '}
                    {src.retrievedAt ? (
                      <strong className="text-neutral-700">
                        {new Date(src.retrievedAt).toLocaleDateString('pt-BR')}
                      </strong>
                    ) : (
                      <span className="italic text-neutral-400">Pendente / indisponível</span>
                    )}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
