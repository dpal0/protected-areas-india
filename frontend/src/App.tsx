import { useEffect } from 'react';
import { useStore } from './store';
import TopBar from './components/TopBar';
import ParkSidebar from './components/ParkSidebar';
import ParkDetail from './components/ParkDetail';
import MapView from './map/MapView';
import type { Park, ParkProperties } from './types';
import './App.css';

interface GeoFeature {
  id?: number;
  properties: ParkProperties;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
}

function centroidOf(geometry: GeoFeature['geometry']): [number, number] {
  if (geometry.type === 'Point') {
    const c = geometry.coordinates as number[];
    return [c[0], c[1]];
  }
  const ring: number[][] =
    geometry.type === 'Polygon'
      ? (geometry.coordinates as number[][][])[0]
      : (geometry.coordinates as number[][][][])[0][0];
  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  return [lng, lat];
}

export default function App() {
  const setParks = useStore((s) => s.setParks);

  useEffect(() => {
    fetch('/parks.geojson')
      .then((r) => r.json())
      .then((data: { features: GeoFeature[] }) => {
        const parks: Park[] = data.features.map((f, i) => ({
          id: f.properties.SITE_ID ?? i,
          properties: f.properties,
          centroid: centroidOf(f.geometry),
        }));
        setParks(parks);
      });
  }, [setParks]);

  return (
    <div className="app">
      <TopBar />
      <div className="app-body">
        <ParkSidebar />
        <div className="map-wrapper">
          <MapView />
        </div>
        <ParkDetail />
      </div>
    </div>
  );
}
