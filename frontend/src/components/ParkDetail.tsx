import { useState } from 'react';
import { useStore } from '../store';

type Tab = 'Overview' | 'Research' | 'Visit';
const TABS: Tab[] = ['Overview', 'Research', 'Visit'];

const IUCN_VALID = new Set(['Ia', 'Ib', 'II', 'III', 'IV', 'V', 'VI']);

const CRIT_LABELS: Record<string, string> = {
  i: 'Masterpiece of human creative genius',
  ii: 'Interchange of human values',
  iii: 'Unique testimony to cultural tradition',
  iv: 'Outstanding example of building/landscape',
  v: 'Outstanding example of human settlement',
  vi: 'Associated with living traditions',
  vii: 'Exceptional natural beauty',
  viii: 'Outstanding geological processes',
  ix: 'Outstanding ecological/biological processes',
  x: 'Significant natural habitat for biodiversity',
};

function parseCriteria(raw: string): string[] {
  if (!raw || raw === 'Not Applicable') return [];
  return raw
    .split(';')
    .map((s) => s.replace(/[()]/g, '').trim().toLowerCase())
    .filter(Boolean);
}

export default function ParkDetail() {
  const selectedPark = useStore((s) => s.selectedPark);
  const selectPark = useStore((s) => s.selectPark);
  const [tab, setTab] = useState<Tab>('Overview');

  if (!selectedPark) return null;

  const p = selectedPark.properties;
  const repArea = p.REP_AREA > 0 ? p.REP_AREA : null;
  const gisArea = p.GIS_AREA > 0 ? p.GIS_AREA : null;
  const showIucn = IUCN_VALID.has(p.IUCN_CAT);
  const criteria = parseCriteria(p.INT_CRIT);

  const designMod =
    p.DESIG_ENG === 'World Heritage Site (natural or mixed)' ? 'whs'
    : p.DESIG_ENG === 'UNESCO-MAB Biosphere Reserve' ? 'bio'
    : p.DESIG_ENG === 'Wetland of International Importance (Ramsar Site)' ? 'ramsar'
    : '';

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div className="detail-title-row">
          <h2 className="detail-name">{p.NAME_ENG || p.NAME}</h2>
          <button
            className="detail-close"
            onClick={() => selectPark(null)}
            aria-label="Close detail panel"
          >
            ×
          </button>
        </div>

        <div className="detail-badges">
          <span className={`badge badge--${designMod}`}>
            {p.DESIG_ENG === 'World Heritage Site (natural or mixed)'
              ? 'World Heritage Site'
              : p.DESIG_ENG === 'Wetland of International Importance (Ramsar Site)'
              ? 'Ramsar Site'
              : p.DESIG_ENG}
          </span>
          {showIucn && <span className="badge badge--iucn">IUCN {p.IUCN_CAT}</span>}
          {p.STATUS_YR > 0 && <span className="badge badge--year">Est. {p.STATUS_YR}</span>}
        </div>
      </div>

      {(repArea || gisArea) && (
        <div className="detail-stats">
          {repArea && (
            <div className="stat-card">
              <span className="stat-label">Reported area</span>
              <strong className="stat-value">{Math.round(repArea).toLocaleString()} km²</strong>
            </div>
          )}
          {gisArea && (
            <div className="stat-card">
              <span className="stat-label">GIS area</span>
              <strong className="stat-value">{Math.round(gisArea).toLocaleString()} km²</strong>
            </div>
          )}
        </div>
      )}

      <div className="detail-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`detail-tab${tab === t ? ' detail-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="detail-content">
        {tab === 'Overview' && (
          <div className="detail-overview">
            {criteria.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">Outstanding Universal Value</h3>
                <ul className="criteria-list">
                  {criteria.map((c) => (
                    <li key={c} className="criteria-item">
                      <span className="criteria-code">({c})</span>
                      {CRIT_LABELS[c] && <span className="criteria-label">{CRIT_LABELS[c]}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="detail-section">
              <h3 className="detail-section-title">Details</h3>
              <dl className="detail-dl">
                <dt>Realm</dt>
                <dd>{p.REALM || '—'}</dd>
                <dt>Status</dt>
                <dd>{p.STATUS || '—'}</dd>
                {p.VERIF && p.VERIF !== 'Not Reported' && (
                  <>
                    <dt>Verification</dt>
                    <dd>{p.VERIF}</dd>
                  </>
                )}
                {p.GOV_TYPE && p.GOV_TYPE !== 'Not Reported' && (
                  <>
                    <dt>Governance</dt>
                    <dd>{p.GOV_TYPE}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        )}

        {tab === 'Research' && (
          <div className="detail-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p>No research data linked to this area yet.</p>
          </div>
        )}

        {tab === 'Visit' && (
          <div className="detail-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p>Visitor information not yet available.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
