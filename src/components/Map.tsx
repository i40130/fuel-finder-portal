
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FuelStation } from '@/lib/fuelApi';

interface MapProps {
  stations: FuelStation[];
  routeCoordinates?: number[][];
  selectedStation?: FuelStation;
}

const Map = ({ stations, routeCoordinates, selectedStation }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoianVhbmJhLWVzY3JpZyIsImEiOiJjbTcwYnJvOTcwMGQ1MmlzN2R4bzh4eXRhIn0.77pvZCAPAEWReY12K0mBPg';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-3.70325, 40.4167], // Madrid by default
      zoom: 5
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Update markers when stations or selected station changes
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers for stations
    stations.forEach(station => {
      const lat = parseFloat(station.Latitud.replace(',', '.'));
      const lng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));

      const el = document.createElement('div');
      el.className = 'marker';
      
      // Highlight selected station
      if (selectedStation?.IDEESS === station.IDEESS) {
        el.style.backgroundColor = '#00FF00';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.border = '3px solid #000';
      } else {
        el.style.backgroundColor = '#FF0000';
        el.style.width = '15px';
        el.style.height = '15px';
      }
      el.style.borderRadius = '50%';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <h3>${station.Rótulo}</h3>
          <p>Gasolina 95: ${station['Precio Gasolina 95 E5']}€</p>
          <p>Diésel: ${station['Precio Gasoleo A']}€</p>
        `))
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [stations, selectedStation]);

  // Update route when coordinates change
  useEffect(() => {
    if (!map.current || !routeCoordinates || routeCoordinates.length < 2) return;

    if (map.current.getSource('route')) {
      (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeCoordinates
        }
      });
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });
    }

    // Fit map to show the entire route
    const bounds = new mapboxgl.LngLatBounds();
    routeCoordinates.forEach(coord => bounds.extend([coord[0], coord[1]]));
    map.current.fitBounds(bounds, { padding: 50 });
  }, [routeCoordinates]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default Map;
