import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../store';
import type { Park, ParkProperties } from '../types';

const LEGEND_ITEMS = [
  { label: 'World Heritage Site', color: '#1d9e75', mod: 'square' },
  { label: 'Biosphere Reserve', color: '#4896c8', mod: 'square' },
  { label: 'Ramsar / Wetland', color: '#00897b', mod: 'square' },
  { label: 'Point only', color: '#888888', mod: 'circle' },
] as const;

const COLOR_EXPR: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'DESIG_ENG'],
  'World Heritage Site (natural or mixed)', '#1d9e75',
  'UNESCO-MAB Biosphere Reserve', '#4896c8',
  'Wetland of International Importance (Ramsar Site)', '#00897b',
  '#888888',
];

const OUTLINE_EXPR: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'DESIG_ENG'],
  'World Heritage Site (natural or mixed)', '#0f6e56',
  'UNESCO-MAB Biosphere Reserve', '#1565c0',
  'Wetland of International Importance (Ramsar Site)', '#00695c',
  '#555555',
];

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const prevSelectedId = useRef<number | null>(null);

  const selectPark = useStore((s) => s.selectPark);
  const selectedPark = useStore((s) => s.selectedPark);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: [82, 22],
      zoom: 4.5,
    });
    mapRef.current = map;

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

    let hoveredId: number | null = null;

    function setHover(id: number | null, state: boolean) {
      if (id === null) return;
      map.setFeatureState({ source: 'parks', id }, { hover: state });
    }

    function onMove(e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) {
      if (!e.features?.length) return;
      map.getCanvas().style.cursor = 'pointer';

      const feature = e.features[0];
      const id = feature.properties.SITE_ID as number;

      if (hoveredId !== id) {
        setHover(hoveredId, false);
        hoveredId = id;
        setHover(id, true);
      }

      const p = feature.properties;
      const area = (p.REP_AREA > 0 ? p.REP_AREA : p.GIS_AREA) as number;
      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `<strong style="font-size:13px">${p.NAME_ENG || p.NAME}</strong><br/>` +
          `<span style="font-size:12px;color:#4a7a67">${
            area > 0 ? `${Math.round(area).toLocaleString()} km²` : ''
          }</span>`
        )
        .addTo(map);
    }

    function onLeave() {
      map.getCanvas().style.cursor = '';
      setHover(hoveredId, false);
      hoveredId = null;
      popup.remove();
    }

    function onClick(e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) {
      if (!e.features?.length) return;
      const feature = e.features[0];
      const park: Park = {
        id: feature.properties.SITE_ID as number,
        properties: feature.properties as unknown as ParkProperties,
        centroid: [e.lngLat.lng, e.lngLat.lat],
      };
      selectPark(park);
    }

    map.on('load', () => {
      map.addSource('parks', {
        type: 'geojson',
        data: '/parks.geojson',
        promoteId: 'SITE_ID',
      });

      map.addLayer({
        id: 'parks-fill',
        type: 'fill',
        source: 'parks',
        filter: ['!=', ['geometry-type'], 'Point'],
        paint: {
          'fill-color': COLOR_EXPR,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 0.72,
            ['boolean', ['feature-state', 'hover'], false], 0.58,
            0.3,
          ],
        },
      });

      map.addLayer({
        id: 'parks-outline',
        type: 'line',
        source: 'parks',
        filter: ['!=', ['geometry-type'], 'Point'],
        paint: {
          'line-color': OUTLINE_EXPR,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 2.5,
            ['boolean', ['feature-state', 'hover'], false], 2,
            0.8,
          ],
        },
      });

      map.addLayer({
        id: 'parks-circle',
        type: 'circle',
        source: 'parks',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-color': COLOR_EXPR,
          'circle-radius': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 9,
            ['boolean', ['feature-state', 'hover'], false], 8,
            6,
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      });

      map.on('mousemove', 'parks-fill', onMove);
      map.on('mouseleave', 'parks-fill', onLeave);
      map.on('mousemove', 'parks-circle', onMove);
      map.on('mouseleave', 'parks-circle', onLeave);
      map.on('click', 'parks-fill', onClick);
      map.on('click', 'parks-circle', onClick);

      loadedRef.current = true;

      // Sync any pre-existing selection (e.g. from sidebar click before map loaded)
      const pending = useStore.getState().selectedPark;
      if (pending) {
        map.setFeatureState({ source: 'parks', id: pending.id }, { selected: true });
        prevSelectedId.current = pending.id;
      }
    });

    return () => {
      loadedRef.current = false;
      mapRef.current = null;
      map.remove();
    };
  }, [selectPark]);

  // Keep map feature-state in sync with store selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    if (prevSelectedId.current !== null) {
      map.setFeatureState({ source: 'parks', id: prevSelectedId.current }, { selected: false });
    }

    if (selectedPark) {
      map.setFeatureState({ source: 'parks', id: selectedPark.id }, { selected: true });
      map.flyTo({ center: selectedPark.centroid, zoom: 7, duration: 1200 });
      prevSelectedId.current = selectedPark.id;
    } else {
      prevSelectedId.current = null;
    }
  }, [selectedPark]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div className="map-legend">
        <div className="legend-title">Designation</div>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="legend-item">
            <span
              className={`legend-swatch legend-swatch--${item.mod}`}
              style={{ background: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
