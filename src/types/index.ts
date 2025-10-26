/**
 * Type definitions for geothermal site visualization
 */

// Site type categories
export type SiteType = 'actual' | 'predicted' | 'missed';

// GeoJSON Feature for a geothermal site
export interface SiteFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    id: string;
    probability: number;
    prediction: number;
    actual_label: number;
    viz_label: SiteType;
    temperature: number;
    elevation: number;
    slope: number;
    aspect: number;
    tri: number;
    tpi: number;
    // Legacy fields for backward compatibility
    name?: string;
    type?: SiteType;
    confidence?: number | null;
    region?: string;
    capacity_mw?: number | null;
    year?: number;
    metadata?: {
      [key: string]: any;
    };
  };
}

// GeoJSON FeatureCollection
export interface SitesGeoJSON {
  type: 'FeatureCollection';
  features: SiteFeature[];
}

// Visualization configuration for each site type
export interface SiteTypeConfig {
  color: string;
  size: number;
  label: string;
}

// Configuration schema
export interface Config {
  visualization: {
    types: {
      [key in SiteType]: SiteTypeConfig;
    };
    defaultView: {
      longitude: number;
      latitude: number;
      height: number;
    };
  };
  metadata: {
    title: string;
    subtitle: string;
    model: string;
    metrics: {
      [key: string]: number | string;
    };
  };
}

// Filter state for toggling site types
export interface FilterState {
  [key: string]: boolean; // SiteType -> visible
}

// Statistics for each site type
export interface SiteStats {
  [key: string]: number; // SiteType -> count
}
