import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css'; 
import Map from 'ol/Map'; 
import View from 'ol/View'; 
import TileLayer from 'ol/layer/Tile'; 
import OSM from 'ol/source/OSM'; 
import { fromLonLat, toLonLat } from 'ol/proj'; 
import { Draw } from 'ol/interaction'; 
import { Vector as VectorLayer } from 'ol/layer'; 
import { Vector as VectorSource } from 'ol/source'; 
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { getArea, getLength } from 'ol/sphere'; 

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [drawType, setDrawType] = useState<string | null>(null);
  const [drawnFeatureInfo, setDrawnFeatureInfo] = useState<string | null>(null);

  // Initialize the map when the component mounts
  useEffect(() => {
    if (!mapRef.current) return;

    const mapObject = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    setMap(mapObject);

    // Cleanup function to remove the map object when the component unmounts
    return () => {
      mapObject.setTarget(null);
    };
  }, []);

  // Setup drawing layer when the map is initialized or changed
  useEffect(() => {
    if (!map) return;

    const source = new VectorSource({ wrapX: false });

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

    map.addLayer(vector);

    // Cleanup function to remove the vector layer when the component unmounts or map changes
    return () => {
      map.removeLayer(vector);
    };
  }, [map]);

  // Function to handle drawing based on the selected type
  const handleDraw = (type: string) => {
    if (!map) return;

    setDrawType(type);
    setDrawnFeatureInfo(null);

    const source = map.getLayers().item(1).getSource() as VectorSource;

    const draw = new Draw({
      source: source,
      type: type as any,
    });

    map.addInteraction(draw);

    draw.on('drawend', async (evt) => {
      const feature = evt.feature;
      let info = '';
      const coords = toLonLat(feature.getGeometry().getCoordinates());
      const [lon, lat] = coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const placeName = data.display_name;
        if (type === 'Point') {
          info = `Point added: ${placeName} (${coords.join(', ')})`;
        } else if (type === 'LineString') {
          const length = getLength(feature.getGeometry());
          info = `Length: ${length.toFixed(2)} meters`;
        } else if (type === 'Polygon') {
          const area = getArea(feature.getGeometry());
          info = `Area: ${area.toFixed(2)} square meters`;
        }
      } catch (error) {
        console.error('Error fetching place name:', error);
        info = `Point added: ${coords.join(', ')}`;
      }
      setDrawnFeatureInfo(info);
      map.removeInteraction(draw);
      setDrawType(null);
    });
  };

  return (
    <div>
      {/* Map container */}
      <div ref={mapRef} className="map-container" style={{ width: '100%', height: '500px', cursor: drawType ? 'crosshair' : 'default' }} />
      {/* Information about drawn feature */}
      {drawnFeatureInfo && (
        <div className="drawn-feature-info">
          {drawnFeatureInfo}
        </div>
      )}
      {/* Buttons to select the type of drawing */}
      <div className="btn">
        <button className="draw-button" onClick={() => handleDraw('Point')}>Select Point</button>
        <button className="draw-button" onClick={() => handleDraw('LineString')}>Draw Line</button>
        <button className="draw-button" onClick={() => handleDraw('Polygon')}>Draw Polygon</button>
      </div>
    </div>
  );
};

export default MapComponent;
