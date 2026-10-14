import React from 'react';
import { X, Database, Terminal, CheckCircle2, Copy } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sqlSchema = `-- PostGIS Spatial Schema for Planaltina-GO (IBGE 5217609)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE point_category AS ENUM (
    'Saúde', 'Educação', 'Transporte', 'Segurança', 
    'Serviços Públicos', 'Comércio', 'Lazer', 'Meio Ambiente', 'Rural'
);

CREATE TYPE provenance_type AS ENUM (
    'official', 'verified_open_data', 'community', 'demo'
);

CREATE TABLE IF NOT EXISTS planaltina_points (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category point_category NOT NULL,
    description TEXT NOT NULL,
    geom geometry(Point, 4326) NOT NULL,
    zone VARCHAR(32) DEFAULT 'Urbana',
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    demo_disclaimer TEXT NOT NULL,
    provenance provenance_type NOT NULL DEFAULT 'demo',
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PostGIS Spatial GIST Index for boundary queries (BBox & ST_DWithin)
CREATE INDEX idx_planaltina_points_geom 
    ON planaltina_points USING GIST (geom);`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="docsTitulo"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-sans animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col gap-4 max-h-[88vh] overflow-y-auto border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-800">
              <Database size={24} />
            </span>
            <div>
              <h2 id="docsTitulo" className="text-lg font-bold text-[#121E14]">
                Arquitetura Geoespacial & PostGIS
              </h2>
              <p className="text-xs text-neutral-500">
                Especificação técnica de persistência para Planaltina, Goiás
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar documentação"
            onClick={onClose}
            className="touch-target w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-[#F5F0E6] p-3.5 rounded-2xl flex flex-col gap-1.5 text-xs text-[#121E14]">
          <div className="flex items-center gap-2 font-bold text-[#355E3B]">
            <CheckCircle2 size={16} />
            <span>Repositório em Memória com Interface Futura PostgreSQL/PostGIS</span>
          </div>
          <p className="text-neutral-600 leading-relaxed text-[11px]">
            O protótipo opera nativamente com o <code>InMemoryPointsRepository</code> sem provisionar instâncias de banco de dados nem gerar custos de faturamento. A migração SQL abaixo define o contrato para quando uma base relacional PostGIS for acoplada.
          </p>
        </div>

        {/* SQL Snippet */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span className="font-mono text-[11px] font-semibold flex items-center gap-1">
              <Terminal size={14} />
              server/database/migration_postgis.sql
            </span>
            <span className="text-[10px] text-neutral-500">SRID 4326 (WGS 84)</span>
          </div>
          <pre className="p-3.5 bg-neutral-900 text-neutral-100 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-neutral-800">
            {sqlSchema}
          </pre>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <span className="font-bold text-[#355E3B] block mb-1">Índice Espacial GIST</span>
            <p className="text-[11px] text-neutral-600">
              Permite buscas eficientes por Bounding Box (BBox) e raio de proximidade (ST_DWithin) em milissegundos.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
            <span className="font-bold text-[#355E3B] block mb-1">Tipos Enum Nativos</span>
            <p className="text-[11px] text-neutral-600">
              Garante que apenas as 9 categorias cívicas e os 4 níveis de proveniência sejam gravados no banco de dados.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="touch-target w-full min-h-[44px] py-2.5 rounded-xl bg-[#355E3B] text-white font-sans text-xs font-bold shadow hover:bg-[#27472c] active:scale-95 transition-all mt-1"
        >
          Fechar Documentação
        </button>
      </div>
    </div>
  );
};
