import React from 'react';
import { BadgeCheck, Clock3, ExternalLink, MapPinned, Store, TriangleAlert } from 'lucide-react';
import { COMMERCIAL_ANCHORS, COMMERCIAL_CORRIDORS } from '../../data/commercialResearch.ts';

const formatCheckedAt = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export const CommercialResearchSection: React.FC = () => (
  <section aria-labelledby="commercial-research-title" className="mb-8">
    <div className="flex items-start gap-3 mb-3">
      <span className="p-2 rounded-xl bg-orange-100 text-[#984E2E]">
        <Store size={20} />
      </span>
      <div>
        <h2 id="commercial-research-title" className="text-sm font-extrabold text-[#121E14]">
          Pesquisa comunitária: comércio e corredores urbanos
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed mt-1">
          A camada separa hipóteses territoriais enviadas pela comunidade de estabelecimentos checados em fontes públicas. Corredores sem geometria auditável <strong>não viram pins no mapa</strong>.
        </p>
      </div>
    </div>

    <div className="p-3 rounded-2xl bg-[#FFF4DC] border border-[#E5B744]/70 text-xs text-[#78350F] flex items-start gap-2 mb-4">
      <TriangleAlert size={17} className="shrink-0 mt-0.5" />
      <p>
        Horários e endereços comerciais mudam. As âncoras abaixo registram a situação encontrada em 14/10/2026 e devem ser confirmadas antes de qualquer deslocamento.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
      {COMMERCIAL_CORRIDORS.map((corridor) => (
        <article key={corridor.id} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-sm font-bold text-[#121E14] flex items-center gap-2">
              <MapPinned size={16} className="text-[#984E2E] shrink-0" />
              {corridor.name}
            </h3>
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-orange-100 text-[#984E2E] text-[10px] font-extrabold uppercase">
              Pendente de geometria
            </span>
          </div>
          <p className="text-[11px] font-semibold text-neutral-500 mb-2">
            {corridor.sectors.join(' • ')}
          </p>
          <p className="text-xs text-neutral-700 leading-relaxed mb-3">{corridor.summary}</p>
          <div className="text-[11px] text-neutral-500 leading-relaxed">{corridor.disclaimer}</div>
          {corridor.roadEvidenceUrl && (
            <a
              href={corridor.roadEvidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#355E3B] hover:underline"
            >
              Evidência viária pública <ExternalLink size={12} />
            </a>
          )}
        </article>
      ))}
    </div>

    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#355E3B]">
        Âncoras comerciais com checagem pública
      </h3>
      <span className="text-[11px] text-neutral-500">{COMMERCIAL_ANCHORS.length} referências</span>
    </div>

    <div className="flex flex-col gap-3">
      {COMMERCIAL_ANCHORS.map((anchor) => (
        <article key={anchor.id} className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-[#121E14]">{anchor.name}</h4>
              <p className="text-xs text-neutral-600 mt-1">{anchor.address}</p>
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                anchor.evidenceStatus === 'verified_primary'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-900'
              }`}
            >
              <BadgeCheck size={11} />
              {anchor.evidenceStatus === 'verified_primary' ? 'Fonte primária' : 'Listagem pública'}
            </span>
          </div>

          <p className="mt-3 text-xs text-neutral-700 flex items-start gap-2">
            <Clock3 size={14} className="text-[#355E3B] shrink-0 mt-0.5" />
            <span>{anchor.openingHours}</span>
          </p>

          <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500">
            <span>
              Checado em <strong className="text-neutral-700">{formatCheckedAt(anchor.checkedAt)}</strong> • {anchor.sourceName}
            </span>
            <a
              href={anchor.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#355E3B] hover:underline"
            >
              Abrir evidência <ExternalLink size={12} />
            </a>
          </div>
          <p className="mt-2 text-[10px] text-neutral-500">{anchor.disclaimer}</p>
        </article>
      ))}
    </div>
  </section>
);
