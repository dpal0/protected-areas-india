import type { Park } from '../types';
import { useStore } from '../store';

const DESIG_SHORT: Record<string, string> = {
  'World Heritage Site (natural or mixed)': 'WHS',
  'UNESCO-MAB Biosphere Reserve': 'Biosphere',
  'Wetland of International Importance (Ramsar Site)': 'Ramsar',
};

const DESIG_MOD: Record<string, string> = {
  'World Heritage Site (natural or mixed)': 'whs',
  'UNESCO-MAB Biosphere Reserve': 'bio',
  'Wetland of International Importance (Ramsar Site)': 'ramsar',
};

const IUCN_VALID = new Set(['Ia', 'Ib', 'II', 'III', 'IV', 'V', 'VI']);

interface Props {
  park: Park;
}

export default function ParkCard({ park }: Props) {
  const selectedPark = useStore((s) => s.selectedPark);
  const selectPark = useStore((s) => s.selectPark);
  const isSelected = selectedPark?.id === park.id;

  const p = park.properties;
  const area = p.REP_AREA > 0 ? p.REP_AREA : p.GIS_AREA;
  const shortLabel = DESIG_SHORT[p.DESIG_ENG] ?? p.DESIG_ENG;
  const mod = DESIG_MOD[p.DESIG_ENG] ?? '';

  return (
    <button
      className={`park-card${isSelected ? ' park-card--selected' : ''}`}
      onClick={() => selectPark(isSelected ? null : park)}
      aria-pressed={isSelected}
    >
      <span className="park-card-name">{p.NAME_ENG || p.NAME}</span>
      <div className="park-card-row">
        <span className={`badge badge--${mod}`}>{shortLabel}</span>
        {IUCN_VALID.has(p.IUCN_CAT) && (
          <span className="badge badge--iucn">IUCN {p.IUCN_CAT}</span>
        )}
        {area > 0 && (
          <span className="park-card-area">{Math.round(area).toLocaleString()} km²</span>
        )}
      </div>
      {p.STATUS_YR > 0 && (
        <span className="park-card-year">Est. {p.STATUS_YR}</span>
      )}
    </button>
  );
}
