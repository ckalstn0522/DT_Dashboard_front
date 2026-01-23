import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from 'lucide-react';

const createCustomIcon = (isSelected = false) => {
  const iconHtml = isSelected 
    ? `<div style="background-color: rgb(139, 92, 246); width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
         <div style="color: white; font-size: 18px; font-weight: bold;">📍</div>
       </div>`
    : `<div style="background-color: rgb(99, 102, 241); width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
         <div style="color: white; font-size: 12px;">🚦</div>
       </div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker-icon',
    iconSize: isSelected ? [32, 32] : [24, 24],
    iconAnchor: isSelected ? [16, 16] : [12, 12],
  });
};

function ScrollWheelControl({ isLocked, onToggle }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (isLocked) {
      map.scrollWheelZoom.disable();
    } else {
      map.scrollWheelZoom.enable();
    }
  }, [isLocked, map]);

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '80px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <Button
          onClick={onToggle}
          size="sm"
          variant={isLocked ? "default" : "secondary"}
          className={`w-10 h-10 p-0 rounded-md shadow-lg border-0 ${
            isLocked 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-white dark:bg-dashdark-card hover:bg-slate-100 dark:hover:bg-dashdark-hover text-slate-700 dark:text-white'
          }`}
          title={isLocked ? "스크롤 확대/축소 잠김" : "스크롤 확대/축소 활성화"}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}

export default function IntersectionMap({ intersections, onSelectIntersection, selectedIntersectionId }) {
  const [isScrollLocked, setIsScrollLocked] = useState(true);

  // ▼▼▼ [수정됨] 연구 범위 변경에 따른 중심 좌표 재계산 ▼▼▼
  // NW: 36.366873, 127.326925
  // SE: 36.300134, 127.350779
  // Center: (36.366873 + 36.300134)/2, (127.326925 + 127.350779)/2
  const center = [36.65566, 126.67569]; 
  
  const bounds = [
    [36.67282, 126.66241], // South-West (MinLat, MinLng)
    [36.63850, 126.68897]  // North-East (MaxLat, MaxLng)
  ];

  return (
    <MapContainer
      center={center}
      zoom={14} 
      style={{ height: '100%', width: '100%' }}
      maxBoundsViscosity={1.0}
      scrollWheelZoom={!isScrollLocked}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Rectangle
        bounds={bounds}
        pathOptions={{
          color: 'rgb(139, 92, 246)',
          weight: 3,
          fillOpacity: 0.05,
          dashArray: '10, 10'
        }}
      />

      {intersections.map((intersection) => (
        <Marker
          key={intersection.intersection_id}
          position={[parseFloat(intersection.latitude), parseFloat(intersection.longitude)]}
          icon={createCustomIcon(intersection.intersection_id === selectedIntersectionId)}
          eventHandlers={{
            click: () => onSelectIntersection(intersection),
          }}
        >
          <Popup className="custom-popup">
            <div className="p-2">
              <h3 className="font-bold text-slate-900 mb-1">
                {intersection.intersection_name}
              </h3>
              <div className="text-xs text-slate-600 space-y-1">
                <div>ID: {intersection.intersection_id}</div>
                <div>
                  {parseFloat(intersection.latitude).toFixed(4)}, {parseFloat(intersection.longitude).toFixed(4)}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      <ScrollWheelControl 
        isLocked={isScrollLocked} 
        onToggle={() => setIsScrollLocked(!isScrollLocked)} 
      />
    </MapContainer>
  );
}