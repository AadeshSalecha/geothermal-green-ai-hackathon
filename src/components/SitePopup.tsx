/**
 * SitePopup component showing detailed information about a selected site
 */

import { SiteFeature, Config } from '../types';

interface SitePopupProps {
  site: SiteFeature | null;
  config: Config;
  onClose: () => void;
}

export default function SitePopup({ site, config, onClose }: SitePopupProps) {
  if (!site) return null;

  const { name, type, confidence, region, capacity_mw, year, metadata } = site.properties;
  const typeConfig = config.visualization.types[type];
  const [longitude, latitude] = site.geometry.coordinates;

  // Format metadata for display
  const metadataEntries = metadata ? Object.entries(metadata) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div
          className="p-4 rounded-t-lg"
          style={{ backgroundColor: typeConfig.color + '20' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: typeConfig.color }}
                />
                <span className="text-xs font-medium text-gray-600 uppercase">
                  {typeConfig.label}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{name}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem label="Region" value={region} />
            <InfoItem label="Year" value={year.toString()} />
            {confidence !== null && (
              <InfoItem
                label="Confidence"
                value={`${(confidence * 100).toFixed(1)}%`}
              />
            )}
            {capacity_mw !== null && (
              <InfoItem label="Capacity" value={`${capacity_mw} MW`} />
            )}
          </div>

          {/* Coordinates */}
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Longitude" value={longitude.toFixed(4)} />
              <InfoItem label="Latitude" value={latitude.toFixed(4)} />
            </div>
          </div>

          {/* Metadata */}
          {metadataEntries.length > 0 && (
            <div className="pt-3 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Info</h3>
              <div className="space-y-2">
                {metadataEntries.map(([key, value]) => (
                  <InfoItem
                    key={key}
                    label={formatKey(key)}
                    value={formatValue(value)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

// Helper function to format metadata keys (convert snake_case to Title Case)
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format metadata values
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
