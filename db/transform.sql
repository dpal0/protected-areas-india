-- ============================================================
-- Transform wdpa_raw (polygons) + wdpa_points_raw (points)
-- into the normalized protected_areas table.
--
-- Column names confirmed from \d wdpa_raw / \d wdpa_points_raw:
--   site_id, site_pid, site_type, name, name_eng, desig, desig_eng,
--   desig_type, iucn_cat, iso3, status, status_yr, rep_area, gis_area
--   (gis_area only exists on wdpa_raw, not on points), verif,
--   geometry column = wkb_geometry
-- ============================================================

-- ------------------------------------------------------------
-- 1. Polygons (primary source -- has GIS area, real boundaries)
-- ------------------------------------------------------------
INSERT INTO protected_areas (
  site_id, wdpa_id, source, name, name_eng, designation, iucn_category,
  country, year_established, reported_area_km2, gis_area_km2,
  status, verification, is_world_heritage_site, geom, raw_attributes
)
SELECT
  site_id::integer                                          AS site_id,
  site_id::integer                                          AS wdpa_id,
  'WDPA'                                                      AS source,
  name,
  name_eng,
  desig_eng                                                  AS designation,
  NULLIF(iucn_cat, 'Not Reported')                           AS iucn_category,
  iso3                                                        AS country,
  NULLIF(status_yr, 0)::integer                              AS year_established,
  NULLIF(rep_area, 0)                                        AS reported_area_km2,
  NULLIF(gis_area, 0)                                        AS gis_area_km2,
  status,
  verif                                                       AS verification,
  (desig_eng = 'World Heritage Site (natural or mixed)')     AS is_world_heritage_site,
  wkb_geometry                                                AS geom,
  to_jsonb(w) - 'wkb_geometry'                               AS raw_attributes
FROM wdpa_raw w
ON CONFLICT (site_id) DO UPDATE SET
  name = EXCLUDED.name,
  name_eng = EXCLUDED.name_eng,
  designation = EXCLUDED.designation,
  iucn_category = EXCLUDED.iucn_category,
  country = EXCLUDED.country,
  year_established = EXCLUDED.year_established,
  reported_area_km2 = EXCLUDED.reported_area_km2,
  gis_area_km2 = EXCLUDED.gis_area_km2,
  status = EXCLUDED.status,
  verification = EXCLUDED.verification,
  is_world_heritage_site = EXCLUDED.is_world_heritage_site,
  geom = EXCLUDED.geom,
  raw_attributes = EXCLUDED.raw_attributes;

-- ------------------------------------------------------------
-- 2. Points (areas with no polygon boundary -- gis_area doesn't exist here)
--    ON CONFLICT DO NOTHING: if a site_id somehow exists in both tables,
--    the polygon version (inserted above) wins.
-- ------------------------------------------------------------
INSERT INTO protected_areas (
  site_id, wdpa_id, source, name, name_eng, designation, iucn_category,
  country, year_established, reported_area_km2, gis_area_km2,
  status, verification, is_world_heritage_site, geom, raw_attributes
)
SELECT
  site_id::integer                                          AS site_id,
  site_id::integer                                          AS wdpa_id,
  'WDPA'                                                      AS source,
  name,
  name_eng,
  desig_eng                                                  AS designation,
  NULLIF(iucn_cat, 'Not Reported')                           AS iucn_category,
  iso3                                                        AS country,
  NULLIF(status_yr, 0)::integer                              AS year_established,
  NULLIF(rep_area, 0)                                        AS reported_area_km2,
  NULL                                                        AS gis_area_km2,  -- not present for points
  status,
  verif                                                       AS verification,
  (desig_eng = 'World Heritage Site (natural or mixed)')     AS is_world_heritage_site,
  wkb_geometry                                                AS geom,
  to_jsonb(p) - 'wkb_geometry'                               AS raw_attributes
FROM wdpa_points_raw p
ON CONFLICT (site_id) DO NOTHING;

-- ------------------------------------------------------------
-- Sanity checks
-- ------------------------------------------------------------
SELECT count(*) AS total_parks,
       count(*) FILTER (WHERE is_world_heritage_site) AS whs_count,
       count(*) FILTER (WHERE ST_GeometryType(geom) IN ('ST_MultiPoint','ST_Point')) AS point_records,
       count(*) FILTER (WHERE ST_GeometryType(geom) IN ('ST_MultiPolygon','ST_Polygon')) AS polygon_records
FROM protected_areas;

-- Worth checking: confirm the WHS designation string actually matches
-- what's in this export -- if whs_count is 0 but you expect ~40, run:
--   SELECT DISTINCT desig_eng FROM wdpa_raw WHERE desig_eng ILIKE '%world heritage%';
-- and adjust the is_world_heritage_site condition above if the string differs.