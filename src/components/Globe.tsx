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

    // Set Cesium Ion access token (using default ion assets)
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5N2UyMjcwOS00MDY1LTQxYjEtYjZjMy00YTU0ZTg1YmFjYzciLCJpZCI6OTc3MSwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU1Njk4OTUyOX0.3k0v0nN2c2_lV0kz1s8BRYCYqkL4pzrFZTUlGBrEuMg';

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
    });

    // Load world terrain asynchronously
    Cesium.createWorldTerrainAsync().then((terrainProvider) => {
      viewer.terrainProvider = terrainProvider;
    });

    // Set default view from config
    const { longitude, latitude, height } = config.visualization.defaultView;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO * 0.5,
        roll: 0.0,
      },
    });

    // Enable depth testing to avoid z-fighting
    viewer.scene.globe.depthTestAgainstTerrain = true;

    viewerRef.current = viewer;

    return () => {
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
      const { name, type, confidence } = feature.properties;

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
          onSiteClick(featureData as SiteFeature);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

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

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    />
  );
}
