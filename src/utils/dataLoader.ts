/**
 * Data loader utility for fetching and parsing GeoJSON and configuration files
 */

import { SitesGeoJSON, Config, SiteStats, FilterState } from '../types';

/**
 * Load sites data from GeoJSON file
 */
export async function loadSitesData(): Promise<SitesGeoJSON> {
  try {
    const response = await fetch('/data/sites.geojson');
    if (!response.ok) {
      throw new Error(`Failed to load sites data: ${response.statusText}`);
    }
    const data = await response.json();

    // Validate basic structure
    if (!data.type || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      throw new Error('Invalid GeoJSON structure');
    }

    return data as SitesGeoJSON;
  } catch (error) {
    console.error('Error loading sites data:', error);
    throw error;
  }
}

/**
 * Load configuration from config.json
 */
export async function loadConfig(): Promise<Config> {
  try {
    const response = await fetch('/data/config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    const data = await response.json();

    // Validate basic structure
    if (!data.visualization || !data.metadata) {
      throw new Error('Invalid config structure');
    }

    return data as Config;
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
}

/**
 * Calculate statistics for each site type
 */
export function calculateSiteStats(sites: SitesGeoJSON): SiteStats {
  const stats: SiteStats = {};

  sites.features.forEach(feature => {
    const type = feature.properties.viz_label;
    stats[type] = (stats[type] || 0) + 1;
  });

  return stats;
}

/**
 * Initialize filter state with all types visible
 */
export function initializeFilters(config: Config): FilterState {
  const filters: FilterState = {};

  Object.keys(config.visualization.types).forEach(type => {
    filters[type] = true; // All visible by default
  });

  return filters;
}

/**
 * Filter sites based on active filters and search query
 */
export function filterSites(
  sites: SitesGeoJSON,
  filters: FilterState,
  searchQuery: string
): SitesGeoJSON {
  const filteredFeatures = sites.features.filter(feature => {
    const type = feature.properties.viz_label;
    const name = `Site ${feature.properties.id}`;
    const query = searchQuery.toLowerCase().trim();

    // Check if type is visible
    const typeVisible = filters[type] !== false;

    // Check if name matches search query
    const matchesSearch = query === '' || name.toLowerCase().includes(query);

    return typeVisible && matchesSearch;
  });

  return {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };
}


/**
 * Convert hex color to RGB array for Cesium
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [255, 0, 0]; // Default to red
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}
