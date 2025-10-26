/**
 * Globe component using Cesium.js for 3D visualization
 */

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { SitesGeoJSON, Config, SiteFeature } from '../types';
import { hexToRgb } from '../utils/dataLoader';

interface GlobeProps {
  sites: SitesGeoJSON;
  config: Config;
  onSiteClick: (site: SiteFeature) => void;
}

export default function Globe({ sites, config, onSiteClick }: GlobeProps) {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Cesium viewer
  useEffect(() => {
  if (!containerRef.current || viewerRef.current) return;

  // ✅ Create the Cesium Viewer
  const viewer = new Cesium.Viewer(containerRef.current, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    selectionIndicator: false,
    infoBox: false,
    fullscreenButton: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  });

  // ✅ Remove default imagery and add OpenStreetMap (fallback to simple SVG if failed)
  viewer.imageryLayers.removeAll();
  try {
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/',
      })
    );
  } catch (error) {
    console.warn('OpenStreetMap failed, using fallback imagery');
    viewer.imageryLayers.addImageryProvider(
      new Cesium.SingleTileImageryProvider({
        url:
          'data:image/svg+xml;base64,' +
          btoa(`
            <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
              <rect width="256" height="256" fill="#1a365d"/>
              <circle cx="128" cy="128" r="100" fill="#2d5a87" opacity="0.5"/>
            </svg>
          `),
        rectangle: Cesium.Rectangle.MAX_VALUE,
      })
    );
  }

  // ✅ SAFETY GUARD: Only access scene if ready
  if (viewer?.scene && viewer.scene.globe) {
    viewer.scene.globe.enableLighting = false;
    viewer.scene.globe.showWaterEffect = true;
    viewer.scene.globe.baseColor = Cesium.Color.BLUE.withAlpha(0.5);
    viewer.scene.backgroundColor = Cesium.Color.BLACK;
    viewer.scene.globe.show = true;

    // Disable depth testing against terrain for ellipsoid terrain
    viewer.scene.globe.depthTestAgainstTerrain = false;

    // Configure camera controls
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = true;
    controller.enableTranslate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;
    controller.minimumZoomDistance = 1000;        // 1km
    controller.maximumZoomDistance = 20000000;    // 20,000km

    // Render once to ensure globe is visible
    viewer.scene.requestRender();
  } else {
    console.warn('⚠️ Cesium scene not ready at init time');
  }

  // ✅ Set default camera view from config with slight delay
  const { longitude, latitude, height } = config.visualization.defaultView;
  setTimeout(() => {
    if (viewer?.camera) {
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO * 0.5,
          roll: 0.0,
        },
      });
    }
  }, 100);

  // ✅ Keyboard movement controls
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!viewer?.camera) return;

    const camera = viewer.camera;
    const moveAmount = 50;
    const currentHeight = camera.positionCartographic.height;

    if (currentHeight > 1000) return;

    switch (event.key.toLowerCase()) {
      case 'w':
        camera.moveForward(moveAmount);
        break;
      case 's':
        camera.moveBackward(moveAmount);
        break;
      case 'a':
        camera.moveLeft(moveAmount);
        break;
      case 'd':
        camera.moveRight(moveAmount);
        break;
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  viewerRef.current = viewer;

  // ✅ Cleanup on unmount
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (viewerRef.current) {
      viewerRef.current.destroy();
      viewerRef.current = null;
    }
  };
}, [config]);

  // Update site markers when sites change
  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;
    const entities = viewer.entities;

    // Clear existing entities
    entities.removeAll();

    // Add entities for each site
    sites.features.forEach((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const { id, viz_label, probability } = feature.properties;

      // Map viz_label to type for config lookup
      const type = viz_label;
      const name = `Site ${id}`;
      const confidence = probability;

      const typeConfig = config.visualization.types[type];
      if (!typeConfig) return;

      const [r, g, b] = hexToRgb(typeConfig.color);

      // Scale size based on confidence (if available) or use default size
      const baseSize = typeConfig.size;
      const sizeMultiplier = confidence !== null ? 0.7 + (confidence * 0.6) : 1.0;
      const pixelSize = baseSize * sizeMultiplier;

      entities.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
        point: {
          pixelSize: pixelSize,
          color: Cesium.Color.fromBytes(r, g, b, 255),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: name,
          font: '14px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -pixelSize - 5),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: false, // Only show on hover
        },
        // Store feature data for click handler
        properties: {
          featureData: feature,
        },
      });
    });

    // Handle click events
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = viewer.scene.pick(movement.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity;
        const featureData = entity.properties?.featureData?.getValue(Cesium.JulianDate.now());
        if (featureData) {
          // Zoom to the clicked site
          const [longitude, latitude] = featureData.geometry.coordinates;
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 50000),
            duration: 2.0,
            orientation: {
              heading: 0.0,
              pitch: -Cesium.Math.PI_OVER_TWO * 0.3,
              roll: 0.0,
            },
          });

          onSiteClick(featureData as SiteFeature);
        }
      } else {
        // Double-click on empty space to zoom to that location
        const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);

          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 100000),
            duration: 1.5,
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Handle double-click for zooming
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 25000),
          duration: 1.0,
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // Handle right-click for Street View
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

        handleRightClick(longitude, latitude);
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    // Handle hover events to show/hide labels
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);

      // Hide all labels first
      entities.values.forEach(entity => {
        if (entity.label) {
          entity.label.show = new Cesium.ConstantProperty(false);
        }
      });

      // Show label for hovered entity
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity;
        if (entity.label) {
          entity.label.show = new Cesium.ConstantProperty(true);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      handler.destroy();
    };
  }, [sites, config, onSiteClick]);

  // Zoom control functions
  const zoomIn = () => {
    if (viewerRef.current) {
      const camera = viewerRef.current.camera;
      const currentHeight = camera.positionCartographic.height;
      const newHeight = Math.max(currentHeight * 0.5, 1000); // Minimum 1km altitude

      camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          camera.positionCartographic.longitude,
          camera.positionCartographic.latitude,
          newHeight
        ),
        duration: 0.5,
      });
    }
  };

  const zoomOut = () => {
    if (viewerRef.current) {
      const camera = viewerRef.current.camera;
      const currentHeight = camera.positionCartographic.height;
      const newHeight = Math.min(currentHeight * 2, 20000000); // Maximum 20,000km altitude

      camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          camera.positionCartographic.longitude,
          camera.positionCartographic.latitude,
          newHeight
        ),
        duration: 0.5,
      });
    }
  };

  const resetView = () => {
    if (viewerRef.current) {
      const { longitude, latitude, height } = config.visualization.defaultView;
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
        orientation: {
          heading: 0.0,
          pitch: -Cesium.Math.PI_OVER_TWO * 0.5,
          roll: 0.0,
        },
        duration: 2.0,
      });
    }
  };

  const zoomToAllSites = () => {
    if (viewerRef.current && sites.features.length > 0) {
      // Calculate bounding rectangle from all site coordinates
      let minLon = Infinity, maxLon = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;

      sites.features.forEach(feature => {
        const [lon, lat] = feature.geometry.coordinates;
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });

      // Add some padding
      const padding = 0.5;
      const rectangle = Cesium.Rectangle.fromDegrees(
        minLon - padding,
        minLat - padding,
        maxLon + padding,
        maxLat + padding
      );

      viewerRef.current.camera.flyTo({
        destination: rectangle,
        duration: 2.0,
      });
    }
  };

  // Street View mode functions
  const enterStreetView = (longitude: number, latitude: number) => {
    if (viewerRef.current) {
      const viewer = viewerRef.current;

      // Set camera to ground level with street view perspective
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 10), // 10 meters above ground
        orientation: {
          heading: 0.0, // North
          pitch: 0.0,   // Level horizon
          roll: 0.0,
        },
        duration: 2.0,
      });

      // Enable first-person controls
      viewer.scene.screenSpaceCameraController.enableLook = true;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1; // Allow very close zoom

      // Add a pin marker at the location
      viewer.entities.add({
        id: 'street-view-pin',
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
        billboard: {
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="32" height="48" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.2 0 0 7.2 0 16c0 16 16 32 16 32s16-16 16-32C32 7.2 24.8 0 16 0z" fill="#ff4444"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <circle cx="16" cy="16" r="4" fill="#ff4444"/>
            </svg>
          `),
          scale: 1.0,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: 'Street View Location',
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -50),
        },
      });
    }
  };

  const exitStreetView = () => {
    if (viewerRef.current) {
      const viewer = viewerRef.current;

      // Remove street view pin
      const pin = viewer.entities.getById('street-view-pin');
      if (pin) {
        viewer.entities.remove(pin);
      }

      // Reset camera controls
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000;

      // Return to overview
      resetView();
    }
  };

  // Right-click handler for dropping pins
  const handleRightClick = (longitude: number, latitude: number) => {
    if (viewerRef.current) {
      enterStreetView(longitude, latitude);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow-lg transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        <button
          onClick={zoomOut}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow-lg transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <button
          onClick={resetView}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow-lg transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>

        <button
          onClick={zoomToAllSites}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded shadow-lg transition-colors"
          title="Zoom to All Sites"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <div className="border-t border-gray-600 my-2"></div>

        <button
          onClick={exitStreetView}
          className="bg-green-600 hover:bg-green-500 text-white p-2 rounded shadow-lg transition-colors"
          title="Exit Street View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded text-sm max-w-xs z-10">
        <div className="font-semibold mb-1">Navigation:</div>
        <div>• Click site to zoom in</div>
        <div>• Double-click to zoom to location</div>
        <div>• Right-click for Street View</div>
        <div>• Mouse wheel to zoom</div>
        <div>• Drag to rotate globe</div>
        <div className="mt-2 text-xs text-yellow-300">
          💡 Street View: Look around with mouse, WASD to move
        </div>
      </div>
    </div>
  );
}
