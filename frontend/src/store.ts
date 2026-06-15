import { create } from 'zustand';
import type { Park } from './types';

interface AppState {
  parks: Park[];
  selectedPark: Park | null;
  searchQuery: string;
  typeFilter: string;
  sidebarOpen: boolean;
  setParks: (parks: Park[]) => void;
  selectPark: (park: Park | null) => void;
  setSearchQuery: (q: string) => void;
  setTypeFilter: (t: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  parks: [],
  selectedPark: null,
  searchQuery: '',
  typeFilter: '',
  sidebarOpen: true,
  setParks: (parks) => set({ parks }),
  selectPark: (selectedPark) => set({ selectedPark }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
