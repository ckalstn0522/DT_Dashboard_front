import React, { useState } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
// ▼▼▼ [수정] useMap 추가 임포트 ▼▼▼
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
// ▲▲▲ [수정] ▲▲▲
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// ▼▼▼ [수정] Lock, Unlock 아이콘 추가 임포트 ▼▼▼
import { Route, Clock, Trash2, MapPin, Loader2, Lock, Unlock } from 'lucide-react';
// ▲▲▲ [수정] ▲▲▲
import 'leaflet/dist/leaflet.css';

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

const intersectionIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(139, 92, 246)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="white"/>
      <circle cx="12" cy="12" r="3" fill="rgb(139, 92, 246)"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const selectedIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgb(249, 115, 22)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="white"/>
      <circle cx="12" cy="12" r="4" fill="rgb(249, 115, 22)"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// ▼▼▼ [추가] 스크롤 줌 제어 컴포넌트 ▼▼▼
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
// ▲▲▲ [추가] ▲▲▲

export default function RoutePlanning() {
  const [selectedIntersections, setSelectedIntersections] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  
  // ▼▼▼ [추가] 스크롤 잠금 상태 (기본값: 잠김) ▼▼▼
  const [isScrollLocked, setIsScrollLocked] = useState(true);
  // ▲▲▲ [추가] ▲▲▲

  const { data: intersections, isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const center = [
    (36.640140 + 36.673372) / 2,
    (126.663909 + 126.687575) / 2
  ];

  const fetchRoute = async (from, to) => {
    setIsLoadingRoute(true);
    const fromCoords = { latitude: parseFloat(from.latitude), longitude: parseFloat(from.longitude) };
    const toCoords = { latitude: parseFloat(to.latitude), longitude: parseFloat(to.longitude) };

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.longitude},${fromCoords.latitude};${toCoords.longitude},${toCoords.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeGeometry = data.routes[0].geometry.coordinates;
        const positions = routeGeometry.map(coord => [coord[1], coord[0]]);
        const distance = (data.routes[0].distance / 1000).toFixed(2);
        const duration = Math.round(data.routes[0].duration);
        return { positions, distance, duration };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
    
    return {
      positions: [[fromCoords.latitude, fromCoords.longitude], [toCoords.latitude, toCoords.longitude]],
      distance: calculateDistance(fromCoords, toCoords),
      duration: null,
    };
  };

  const calculateDistance = (from, to) => {
    const R = 6371;
    const dLat = (parseFloat(to.latitude) - parseFloat(from.latitude)) * Math.PI / 180;
    const dLon = (parseFloat(to.longitude) - parseFloat(from.longitude)) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(parseFloat(from.latitude) * Math.PI / 180) * Math.cos(parseFloat(to.latitude) * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const handleMarkerClick = async (intersection) => {
    if (selectedIntersections.length === 2) {
      setSelectedIntersections([intersection]);
      setRoutes([]);
    } else if (selectedIntersections.length === 1) {
      const newSelection = [...selectedIntersections, intersection];
      setSelectedIntersections(newSelection);
      const routeData = await fetchRoute(selectedIntersections[0], intersection);
      const route = {
        from: selectedIntersections[0],
        to: intersection,
        positions: routeData.positions,
        distance: routeData.distance,
        duration: routeData.duration,
        data: generateTravelTimeData(routeData.distance)
      };
      setRoutes([route]);
    } else {
      setSelectedIntersections([intersection]);
    }
  };

  const generateTravelTimeData = (distance) => {
    const hours = ['07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '19:00'];
    const baseTime = parseFloat(distance) * 60;
    return hours.map((hour) => {
      let multiplier = 1;
      if (hour === '08:00' || hour === '18:00') multiplier = 1.8;
      else if (hour === '09:00' || hour === '17:00' || hour === '19:00') multiplier = 1.5;
      else if (hour === '07:00') multiplier = 1.3;
      return {
        time: hour,
        travelTime: Math.round(baseTime * multiplier + (Math.random() * 20 - 10)),
        distance: distance,
      };
    });
  };

  const clearSelection = () => {
    setSelectedIntersections([]);
    setRoutes([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            경로 분석
          </h1>
          <p className="text-slate-600 dark:text-dashdark-muted mt-1">두 교차로를 선택하여 최단 도로 경로의 통행시간을 분석하세요</p>
        </div>
        {selectedIntersections.length > 0 && (
          <Button 
            variant="outline" 
            onClick={clearSelection}
            className="flex items-center gap-2 dark:bg-dashdark-card dark:border-dashdark-border dark:text-white dark:hover:bg-dashdark-hover"
          >
            <Trash2 className="w-4 h-4" />
            선택 초기화
          </Button>
        )}
      </div>

      {isLoadingRoute && (
        <Card className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">도로 경로를 계산하는 중...</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-dashdark-sidebar border-b border-slate-100 dark:border-dashdark-border">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
                <Route className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                경로 선택 맵 (실제 도로 기반)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[700px]">
                {isLoading ? (
                  <Skeleton className="w-full h-full bg-slate-200 dark:bg-dashdark-bg" />
                ) : (
                  <MapContainer 
                    center={center} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                    // ▼▼▼ [수정] 스크롤 줌 제어 연결 ▼▼▼
                    scrollWheelZoom={!isScrollLocked}
                    // ▲▲▲ [수정] ▲▲▲
                  >
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {intersections.map((intersection) => (
                      <Marker
                        key={intersection._id} 
                        position={[parseFloat(intersection.latitude), parseFloat(intersection.longitude)]}
                        icon={selectedIntersections.find(s => s._id === intersection._id) ? selectedIcon : intersectionIcon}
                        eventHandlers={{ click: () => handleMarkerClick(intersection) }}
                      />
                    ))}
                    {routes.map((route, idx) => (
                      <Polyline
                        key={idx}
                        positions={route.positions}
                        pathOptions={{ color: 'rgb(139, 92, 246)', weight: 5, opacity: 0.9 }}
                      />
                    ))}
                    
                    {/* ▼▼▼ [추가] 스크롤 제어 버튼 배치 ▼▼▼ */}
                    <ScrollWheelControl 
                      isLocked={isScrollLocked} 
                      onToggle={() => setIsScrollLocked(!isScrollLocked)} 
                    />
                    {/* ▲▲▲ [추가] ▲▲▲ */}
                  </MapContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
            <CardHeader className="border-b border-slate-100 dark:border-dashdark-border pb-4">
              <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                선택된 교차로
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {selectedIntersections.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <p>지도에서 교차로를 선택해주세요</p>
                    <p className="text-xs mt-2">(최대 2개)</p>
                  </div>
                )}
                {selectedIntersections.map((intersection, idx) => (
                  <div key={intersection._id} className="p-4 bg-slate-50 dark:bg-dashdark-sidebar rounded-lg border border-slate-200 dark:border-dashdark-border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {intersection.intersection_name}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {parseFloat(intersection.latitude).toFixed(6)}°, {parseFloat(intersection.longitude).toFixed(6)}°
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {routes.length > 0 && routes[0].data && (
            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
              <CardHeader className="border-b border-slate-100 dark:border-dashdark-border pb-4">
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  경로 정보 및 통행 시간
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 dark:bg-dashdark-sidebar rounded-xl border border-slate-200 dark:border-dashdark-border">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">총 거리</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {routes[0].distance} <span className="text-sm font-normal text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-dashdark-sidebar rounded-xl border border-slate-200 dark:border-dashdark-border">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">평균 소요</div>
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {(routes[0].data.reduce((sum, d) => sum + d.travelTime, 0) / routes[0].data.length).toFixed(0)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">초</span>
                    </div>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={routes[0].data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A303F" vertical={false} />
                      <XAxis dataKey="time" tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1E2330', borderColor: '#2A303F', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="travelTime" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}