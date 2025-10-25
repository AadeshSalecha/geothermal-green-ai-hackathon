# Geothermal Globe Visualization

An interactive 3D globe visualization for geothermal site predictions using Cesium.js, React, and TypeScript. This application provides a data-agnostic, file-based visualization platform that can display any geothermal dataset in a standardized format.

## Features

- **3D Globe Rendering**: Realistic Earth visualization with Cesium.js
- **Interactive Markers**: Clickable site pins with color-coded types
- **Dynamic Filtering**: Toggle site types on/off, search by name
- **Detailed Popups**: View comprehensive site information on click
- **Model Metrics**: Display accuracy, precision, recall, and custom metrics
- **Responsive Design**: Works on desktop and mobile devices
- **Data-Agnostic**: No hardcoded data - all loaded from JSON/GeoJSON files
- **Hot-Reloadable**: Update data files and refresh to see changes
- **Colorblind-Friendly**: Carefully selected color palette
- **Extensible**: Easy to add new site types and metadata fields

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview
```

## Data File Format

All data is stored in the `/public/data` directory and loaded dynamically at runtime.

### 1. sites.geojson

Main data file containing all geothermal sites:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-119.5, 39.8]
      },
      "properties": {
        "id": "unique-site-id",
        "name": "Brady Hot Springs",
        "type": "actual",
        "confidence": null,
        "region": "Nevada",
        "capacity_mw": 26.0,
        "year": 2023,
        "metadata": {
          "temperature_c": 178,
          "elevation_m": 1200,
          "notes": "Optional field"
        }
      }
    }
  ]
}
```

#### Required Fields

- `id` (string): Unique identifier for the site
- `name` (string): Display name
- `type` (string): Site type (must match config.json types)
- `confidence` (number | null): Prediction confidence (0-1), null for actual sites
- `region` (string): Geographic region
- `capacity_mw` (number | null): Power capacity in megawatts
- `year` (number): Year of prediction or plant establishment
- `coordinates` (array): [longitude, latitude]

#### Optional Fields

- `metadata` (object): Extensible object for additional attributes
  - Any key-value pairs will be displayed in the site popup
  - Supports strings, numbers, and nested objects

### 2. config.json

Visualization configuration and metadata:

```json
{
  "visualization": {
    "types": {
      "actual": {
        "color": "#22c55e",
        "size": 8,
        "label": "Known Sites"
      },
      "predicted": {
        "color": "#ef4444",
        "size": 10,
        "label": "Predicted Sites"
      }
    },
    "defaultView": {
      "longitude": -119.0,
      "latitude": 39.5,
      "height": 2000000
    }
  },
  "metadata": {
    "title": "AlphaEarth Geothermal Predictions",
    "subtitle": "CA → NV Spatial Cross-Validation",
    "model": "XGBoost + AlphaEarth Embeddings",
    "metrics": {
      "accuracy": 0.93,
      "recall": 0.81,
      "precision": 0.96
    }
  }
}
```

#### Configuration Fields

**visualization.types**: Define site types with:
- `color`: Hex color code
- `size`: Pin size in pixels
- `label`: Display label in legend

**visualization.defaultView**: Initial camera position:
- `longitude`: Center longitude
- `latitude`: Center latitude
- `height`: Camera height in meters

**metadata**: Project information:
- `title`: Main heading
- `subtitle`: Secondary heading
- `model`: Model description
- `metrics`: Key-value pairs (numbers 0-1 shown as percentages)

## How to Use

### Navigation

- **Rotate**: Click and drag on the globe
- **Zoom**: Scroll wheel or pinch on mobile
- **Reset View**: Refresh the page

### Interactions

- **Hover**: See site names appear above markers
- **Click Site**: Open detailed information popup
- **Filter**: Toggle site types in the legend
- **Search**: Type site name in search box
- **Refresh Data**: Click "Refresh Data" button to reload files

### Adding New Data

1. **Update sites.geojson**: Add new features to the `features` array
2. **Update config.json**: Add new site types to `visualization.types` if needed
3. **Refresh**: Click "Refresh Data" button or reload the page

### Adding New Site Types

To add a new site type (e.g., "under_construction"):

1. Add the type configuration to `config.json`:
```json
{
  "visualization": {
    "types": {
      "under_construction": {
        "color": "#3b82f6",
        "size": 7,
        "label": "Under Construction"
      }
    }
  }
}
```

2. Use the type in `sites.geojson`:
```json
{
  "properties": {
    "type": "under_construction",
    ...
  }
}
```

3. Refresh the application - the new type will automatically appear!

### Adding Custom Metadata

Add any fields to the `metadata` object in site properties:

```json
{
  "metadata": {
    "depth_m": 3000,
    "operator": "Ormat Technologies",
    "status": "operational",
    "custom_field": "any value"
  }
}
```

All metadata fields will automatically display in the site popup.

## Project Structure

```
geothermal-globe-viz/
├── public/
│   └── data/
│       ├── sites.geojson       # Site data
│       └── config.json         # Configuration
├── src/
│   ├── components/
│   │   ├── Globe.tsx           # Cesium 3D globe
│   │   ├── Sidebar.tsx         # Info panel & controls
│   │   ├── SitePopup.tsx       # Site details modal
│   │   └── Legend.tsx          # Type legend & filters
│   ├── utils/
│   │   └── dataLoader.ts       # Data loading utilities
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **3D Visualization**: Cesium.js 1.111
- **Styling**: Tailwind CSS 3
- **Build Tool**: Vite 5
- **Data Format**: GeoJSON + JSON

## Performance Considerations

- **Efficient Rendering**: Cesium handles 1000+ points with ease
- **Lazy Loading**: Site details loaded only on click
- **Optimized Filtering**: Fast client-side filtering and search
- **Minimal Dependencies**: Lightweight bundle size
- **Web Workers**: Cesium uses workers for terrain/imagery

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Data Not Loading

- Check browser console for errors
- Verify JSON syntax in data files
- Ensure files are in `/public/data` directory
- Check file names match exactly: `sites.geojson` and `config.json`

### Sites Not Appearing

- Verify coordinates are [longitude, latitude] (not reversed)
- Check that site `type` matches a type in `config.json`
- Ensure the type filter is enabled in the legend

### Globe Not Rendering

- Check for WebGL support in browser
- Try disabling browser extensions
- Verify Cesium Ion token (default token is included)

## Docker Support

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:

```bash
docker build -t geothermal-viz .
docker run -p 3000:3000 geothermal-viz
```

## Development

### Code Organization

- **Separation of Concerns**: Components, utils, and types clearly separated
- **Type Safety**: Full TypeScript coverage with strict mode
- **Reusable Components**: Modular, props-based component design
- **Data Validation**: Runtime checks for data integrity

### Adding Features

1. **New Visualization Layers**: Extend Globe.tsx with Cesium entities
2. **New Filters**: Add filter logic to dataLoader.ts
3. **New Metrics**: Add fields to config.json metadata
4. **Export Functions**: Add download buttons in Sidebar.tsx

## License

MIT License - Free to use for research and commercial projects

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review data file format documentation
3. Inspect browser console for errors
4. Verify Node.js and npm versions

## Credits

Built with:
- [Cesium.js](https://cesium.com/platform/cesiumjs/) - 3D globe visualization
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool

Created for AlphaEarth geothermal site prediction visualization.
