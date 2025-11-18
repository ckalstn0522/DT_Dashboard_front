import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from 'lucide-react';

// Custom icon for intersection markers
const createCustomIcon = (isSelected = false) => {
  const iconHtml = isSelected 
    ? `<div style="background-color: rgb(59, 130, 246); width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
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

// Component to control map scroll wheel zoom dynamically
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
          className={`w-10 h-10 p-0 rounded-md shadow-lg ${
            isLocked 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-white hover:bg-slate-100 text-slate-700'
          }`}
          title={isLocked ? "스크롤 확대/축소 잠김 (클릭하여 해제)" : "스크롤 확대/축소 활성화 (클릭하여 잠금)"}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}

export default function IntersectionMap({ intersections, onSelectIntersection, selectedIntersectionId }) {
  const [isScrollLocked, setIsScrollLocked] = useState(true); // 기본값: 잠김 상태

  const center = [36.6565, 126.676]; // 연구 범위 중심
  const bounds = [
    [36.640, 126.664], // 남서쪽
    [36.673, 126.688]  // 북동쪽
  ];

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      scrollWheelZoom={!isScrollLocked} // 초기 상태 설정
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* 연구 범위 표시 */}
      <Rectangle
        bounds={bounds}
        pathOptions={{
          color: 'rgb(59, 130, 246)',
          weight: 3,
          fillOpacity: 0.05,
          dashArray: '10, 10'
        }}
      />

      {/* 교차로 마커 */}
      {intersections.map((intersection) => (
        <Marker
          // ▼▼▼ [수정됨] key 값을 고유한 intersection_id로 설정 (경고 해결) ▼▼▼
          key={intersection.intersection_id}
          // ▲▲▲ [수정됨] ▲▲▲
          
          // ▼▼▼ [수정됨] String -> Number 변환 (안전하게) ▼▼▼
          position={[parseFloat(intersection.latitude), parseFloat(intersection.longitude)]}
          // ▲▲▲ [수정됨] ▲▲▲
          
          icon={createCustomIcon(intersection.intersection_id === selectedIntersectionId)}
          eventHandlers={{
            click: () => onSelectIntersection(intersection),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-slate-900 mb-1">
                {intersection.intersection_name}
              </h3>
              <div className="text-xs text-slate-600 space-y-1">
                <div>교차로 번호: {intersection.intersection_id}</div>
                <div>신호 페이즈: {intersection.phase_count || 'N/A'}개</div>
                <div>
                  {/* ▼▼▼ [수정됨] toFixed 호출 전 parseFloat 변환 ▼▼▼ */}
                  위치: {parseFloat(intersection.latitude).toFixed(4)}°, {parseFloat(intersection.longitude).toFixed(4)}°
                  {/* ▲▲▲ [수정됨] ▲▲▲ */}
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Scroll Wheel Control Button */}
      <ScrollWheelControl 
        isLocked={isScrollLocked} 
        onToggle={() => setIsScrollLocked(!isScrollLocked)} 
      />
    </MapContainer>
  );
}