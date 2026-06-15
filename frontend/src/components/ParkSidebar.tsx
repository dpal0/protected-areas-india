import { useMemo } from 'react';
import { useStore } from '../store';
import ParkCard from './ParkCard';

export default function ParkSidebar() {
  const parks = useStore((s) => s.parks);
  const searchQuery = useStore((s) => s.searchQuery);
  const typeFilter = useStore((s) => s.typeFilter);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return parks.filter((park) => {
      const p = park.properties;
      const name = (p.NAME_ENG || p.NAME || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || p.DESIG_ENG.toLowerCase().includes(q);
      const matchesType = !typeFilter || p.DESIG_ENG === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [parks, searchQuery, typeFilter]);

  return (
    <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-header">
        {sidebarOpen && (
          <span className="sidebar-count">
            {filtered.length} area{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse list' : 'Expand list'}
          title={sidebarOpen ? 'Collapse' : 'Expand'}
        >
          {sidebarOpen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          )}
        </button>
      </div>

      {sidebarOpen && (
        <div className="sidebar-list">
          {filtered.length === 0 ? (
            <p className="sidebar-empty">No areas match your search.</p>
          ) : (
            filtered.map((park) => <ParkCard key={park.id} park={park} />)
          )}
        </div>
      )}
    </aside>
  );
}
