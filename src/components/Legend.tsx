/**
 * Legend component showing site types with colors and toggles
 */

import { Config, FilterState, SiteStats } from '../types';

interface LegendProps {
  config: Config;
  filters: FilterState;
  stats: SiteStats;
  onFilterToggle: (type: string) => void;
}

export default function Legend({ config, filters, stats, onFilterToggle }: LegendProps) {
  const types = Object.entries(config.visualization.types);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Legend</h3>
      <div className="space-y-2">
        {types.map(([type, typeConfig]) => {
          const count = stats[type] || 0;
          const isActive = filters[type] !== false;

          return (
            <button
              key={type}
              onClick={() => onFilterToggle(type)}
              className={`w-full flex items-center justify-between p-2 rounded transition-all ${
                isActive
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'bg-gray-200 opacity-50 hover:opacity-75'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: typeConfig.color }}
                />
                <span className={`text-sm ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                  {typeConfig.label}
                </span>
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">Click to show/hide site types</p>
      </div>
    </div>
  );
}
