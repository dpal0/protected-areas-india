-- ============================================================
-- Schema for the India Protected Areas database
-- Run with: psql "postgresql://dev:dev@localhost:5432/parks" -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------
-- Core spatial + attribute table (one row per protected area)
-- This is populated from WDPA (or other source) via transform.sql
-- ------------------------------------------------------------
CREATE TABLE protected_areas (
  id                SERIAL PRIMARY KEY,
  site_id           INTEGER UNIQUE NOT NULL,   -- stable id used by frontend (promoteId)
  wdpa_id           INTEGER,
  source            TEXT NOT NULL DEFAULT 'WDPA',
  name              TEXT NOT NULL,
  name_eng          TEXT,
  designation       TEXT,
  iucn_category     TEXT,
  state             TEXT,
  country           TEXT DEFAULT 'IND',
  year_established  INTEGER,
  reported_area_km2 NUMERIC,
  gis_area_km2      NUMERIC,
  status            TEXT,
  verification      TEXT,
  is_world_heritage_site BOOLEAN DEFAULT FALSE,
  geom              GEOMETRY(Geometry, 4326) NOT NULL,
  raw_attributes    JSONB                       -- full original attribute row, for fields not normalized above
);

CREATE INDEX protected_areas_geom_idx ON protected_areas USING GIST (geom);
CREATE INDEX protected_areas_site_id_idx ON protected_areas (site_id);

-- ------------------------------------------------------------
-- World Heritage OUV info (only rows for WHS parks)
-- ------------------------------------------------------------
CREATE TABLE world_heritage_info (
  park_id INTEGER PRIMARY KEY REFERENCES protected_areas(id) ON DELETE CASCADE,
  inscription_year INTEGER,
  ouv_criteria TEXT[],          -- e.g. {ix, x}
  ouv_description TEXT
);

-- ------------------------------------------------------------
-- Overview tab
-- ------------------------------------------------------------
CREATE TABLE park_overview (
  park_id INTEGER PRIMARY KEY REFERENCES protected_areas(id) ON DELETE CASCADE,
  short_summary TEXT,
  description TEXT
);

CREATE TABLE park_images (
  id SERIAL PRIMARY KEY,
  park_id INTEGER NOT NULL REFERENCES protected_areas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  credit TEXT,
  display_order INTEGER DEFAULT 0
);

-- ------------------------------------------------------------
-- Research tab: initiatives/programs + flora & fauna
-- ------------------------------------------------------------
CREATE TABLE research_initiatives (
  id SERIAL PRIMARY KEY,
  park_id INTEGER NOT NULL REFERENCES protected_areas(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'initiative',  -- 'initiative' | 'research_program' | 'flora_fauna_note'
  title TEXT NOT NULL,
  organization TEXT,
  description TEXT,
  link TEXT
);

CREATE TABLE species (
  id SERIAL PRIMARY KEY,
  park_id INTEGER NOT NULL REFERENCES protected_areas(id) ON DELETE CASCADE,
  category TEXT NOT NULL,        -- 'flora' | 'fauna'
  common_name TEXT,
  scientific_name TEXT,
  iucn_status TEXT,
  notes TEXT
);

-- ------------------------------------------------------------
-- Visit tab
-- ------------------------------------------------------------
CREATE TABLE visitor_info (
  park_id INTEGER PRIMARY KEY REFERENCES protected_areas(id) ON DELETE CASCADE,
  official_website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  nearest_city TEXT,
  nearest_city_km NUMERIC,
  nearest_airport TEXT,
  nearest_airport_km NUMERIC,
  entry_fees TEXT,
  best_season TEXT,
  permits_required TEXT
);