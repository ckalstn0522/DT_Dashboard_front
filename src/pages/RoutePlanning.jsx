import React, { useState } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Route, Clock, Trash2, MapPin, Loader2, Lock, Unlock, Timer, Car, ArrowRight, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from "@/context/LanguageContext";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

// [아이콘 정의 유지]
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

// [스크롤 컨트롤 컴포넌트 유지]
function ScrollWheelControl({ isLocked, onToggle }) {
  const map = useMap();
  React.useEffect(() => {
    if (isLocked) map.scrollWheelZoom.disable();
    else map.scrollWheelZoom.enable();
  }, [isLocked, map]);
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar border-0 shadow-md">
        <Button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }} 
          size="sm" 
          className={`w-9 h-9 p-0 rounded-md border-0 ${isLocked ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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

  // [데이터 쿼리 유지]
  const { data: intersections, isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const { data: comparisons } = useQuery({
    queryKey: ['simulationcomparison'],
    queryFn: () => axios.get(`${API_URL}/simulationcomparison`).then(res => res.data),
    initialData: [],
  });

  const baseData = comparisons.find(c => c.scenario_name === 'Base') || {};
  const optionData = comparisons.find(c => c.scenario_name === 'Option') || {};
  const baseSpeed = baseData.avg_speed || 50; 
  const optionSpeed = optionData.avg_speed || 60;
  
  const center = [(36.67282 + 36.63850) / 2, (126.66241 + 126.68897) / 2];

  // [경로 탐색 로직 유지]
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
        
        const trafficVolumeBase = Math.floor(Math.random() * (3000 - 100 + 1)) + 100;
        const trafficVolumeOption = Math.floor(trafficVolumeBase * (0.9 + Math.random() * 0.2));

        return {
          positions,
          distance: distanceKm.toFixed(2),
          trafficVolumeBase, 
          trafficVolumeOption,
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

  const calculateDuration = (distKm, speedKmh) => {
    if (!speedKmh || speedKmh === 0) return 0;
    return Math.round((distKm / speedKmh) * 3600);
  };

  return (
    // [레이아웃 통일] Wrapper: 다른 페이지와 정확히 동일한 패딩/높이 적용
    <div className="w-full max-w-[1920px] mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-20px)] overflow-hidden">
      
      {/* [헤더 통일] 스타일 및 여백 통일 */}
      <div className="mb-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
             {t('routeTitle')}
           </h1>
           <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">{t('routeDesc')}</p>
        </div>
        {selectedIntersections.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearSelection} className="flex items-center gap-2 dark:bg-dashdark-card dark:border-dashdark-border dark:text-white">
            <Trash2 className="w-4 h-4" /> {t('resetSelection')}
          </Button>
        )}
      </div>

      {isLoadingRoute && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
            <Card className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-none shadow-lg animate-in fade-in zoom-in duration-300">
              <CardContent className="p-3 px-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium text-sm">{t('calculating')}</span>
              </CardContent>
            </Card>
         </div>
      )}

      {/* [그리드 레이아웃] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* [왼쪽 지도 영역] 
            - 위치 통일: 첫 번째 컬럼에서 시작
            - 크기 유지: lg:col-span-8 (화면의 2/3 차지, 기존 'Wide Map' 특성 유지) 
        */}
        <div className="lg:col-span-8 h-full min-h-[400px]">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-md h-full flex flex-col overflow-hidden">
             <CardHeader className="border-b border-slate-50 dark:border-dashdark-border py-3 px-4 shrink-0">
                <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2 text-sm font-bold">
                  <Navigation className="w-4 h-4 text-violet-600" />
                  {t('routeMapTitle')}
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0 flex-1 relative bg-slate-50 z-0">
               {isLoading ? <Skeleton className="w-full h-full" /> : (
                  <MapContainer 
                     center={center} 
                     zoom={14} 
                     style={{ height: '100%', width: '100%' }} 
                     scrollWheelZoom={!isScrollLocked}
                     zoomControl={false}
                  >
                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {intersections.map((intersection) => (
                      <Marker 
                        key={intersection._id} 
                        position={[parseFloat(intersection.latitude), parseFloat(intersection.longitude)]} 
                        icon={selectedIntersections.find(s => s._id === intersection._id) ? selectedIcon : intersectionIcon} 
                        eventHandlers={{ click: () => handleMarkerClick(intersection) }} 
                      />
                    ))}
                    {routes.map((route, idx) => (
                      <Polyline key={idx} positions={route.positions} pathOptions={{ color: 'rgb(139, 92, 246)', weight: 5, opacity: 0.9 }} />
                    ))}
                    <ScrollWheelControl isLocked={isScrollLocked} onToggle={() => setIsScrollLocked(!isScrollLocked)} />
                  </MapContainer>
                )}
             </CardContent>
          </Card>
        </div>

        {/* [오른쪽 정보 패널] col-span-4 (나머지 1/3 차지) */}
        <div className="lg:col-span-4 h-full flex flex-col overflow-y-auto pr-1 custom-scrollbar gap-4">
          
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm shrink-0">
              <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  {t('selectedInt')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {selectedIntersections.length === 0 && <div className="text-center py-4 text-sm text-slate-400">{t('selectPrompt')}</div>}
                <div className="flex flex-wrap gap-3">
                  {selectedIntersections.map((intersection, idx) => (
                    <div key={intersection._id} className="p-3 bg-slate-50 dark:bg-dashdark-sidebar rounded-lg border border-slate-200 dark:border-dashdark-border flex items-center gap-3 min-w-[150px] flex-1">
                         <div className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">{idx + 1}</div>
                         <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{intersection.intersection_name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
          </Card>

          {routes.length > 0 && (
            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex-1 flex flex-col min-h-0">
              <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border shrink-0">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  {t('routeInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                
                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dashdark-sidebar dark:to-dashdark-card rounded-2xl border border-slate-200 dark:border-dashdark-border text-center shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t('totalDist')}</div>
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {routes[0].distance} <span className="text-lg font-medium text-slate-500">km</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-dashdark-border shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-dashdark-sidebar text-slate-600 dark:text-dashdark-muted border-b border-slate-200 dark:border-dashdark-border">
                        <th className="px-4 py-3 text-left font-semibold">Metric</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-white">{t('baseScenario')}</th>
                        <th className="px-4 py-3 text-right font-semibold text-violet-600 dark:text-violet-400">{t('optionScenario')}</th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-500">{t('diff')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dashdark-border bg-white dark:bg-dashdark-card">
                      
                      <tr className="group hover:bg-slate-50 dark:hover:bg-dashdark-hover transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <Car className="w-4 h-4 text-slate-400"/> {t('vehicleCount')}
                        </td>
                        <td className="px-4 py-4 text-right text-slate-800 dark:text-white font-medium">{routes[0].trafficVolumeBase.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-violet-600 dark:text-violet-400 font-bold">{routes[0].trafficVolumeOption.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right text-xs font-semibold">
                          {(() => {
                            const diff = routes[0].trafficVolumeOption - routes[0].trafficVolumeBase;
                            return <span className={diff > 0 ? "text-red-500" : "text-green-500"}>{diff > 0 ? '+' : ''}{diff}</span>
                          })()}
                        </td>
                      </tr>

                      <tr className="group hover:bg-slate-50 dark:hover:bg-dashdark-hover transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Timer className="w-4 h-4 text-slate-400"/> {t('tcur')}
                        </td>
                        <td className="px-4 py-4 text-right text-slate-800 dark:text-white font-medium">
                          {(() => {
                            const d = calculateDuration(routes[0].distance, baseSpeed);
                            return `${Math.floor(d/60)}m ${d%60}s`;
                          })()}
                        </td>
                        <td className="px-4 py-4 text-right text-violet-600 dark:text-violet-400 font-bold">
                          {(() => {
                            const d = calculateDuration(routes[0].distance, optionSpeed);
                            return `${Math.floor(d/60)}m ${d%60}s`;
                          })()}
                        </td>
                        <td className="px-4 py-4 text-right text-xs font-semibold">
                          {(() => {
                            const db = calculateDuration(routes[0].distance, baseSpeed);
                            const do_ = calculateDuration(routes[0].distance, optionSpeed);
                            const diff = do_ - db;
                            return <span className={diff > 0 ? "text-red-500" : "text-green-500"}>{diff > 0 ? '+' : ''}{diff}s</span>
                          })()}
                        </td>
                      </tr>

                      <tr className="group hover:bg-slate-50 dark:hover:bg-dashdark-hover transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-slate-400"/> {t('speed')}
                        </td>
                        <td className="px-4 py-4 text-right text-slate-800 dark:text-white font-medium">{baseSpeed.toFixed(1)} km/h</td>
                        <td className="px-4 py-4 text-right text-violet-600 dark:text-violet-400 font-bold">{optionSpeed.toFixed(1)} km/h</td>
                        <td className="px-4 py-4 text-right text-xs font-semibold">
                          {(() => {
                            const diff = optionSpeed - baseSpeed;
                            return <span className={diff < 0 ? "text-red-500" : "text-green-500"}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
                        <Timer className="w-5 h-5" />
                      </div>
                      <span className="font-bold">{t('timeGap')}</span>
                    </div>
                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                      {(() => {
                        const durationBase = calculateDuration(routes[0].distance, baseSpeed);
                        const durationOption = calculateDuration(routes[0].distance, optionSpeed);
                        const diff = durationBase - durationOption;
                        
                        if (diff > 0) {
                            return <>-{Math.floor(diff / 60)}m {diff % 60}s</>;
                        } else if (diff < 0) {
                            return <>+{Math.floor(Math.abs(diff) / 60)}m {Math.abs(diff) % 60}s</>;
                        } else {
                            return "0s";
                        }
                      })()}
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