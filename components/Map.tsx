// components/Map.tsx

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css'; // Import OpenLayers CSS
import Map from 'ol/Map'; // Import Map class from OpenLayers
import View from 'ol/View'; // Import View class from OpenLayers
import TileLayer from 'ol/layer/Tile'; // Import TileLayer class from OpenLayers
import OSM from 'ol/source/OSM'; // Import OSM class from OpenLayers
import { fromLonLat, toLonLat } from 'ol/proj'; // Import projection functions from OpenLayers
import { Draw } from 'ol/interaction'; // Import Draw interaction from OpenLayers
import { Vector as VectorLayer } from 'ol/layer'; // Import VectorLayer class from OpenLayers
import { Vector as VectorSource } from 'ol/source'; // Import VectorSource class from OpenLayers
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'; // Import style components from OpenLayers
import { getArea, getLength } from 'ol/sphere'; // Import sphere functions for measurement from OpenLayers

const MapComponent: React.FC = () => {
  // Create a reference for the map container
  const mapRef = useRef<HTMLDivElement>(null);
  // State to store the map object
  const [map, setMap] = useState<Map | null>(null);
  // State to store the type of drawing (Point, LineString, or Polygon)
  const [drawType, setDrawType] = useState<string | null>(null);

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapRef.current) return;

    // Create a new Map object
    const mapObject = new Map({
      target: mapRef.current, // Set the target element for the map
      layers: [
        new TileLayer({
          source: new OSM(), // Use OpenStreetMap as the base map
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]), // Set the initial center of the map
        zoom: 2, // Set the initial zoom level of the map
      }),
    });

    // Set the map object in state
    setMap(mapObject);

    // Cleanup function to remove the map object when the component unmounts
    return () => {
      mapObject.setTarget(null); // Remove the target element from the map
    };
  }, []);

  // Effect to set up drawing interactions when the map object changes
  useEffect(() => {
    if (!map) return;

    // Create a VectorSource to hold the drawn features
    const source = new VectorSource({ wrapX: false });

    // Create a VectorLayer to render the drawn features
    const vector = new VectorLayer({
      source: source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });

    // Add the VectorLayer to the map
    map.addLayer(vector);

    // Cleanup function to remove the VectorLayer when the component unmounts
    return () => {
      map.removeLayer(vector); // Remove the VectorLayer from the map
    };
  }, [map]);

  // Function to handle drawing based on the selected type
  const handleDraw = (type: string) => {
    if (!map) return;

    // Set the draw type in state
    setDrawType(type);

    // Get the VectorSource for drawing
    const source = map.getLayers().item(1).getSource() as VectorSource;

    // Create a Draw interaction based on the selected type
    const draw = new Draw({
      source: source,
      type: type as any,
    });

    // Add the Draw interaction to the map
    map.addInteraction(draw);

    // Event handler for when drawing is finished
    draw.on('drawend', (evt) => {
      const feature = evt.feature;
      if (type === 'Point') {
        const coords = toLonLat(feature.getGeometry().getCoordinates());
        console.log('Point added:', coords);
      } else if (type === 'LineString') {
        const length = getLength(feature.getGeometry());
        console.log('Length:', length);
      } else if (type === 'Polygon') {
        const area = getArea(feature.getGeometry());
        console.log('Area:', area);
      }
      map.removeInteraction(draw); // Remove the Draw interaction
      setDrawType(null); // Reset the draw type
    });
  };

  // JSX for rendering the map and buttons
  return (
    <div>
      {/* Map container with cursor style */}
      <div ref={mapRef} className="map-container" style={{ width: '100%', height: '500px', cursor: drawType ? 'crosshair' : 'default' }} />
      <div className="btn">
        {/* Buttons to select the type of drawing */}
        <button className="draw-button" onClick={() => handleDraw('Point')}>Draw Point</button>
        <button className="draw-button" onClick={() => handleDraw('LineString')}>Draw Line</button>
        <button className="draw-button" onClick={() => handleDraw('Polygon')}>Draw Polygon</button>
      </div>
    </div>
  );
};

export default MapComponent;
