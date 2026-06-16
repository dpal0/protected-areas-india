import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/parks
// Lean GeoJSON FeatureCollection for the map layer.
// Mirrors the shape of the old static /parks.geojson file, with
// `properties` trimmed to just what MapView needs for styling/popups.
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'id', site_id,
            'geometry', ST_AsGeoJSON(geom)::jsonb,
            'properties', jsonb_build_object(
              'SITE_ID', site_id,
              'NAME_ENG', name_eng,
              'NAME', name,
              'DESIG_ENG', designation,
              'REP_AREA', reported_area_km2,
              'GIS_AREA', gis_area_km2,
              'IUCN_CAT', iucn_category,
              'IS_WHS', is_world_heritage_site
            )
          )
        ), '[]'::jsonb)
      ) AS geojson
      FROM protected_areas;
    `);

    res.json(rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load parks' });
  }
});

// GET /api/parks/:siteId
// Full curated record for the detail panel: WDPA attributes + OUV info +
// overview + images + research initiatives + species + visitor info.
router.get('/:siteId', async (req, res) => {
  const siteId = Number(req.params.siteId);
  if (Number.isNaN(siteId)) {
    return res.status(400).json({ error: 'Invalid site id' });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        p.id, p.site_id, p.name, p.name_eng, p.designation, p.iucn_category,
        p.state, p.country, p.year_established, p.reported_area_km2,
        p.gis_area_km2, p.status, p.verification, p.is_world_heritage_site,

        w.inscription_year, w.ouv_criteria, w.ouv_description,

        ov.short_summary, ov.description,

        v.official_website, v.contact_email, v.contact_phone,
        v.nearest_city, v.nearest_city_km, v.nearest_airport,
        v.nearest_airport_km, v.entry_fees, v.best_season, v.permits_required,

        COALESCE(img.images, '[]'::jsonb) AS images,
        COALESCE(ri.research_initiatives, '[]'::jsonb) AS research_initiatives,
        COALESCE(sp.species, '[]'::jsonb) AS species
      FROM protected_areas p
      LEFT JOIN world_heritage_info w ON w.park_id = p.id
      LEFT JOIN park_overview ov ON ov.park_id = p.id
      LEFT JOIN visitor_info v ON v.park_id = p.id
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
          'url', i.url, 'caption', i.caption, 'credit', i.credit
        ) ORDER BY i.display_order) AS images
        FROM park_images i WHERE i.park_id = p.id
      ) img ON true
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
          'category', r.category, 'title', r.title, 'organization', r.organization,
          'description', r.description, 'link', r.link
        )) AS research_initiatives
        FROM research_initiatives r WHERE r.park_id = p.id
      ) ri ON true
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
          'category', s.category, 'common_name', s.common_name,
          'scientific_name', s.scientific_name, 'iucn_status', s.iucn_status,
          'notes', s.notes
        )) AS species
        FROM species s WHERE s.park_id = p.id
      ) sp ON true
      WHERE p.site_id = $1;
      `,
      [siteId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Park not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load park detail' });
  }
});

export default router;