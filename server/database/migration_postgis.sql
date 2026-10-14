-- ============================================================================
-- Mapa Planaltina GO (IBGE 5217609)
-- Migration Schema: Future PostgreSQL / PostGIS Spatial Database
-- Note: Reference migration schema. No cloud billing or external provisioning is required.
-- ============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Enumerated Types for Categories and Provenance
DO $$ BEGIN
    CREATE TYPE point_category AS ENUM (
        'Saúde',
        'Educação',
        'Transporte',
        'Segurança',
        'Serviços Públicos',
        'Comércio',
        'Lazer',
        'Meio Ambiente',
        'Rural'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE provenance_type AS ENUM (
        'official',
        'verified_open_data',
        'community',
        'demo'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'verified',
        'unverified',
        'pending',
        'synthetic_demo'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Core Spatial Points Table
CREATE TABLE IF NOT EXISTS planaltina_points (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category point_category NOT NULL,
    description TEXT NOT NULL,
    
    -- PostGIS Point with SRID 4326 (WGS 84 GPS Lat/Lng)
    geom geometry(Point, 4326) NOT NULL,
    
    zone VARCHAR(32) DEFAULT 'Urbana',
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    demo_disclaimer TEXT NOT NULL DEFAULT 'Modo demonstrativo — locais ilustrativos, não use para deslocamento.',
    
    -- Provenance Metadata
    provenance provenance_type NOT NULL DEFAULT 'demo',
    source_name VARCHAR(255) NOT NULL,
    source_url TEXT,
    license VARCHAR(255) NOT NULL,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status verification_status NOT NULL DEFAULT 'synthetic_demo',
    origin_disclaimer TEXT NOT NULL DEFAULT 'A indicação de origem ou repositório não implica verificação oficial de endereço, horário de atendimento ou condições de acesso.',
    
    tags TEXT[] NOT NULL DEFAULT '{}',
    address_hint VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PostGIS Spatial GIST Index for high-performance spatial queries (BBox / ST_DWithin)
CREATE INDEX IF NOT EXISTS idx_planaltina_points_geom 
    ON planaltina_points USING GIST (geom);

-- 5. Standard B-Tree Indexes for Filters and Fast Lookups
CREATE INDEX IF NOT EXISTS idx_planaltina_points_category 
    ON planaltina_points (category);

CREATE INDEX IF NOT EXISTS idx_planaltina_points_provenance 
    ON planaltina_points (provenance);

CREATE INDEX IF NOT EXISTS idx_planaltina_points_is_demo 
    ON planaltina_points (is_demo);

-- 6. Full Text Search Index for Brazilian Portuguese
CREATE INDEX IF NOT EXISTS idx_planaltina_points_fts 
    ON planaltina_points USING GIN (
        to_tsvector('portuguese', name || ' ' || description || ' ' || COALESCE(address_hint, ''))
    );

COMMENT ON TABLE planaltina_points IS 
    'Pontos cartográficos do município de Planaltina-GO (IBGE 5217609) com suporte geoespacial PostGIS e proveniência transparente.';
