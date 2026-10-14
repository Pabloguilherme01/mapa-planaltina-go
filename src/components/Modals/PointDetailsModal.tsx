import React, { useEffect, useRef } from 'react';
import { MapPoint } from '../../types/index.ts';
import { CATEGORY_CONFIG } from '../../utils/categoryMeta.ts';
import { PROVENANCE_CONFIG } from '../../utils/provenanceMeta.ts';
import { X, Lock, AlertTriangle, ExternalLink } from 'lucide-react';

interface PointDetailsModalProps {
  point: MapPoint | null;
  onClose: () => void;
}

export const PointDetailsModal: React.FC<PointDetailsModalProps> = ({ point, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Focus trap & Escape listener
  useEffect(() => {
    if (point) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Focus first element or container
      setTimeout(() => {
        const firstBtn = modalRef.current?.querySelector<HTMLElement>('button');
        firstBtn?.focus();
      }, 50);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        previouslyFocusedElement.current?.focus?.();
      };
    }
  }, [point, onClose]);

  if (!point) return null;

  const catConfig = CATEGORY_CONFIG[point.category];
  const provConfig = PROVENANCE_CONFIG[point.provenanceMeta.provenance];

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
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wide">
            Ficha Demonstrativa DEMO
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

        {/* Title and Category */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#BA623D]">
            {point.category} • {point.zone}
          </span>
          <h3 id="fichaTitulo" className="text-lg font-bold text-[#121E14] leading-tight mt-1">
            {point.name}
          </h3>
          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
            {point.description}
          </p>
        </div>

        {/* Mandatory Intentional Omission Box */}
        <div className="bg-[#EAE3D2]/70 rounded-2xl p-3.5 flex flex-col gap-1 border border-[#355E3B]/10">
          <div className="flex items-center gap-1.5 text-[#121E14]">
            <Lock size={16} className="text-[#BA623D]" />
            <span className="text-xs font-bold">Omissão Intencional de Contatos</span>
          </div>
          <p className="text-xs text-[#424941] leading-relaxed">
            Telefones, e-mails e números prediais foram intencionalmente omitidos por se tratarem de dados não verificados em <strong>Planaltina, Goiás</strong>.
          </p>
        </div>

        {/* Technical Attributes Table */}
        <div className="bg-[#F5F0E6] rounded-xl p-3.5 flex flex-col gap-2 text-xs border border-neutral-200">
          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60">
            <span className="text-neutral-600 font-medium">Identificador:</span>
            <span className="font-mono font-bold text-[#121E14]">{point.id}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60">
            <span className="text-neutral-600 font-medium">Município:</span>
            <span className="font-bold text-[#121E14]">Planaltina, Goiás (IBGE 5217609)</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60">
            <span className="text-neutral-600 font-medium">Status Cadastral:</span>
            <span className="text-rose-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Não Verificado (DEMO)
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60">
            <span className="text-neutral-600 font-medium">Nível de Procedência:</span>
            <span className="font-bold text-[#121E14]">{provConfig.label}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60">
            <span className="text-neutral-600 font-medium">Licença Declarada:</span>
            <span className="font-semibold text-neutral-800">{point.provenanceMeta.license}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 border-b border-neutral-200/60">
            <span className="text-neutral-600 font-medium">Coordenadas Esquemáticas:</span>
            <span className="font-mono text-neutral-700">
              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </span>
          </div>

          <div className="flex flex-col pt-1">
            <span className="text-neutral-600 font-medium">Localização Declarada:</span>
            <span className="font-semibold text-[#121E14] mt-0.5">
              {point.addressHint || 'Setor demonstrativo de Planaltina, Goiás'}
            </span>
          </div>
        </div>

        {/* Origin Disclaimer */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs text-[#78350F]">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-700" />
          <p className="leading-tight text-[11px]">
            <strong>Aviso de Procedência:</strong> A indicação de repositório ou catálogo governamental não implica verificação oficial de horário, endereço ou rota de atendimento.
          </p>
        </div>

        {/* Tags */}
        {point.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {point.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md text-[11px] font-semibold"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {point.provenanceMeta.sourceUrl && (
            <a
              href={point.provenanceMeta.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#121E14] text-xs font-bold flex items-center justify-center gap-1.5 border border-neutral-300"
            >
              <span>Fonte Oficial</span>
              <ExternalLink size={14} />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            className="touch-target flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-[#BA623D] hover:bg-[#a14f2c] text-white text-xs font-bold shadow active:scale-95 transition-all"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
