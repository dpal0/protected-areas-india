import { useStore } from '../store';

const TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'World Heritage Site', value: 'World Heritage Site (natural or mixed)' },
  { label: 'Biosphere Reserve', value: 'UNESCO-MAB Biosphere Reserve' },
  { label: 'Ramsar / Wetland', value: 'Wetland of International Importance (Ramsar Site)' },
];

export default function TopBar() {
  const searchQuery = useStore((s) => s.searchQuery);
  const typeFilter = useStore((s) => s.typeFilter);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setTypeFilter = useStore((s) => s.setTypeFilter);

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <svg className="topbar-logo-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3C8 3 4 6.5 4 11c0 3 1.5 5.5 4 7l1-4c.5 1.5 1.5 3 3 4 1.5-1 2.5-2.5 3-4l1 4c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z"
            fill="currentColor"
          />
        </svg>
        <span className="topbar-logo-text">PARI</span>
      </div>

      <div className="topbar-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search protected areas…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="topbar-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">×</button>
        )}
      </div>

      <select
        className="topbar-select"
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        aria-label="Filter by type"
      >
        {TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </header>
  );
}
