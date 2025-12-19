import React, { useState } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Route, Clock, Trash2, MapPin, Loader2, Lock, Unlock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from "@/context/LanguageContext";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

// 아이콘 설정
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

function ScrollWheelControl({ isLocked, onToggle }) {
  const map = useMap();
  React.useEffect(() => {
    if (isLocked) map.scrollWheelZoom.disable();
    else map.scrollWheelZoom.enable();
  }, [isLocked, map]);
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '80px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <Button onClick={onToggle} size="sm" variant={isLocked ? "default" : "secondary"} className={`w-10 h-10 p-0 rounded-md shadow-lg border-0 ${isLocked ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white dark:bg-dashdark-card hover:bg-slate-100 dark:hover:bg-dashdark-hover text-slate-700 dark:text-white'}`}>
          {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}

export default function RoutePlanning() {
  const { t } = useLanguage();
  const [selectedIntersections, setSelectedIntersections] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(true);

  // 1. 교차로 데이터 조회
  const { data: intersections, isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  // 2. 시뮬레이션 비교 데이터 조회 (평균 속도 가져오기 위함)
  const { data: comparisons } = useQuery({
    queryKey: ['simulationcomparison'],
    queryFn: () => axios.get(`${API_URL}/simulationcomparison`).then(res => res.data),
    initialData: [],
  });

  // DB에서 가져온 속도값 적용 (데이터가 없으면 기본값 50/60 사용)
  const baseData = comparisons.find(c => c.scenario_name === 'Base') || {};
  const optionData = comparisons.find(c => c.scenario_name === 'Option') || {};
  
  const baseSpeed = baseData.avg_speed || 50; 
  const optionSpeed = optionData.avg_speed || 60;

  const center = [(36.640140 + 36.673372) / 2, (126.663909 + 126.687575) / 2];

  // 경로 탐색 API 호출
  const fetchRoute = async (from, to) => {
    setIsLoadingRoute(true);
    const fromCoords = { latitude: parseFloat(from.latitude), longitude: parseFloat(from.longitude) };
    const toCoords = { latitude: parseFloat(to.latitude), longitude: parseFloat(to.longitude) };

    try {
      const urlForward = `https://router.project-osrm.org/route/v1/driving/${fromCoords.longitude},${fromCoords.latitude};${toCoords.longitude},${toCoords.latitude}?overview=full&geometries=geojson&radiuses=1000;1000`;
      const urlBackward = `https://router.project-osrm.org/route/v1/driving/${toCoords.longitude},${toCoords.latitude};${fromCoords.longitude},${fromCoords.latitude}?overview=full&geometries=geojson&radiuses=1000;1000`;
      
      const [resForward, resBackward] = await Promise.all([fetch(urlForward), fetch(urlBackward)]);
      const dataForward = await resForward.json();
      const dataBackward = await resBackward.json();
      
      let bestRoute = null;
      const route1 = dataForward.code === 'Ok' && dataForward.routes[0];
      const route2 = dataBackward.code === 'Ok' && dataBackward.routes[0];

      if (route1 && route2) bestRoute = route1.distance <= route2.distance ? route1 : route2;
      else if (route1) bestRoute = route1;
      else if (route2) bestRoute = route2;

      if (bestRoute) {
        const routeGeometry = bestRoute.geometry.coordinates;
        const positions = routeGeometry.map(coord => [coord[1], coord[0]]);
        const distanceKm = bestRoute.distance / 1000;
        
        // *주의: 여기서 시간을 계산하지 않고 거리만 반환합니다.
        // 속도 데이터가 로딩되기 전일 수도 있고, 화면 렌더링 시점의 최신 baseSpeed/optionSpeed를 쓰기 위함입니다.
        return {
          positions,
          distance: distanceKm.toFixed(2),
        };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
    return null;
  };

  const handleMarkerClick = async (intersection) => {
    if (selectedIntersections.length === 2) {
      setSelectedIntersections([intersection]);
      setRoutes([]);
    } else if (selectedIntersections.length === 1) {
      const newSelection = [...selectedIntersections, intersection];
      setSelectedIntersections(newSelection);
      const routeData = await fetchRoute(selectedIntersections[0], intersection);
      if (routeData) {
        setRoutes([routeData]);
      }
    } else {
      setSelectedIntersections([intersection]);
    }
  };

  const clearSelection = () => {
    setSelectedIntersections([]);
    setRoutes([]);
  };

  // 렌더링 시점에 계산된 시간 (초 단위)
  const calculateDuration = (distKm, speedKmh) => {
    if (!speedKmh || speedKmh === 0) return 0;
    return Math.round((distKm / speedKmh) * 3600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('routeTitle')}</h1>
          <p className="text-slate-600 dark:text-dashdark-muted mt-1">{t('routeDesc')}</p>
        </div>
        {selectedIntersections.length > 0 && (
          <Button variant="outline" onClick={clearSelection} className="flex items-center gap-2 dark:bg-dashdark-card dark:border-dashdark-border dark:text-white">
            <Trash2 className="w-4 h-4" /> {t('resetSelection')}
          </Button>
        )}
      </div>

      {isLoadingRoute && (
        <Card className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-none shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">{t('calculating')}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-dashdark-sidebar border-b border-slate-100 dark:border-dashdark-border">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
                <Route className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                {t('mapTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[700px]">
                {isLoading ? <Skeleton className="w-full h-full" /> : (
                  <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={!isScrollLocked}>
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {intersections.map((intersection) => (
                      <Marker key={intersection._id} position={[parseFloat(intersection.latitude), parseFloat(intersection.longitude)]} icon={selectedIntersections.find(s => s._id === intersection._id) ? selectedIcon : intersectionIcon} eventHandlers={{ click: () => handleMarkerClick(intersection) }} />
                    ))}
                    {routes.map((route, idx) => (
                      <Polyline key={idx} positions={route.positions} pathOptions={{ color: 'rgb(139, 92, 246)', weight: 5, opacity: 0.9 }} />
                    ))}
                    <ScrollWheelControl isLocked={isScrollLocked} onToggle={() => setIsScrollLocked(!isScrollLocked)} />
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
                 {t('selectedInt')}
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-4">
               {selectedIntersections.length === 0 && <div className="text-center py-8 text-slate-400">{t('selectPrompt')}</div>}
               <div className="space-y-3">
                 {selectedIntersections.map((intersection, idx) => (
                   <div key={intersection._id} className="p-4 bg-slate-50 dark:bg-dashdark-sidebar rounded-lg border border-slate-200 dark:border-dashdark-border">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                        <div className="font-semibold text-slate-900 dark:text-white">{intersection.intersection_name}</div>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
          </Card>

          {routes.length > 0 && (
            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
              <CardHeader className="border-b border-slate-100 dark:border-dashdark-border pb-4">
                <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  {t('routeInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="p-4 bg-slate-50 dark:bg-dashdark-sidebar rounded-xl border border-slate-200 dark:border-dashdark-border text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('totalDist')}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {routes[0].distance} <span className="text-sm font-normal text-slate-500">km</span>
                  </div>
                </div>

                <div className="space-y-3">
                    {/* Base Scenario */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-100 dark:bg-dashdark-bg border border-slate-200 dark:border-dashdark-border">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                            <div>
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('baseScenario')}</div>
                                <div className="text-xs text-slate-500">{t('speed')}: {baseSpeed.toFixed(1)} km/h</div>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                           {(() => {
                                const duration = calculateDuration(routes[0].distance, baseSpeed);
                                return <>{Math.floor(duration / 60)} <span className="text-xs font-normal">min</span> {duration % 60}<span className="text-xs font-normal">s</span></>;
                            })()}
                        </div>
                    </div>

                    {/* Option Scenario */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-violet-600"></div>
                            <div>
                                <div className="text-sm font-semibold text-violet-700 dark:text-violet-300">{t('optionScenario')}</div>
                                <div className="text-xs text-violet-500 dark:text-violet-400">{t('speed')}: {optionSpeed.toFixed(1)} km/h</div>
                            </div>
                        </div>
                        <div className="text-lg font-bold text-violet-700 dark:text-violet-300">
                            {(() => {
                                const duration = calculateDuration(routes[0].distance, optionSpeed);
                                return <>{Math.floor(duration / 60)} <span className="text-xs font-normal">min</span> {duration % 60}<span className="text-xs font-normal">s</span></>;
                            })()}
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}