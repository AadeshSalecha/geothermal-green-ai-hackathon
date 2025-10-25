/**
 * Sidebar component with project info, metrics, search, and legend
 */

import { Config, FilterState, SiteStats } from '../types';
import Legend from './Legend';

interface SidebarProps {
  config: Config;
  filters: FilterState;
  stats: SiteStats;
  searchQuery: string;
  onFilterToggle: (type: string) => void;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
}

export default function Sidebar({
  config,
  filters,
  stats,
  searchQuery,
  onFilterToggle,
  onSearchChange,
  onRefresh,
}: SidebarProps) {
  const { title, subtitle, model, metrics } = config.metadata;

  // Format metric key for display
  const formatMetricKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format metric value
  const formatMetricValue = (value: number | string): string => {
    if (typeof value === 'number') {
      // If it's a decimal between 0 and 1, format as percentage
      if (value > 0 && value < 1) {
        return `${(value * 100).toFixed(1)}%`;
      }
      return value.toString();
    }
    return String(value);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 shadow-lg overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold mb-1">{title}</h1>
        <p className="text-blue-100 text-sm">{subtitle}</p>
        <p className="text-blue-200 text-xs mt-2">Model: {model}</p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Metrics */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Model Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500 mb-1">{formatMetricKey(key)}</p>
                <p className="text-lg font-bold text-gray-800">{formatMetricValue(value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Search Sites</h3>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Legend with filters */}
        <Legend
          config={config}
          filters={filters}
          stats={stats}
          onFilterToggle={onFilterToggle}
        />

        {/* Refresh Button */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <button
            onClick={onRefresh}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
          >
            Refresh Data
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Reload data files without restarting
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-100 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Interactive 3D Geothermal Visualization
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          Click sites for details • Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
}
