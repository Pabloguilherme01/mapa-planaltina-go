import React, { useRef } from 'react';
import { useDialogFocus } from '../../hooks/useDialogFocus.ts';
import { MapPoint } from '../../types/index.ts';
import { routeUrl } from '../../utils/mobility.ts';
import { PROVENANCE_CONFIG } from '../../utils/provenanceMeta.ts';
import { X, Lock, AlertTriangle, ExternalLink, BadgeCheck } from 'lucide-react';

interface PointDetailsModalProps {
  point: MapPoint | null;
  onClose: () => void;
}

export const PointDetailsModal: React.FC<PointDetailsModalProps> = ({ point, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useDialogFocus(Boolean(point), onClose, modalRef);

  if (!point) return null;

  const provConfig = PROVENANCE_CONFIG[point.provenanceMeta.provenance];
  const isReal = !point.isDemo;
  const isVerified = isReal && point.provenanceMeta.verificationStatus === 'verified';
  const retrievedDate = point.provenanceMeta.retrievedAt
    ? new Date(point.provenanceMeta.retrievedAt).toLocaleDateString('pt-BR')
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fichaTitulo"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-md bg-white rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto focus:outline-none border border-neutral-200"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${
              isReal
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-amber-100 text-amber-950'
            }`}
          >
            {isReal && <BadgeCheck size={13} />}
            {isVerified ? 'Dado real verificado' : isReal ? 'Mapeado pela comunidade · não verificado' : 'Ficha Demonstrativa DEMO'}
          </span>
          <button
            type="button"
            aria-label="Fechar ficha cadastral"
            onClick={onClose}
            className="touch-target w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#984E2E]">
            {point.category} • {point.zone}
          </span>
          <h3 id="fichaTitulo" className="text-lg font-bold text-[#121E14] leading-tight mt-1">
            {point.name}
          </h3>
          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{point.description}</p>
        </div>

        <div className="bg-[#EAE3D2]/70 rounded-2xl p-3.5 flex flex-col gap-1 border border-[#355E3B]/10">
          <div className="flex items-center gap-1.5 text-[#121E14]">
            <Lock size={16} className="text-[#984E2E]" />
            <span className="text-xs font-bold">
              {isReal ? 'Contatos não replicados' : 'Omissão Intencional de Contatos'}
            </span>
          </div>
          <p className="text-xs text-[#424941] leading-relaxed">
            {isReal
              ? 'Contatos não são replicados. Para cadastros colaborativos, confirme estabelecimento, localização e atendimento na fonte antes de sair.'
              : 'Telefones, e-mails e números prediais foram intencionalmente omitidos por se tratarem de dados não verificados em Planaltina, Goiás.'}
          </p>
        </div>

        <div className="bg-[#F5F0E6] rounded-xl p-3.5 flex flex-col gap-2 text-xs border border-neutral-200">
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60 gap-3">
            <span className="text-neutral-600 font-medium">Identificador:</span>
            <span className="font-mono font-bold text-[#121E14] text-right">{point.id}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60 gap-3">
            <span className="text-neutral-600 font-medium">Município:</span>
            <span className="font-bold text-[#121E14] text-right">Planaltina, Goiás (IBGE 5217609)</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60 gap-3">
            <span className="text-neutral-600 font-medium">Status Cadastral:</span>
            <span className={`font-bold flex items-center gap-1 text-right ${isVerified ? 'text-emerald-800' : isReal ? 'text-orange-800' : 'text-rose-700'}`}>
              <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-600' : isReal ? 'bg-orange-600' : 'bg-rose-600'}`} />
              {isVerified ? 'Verificado na fonte' : isReal ? 'Cadastro colaborativo não verificado' : 'Não Verificado (DEMO)'}
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60 gap-3">
            <span className="text-neutral-600 font-medium">Nível de Procedência:</span>
            <span className="font-bold text-[#121E14] text-right">{provConfig.label}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60 gap-3">
            <span className="text-neutral-600 font-medium">Licença / uso:</span>
            <span className="font-semibold text-neutral-800 text-right">{point.provenanceMeta.license}</span>
          </div>
          {retrievedDate && (
            <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60 gap-3">
              <span className="text-neutral-600 font-medium">Snapshot consultado:</span>
              <span className="font-semibold text-neutral-800">{retrievedDate}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60 gap-3">
            <span className="text-neutral-600 font-medium">
              {isReal ? 'Coordenadas publicadas:' : 'Coordenadas Esquemáticas:'}
            </span>
            <span className="font-mono text-neutral-700">
              {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
            </span>
          </div>
          <div className="flex flex-col pt-1">
            <span className="text-neutral-600 font-medium">Localização Declarada:</span>
            <span className="font-semibold text-[#121E14] mt-0.5">
              {point.addressHint || 'Localização não informada'}
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${isReal ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200/80 text-[#78350F]'}`}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p className="leading-tight text-[11px]">
            <strong>Aviso de Procedência:</strong> {point.provenanceMeta.disclaimer}
          </p>
        </div>

        {point.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {point.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md text-[11px] font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {isReal && (
          <div className="grid grid-cols-2 gap-2" aria-label="Abrir localização em aplicativos de mapas">
            {([
              ['google', 'Google Maps · rotas'],
              ['waze', 'Waze · carro'],
              ['apple', 'Apple Maps · rotas'],
              ['organic', 'Organic Maps · ponto'],
            ] as const).map(([provider, title]) => (
              <a key={provider} href={routeUrl(point, 'driving', provider)}
                target="_blank" rel="noopener noreferrer"
                className="touch-target min-h-11 rounded-lg border border-[#355E3B]/30 bg-[#F5F0E6] p-2 text-center text-xs font-bold text-[#355E3B]">
                {title}
              </a>
            ))}
            <p className="col-span-2 text-[11px] text-neutral-600">Rotas e trânsito são calculados no aplicativo externo; a origem não é enviada por este mapa. Confirme o local antes de sair.</p>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          {point.provenanceMeta.sourceUrl && (
            <a
              href={point.provenanceMeta.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#121E14] text-xs font-bold flex items-center justify-center gap-1.5 border border-neutral-300"
            >
              <span>Abrir fonte</span>
              <ExternalLink size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#B05835] hover:bg-[#984E2E] text-white text-xs font-bold shadow active:scale-95 transition-all"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
