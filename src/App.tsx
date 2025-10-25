/**
 * Main application component
 */

import { useState, useEffect, useCallback } from 'react';
import Globe from './components/Globe';
import Sidebar from './components/Sidebar';
import SitePopup from './components/SitePopup';
import {
  loadSitesData,
  loadConfig,
  calculateSiteStats,
  initializeFilters,
  filterSites,
} from './utils/dataLoader';
import { SitesGeoJSON, Config, FilterState, SiteStats, SiteFeature } from './types';

export default function App() {
  // State
  const [sitesData, setSitesData] = useState<SitesGeoJSON | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<SiteFeature | null>(null);
  const [stats, setStats] = useState<SiteStats>({});
  const [filteredSites, setFilteredSites] = useState<SitesGeoJSON | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sites, cfg] = await Promise.all([loadSitesData(), loadConfig()]);
      setSitesData(sites);
      setConfig(cfg);
      setFilters(initializeFilters(cfg));
      setStats(calculateSiteStats(sites));
      setFilteredSites(sites);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update filtered sites when filters or search changes
  useEffect(() => {
    if (!sitesData) return;
    const filtered = filterSites(sitesData, filters, searchQuery);
    setFilteredSites(filtered);
  }, [sitesData, filters, searchQuery]);

  // Handlers
  const handleFilterToggle = useCallback((type: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSiteClick = useCallback((site: SiteFeature) => {
    setSelectedSite(site);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedSite(null);
  }, []);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white text-lg">Loading geothermal data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !sitesData || !config || !filteredSites) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center bg-red-100 border border-red-400 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error || 'Unknown error occurred'}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 z-10">
        <Sidebar
          config={config}
          filters={filters}
          stats={stats}
          searchQuery={searchQuery}
          onFilterToggle={handleFilterToggle}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Globe */}
      <div className="flex-1 relative">
        <Globe sites={filteredSites} config={config} onSiteClick={handleSiteClick} />
      </div>

      {/* Popup */}
      <SitePopup site={selectedSite} config={config} onClose={handleClosePopup} />
    </div>
  );
}
