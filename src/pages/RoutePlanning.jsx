import React, { useState, useEffect } from "react";
// ▼▼▼ [수정됨] base44 대신 axios 임포트 ▼▼▼
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
// ▲▲▲ [수정됨] ▲▲▲
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Route, Clock, Trash2, MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// API 서버 주소
const API_URL = 'http://localhost:3001/apihttps://dt-dashboard-back.onrender.com';

const intersectionIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(6, 182, 212)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="white"/>
      <circle cx="12" cy="12" r="3" fill="rgb(6, 182, 212)"/>
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

export default function RoutePlanning() {
  const [selectedIntersections, setSelectedIntersections] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // ▼▼▼ [수정됨] base44 -> axios로 API 호출 변경 ▼▼▼
  const { data: intersections, isLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });
  // ▲▲▲ [수정됨] ▲▲▲

  const bounds = [
    [36.640140, 126.663909],
    [36.673372, 126.687575]
  ];
  
  const center = [
    (36.640140 + 36.673372) / 2,
    (126.663909 + 126.687575) / 2
  ];

  const fetchRoute = async (from, to) => {
    setIsLoadingRoute(true);
    
    // ▼▼▼ [수정됨] String을 Number로 변환하여 API 호출 ▼▼▼
    const fromCoords = {
        latitude: parseFloat(from.latitude),
        longitude: parseFloat(from.longitude)
    };
    const toCoords = {
        latitude: parseFloat(to.latitude),
        longitude: parseFloat(to.longitude)
    };
    // ▲▲▲ [수정됨] ▲▲▲

    try {
      // OSRM API를 사용하여 실제 도로 경로 가져오기
      const url = `https://router.project-osrm.org/route/v1/driving/${fromCoords.longitude},${fromCoords.latitude};${toCoords.longitude},${toCoords.latitude}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeGeometry = data.routes[0].geometry.coordinates;
        const positions = routeGeometry.map(coord => [coord[1], coord[0]]); // [lng, lat] -> [lat, lng]
        const distance = (data.routes[0].distance / 1000).toFixed(2); // meters to km
        const duration = Math.round(data.routes[0].duration); // seconds
        
        return {
          positions,
          distance,
          duration,
        };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setIsLoadingRoute(false);
    }
    
    // Fallback to straight line if API fails
    return {
      positions: [
        [fromCoords.latitude, fromCoords.longitude],
        [toCoords.latitude, toCoords.longitude]
      ],
      distance: calculateDistance(fromCoords, toCoords),
      duration: null,
    };
  };

  const calculateDistance = (from, to) => {
    // ▼▼▼ [수정됨] parseFloat 추가 (이미 fetchRoute에서 변환했지만, 안전장치로 둠) ▼▼▼
    const R = 6371; // Earth's radius in km
    const dLat = (parseFloat(to.latitude) - parseFloat(from.latitude)) * Math.PI / 180;
    const dLon = (parseFloat(to.longitude) - parseFloat(from.longitude)) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(parseFloat(from.latitude) * Math.PI / 180) * Math.cos(parseFloat(to.latitude) * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    // ▲▲▲ [수정됨] ▲▲▲
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
      
      // Fetch actual road route
      const routeData = await fetchRoute(selectedIntersections[0], intersection);
      
      // ▼▼▼ [수정됨] AI 원본 코드는 DB의 TravelTime을 쓰지 않습니다.
      // (가짜 차트 데이터를 생성하는 로직을 그대로 사용합니다)
      const route = {
        from: selectedIntersections[0],
        to: intersection,
        positions: routeData.positions,
        distance: routeData.distance,
        duration: routeData.duration,
        data: generateTravelTimeData(routeData.distance) // 가짜 데이터 생성
      };
      // ▲▲▲ [수정됨] ▲▲▲
      setRoutes([route]);
    } else {
      setSelectedIntersections([intersection]);
    }
  };

  // ▼▼▼ [수정됨] AI 원본의 가짜 데이터 생성 로직 (DB 데이터 안 씀) ▼▼▼
  const generateTravelTimeData = (distance) => {
    const hours = ['07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '19:00'];
    const baseTime = parseFloat(distance) * 60; // 기본: 1km당 60초
    
    return hours.map((hour, idx) => {
      // 출퇴근 시간대는 통행시간 증가
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
  // ▲▲▲ [수정됨] ▲▲▲

  const clearSelection = () => {
    setSelectedIntersections([]);
    setRoutes([]);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
              경로 분석
            </h1>
            <p className="text-slate-600 mt-1">두 교차로를 선택하여 최단 도로 경로의 통행시간을 분석하세요</p>
          </div>
          {selectedIntersections.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearSelection}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              선택 초기화
            </Button>
          )}
        </div>

        {isLoadingRoute && (
          <Card className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-none shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">도로 경로를 계산하는 중...</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map */}
          <div className="xl:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden relative z-0">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  경로 선택 맵 (실제 도로 기반)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[700px]">
                  {isLoading ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <MapContainer
                      center={center}
                      zoom={14}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {intersections.map((intersection) => (
                        <Marker
                          // ▼▼▼ [수정됨] key와 id 비교를 DB의 고유 _id로 변경 ▼▼▼
                          key={intersection._id} 
                          position={[parseFloat(intersection.latitude), parseFloat(intersection.longitude)]}
                          icon={
                            selectedIntersections.find(s => s._id === intersection._id)
                              ? selectedIcon
                              : intersectionIcon
                          }
                          // ▲▲▲ [수정됨] ▲▲▲
                          eventHandlers={{
                            click: () => handleMarkerClick(intersection),
                          }}
                        />
                      ))}

                      {routes.map((route, idx) => (
                        <Polyline
                          key={idx}
                          positions={route.positions}
                          pathOptions={{
                            color: 'rgb(249, 115, 22)',
                            weight: 5,
                            opacity: 0.9,
                            lineJoin: 'round',
                            lineCap: 'round',
                          }}
                        />
                      ))}
                    </MapContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Info Panel */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  선택된 교차로
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedIntersections.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <p>지도에서 교차로를 선택해주세요</p>
                      <p className="text-xs mt-2">(최대 2개)</p>
                    </div>
                  )}
                  
                  {selectedIntersections.map((intersection, idx) => (
                    // ▼▼▼ [수정됨] key와 id 비교를 DB의 고유 _id로 변경 ▼▼▼
                    <div key={intersection._id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="font-semibold text-slate-900">
                          {intersection.intersection_name}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {/* ▼▼▼ [수정됨] String -> Number 변환 후 toFixed() 호출 ▼▼▼ */}
                        {parseFloat(intersection.latitude).toFixed(6)}°, {parseFloat(intersection.longitude).toFixed(6)}°
                        {/* ▲▲▲ [수정됨] ▲▲▲ */}
                      </div>
                    </div>
                    // ▲▲▲ [수정됨] ▲▲▲
                  ))}
                </div>
              </CardContent>
            </Card>

            {routes.length > 0 && routes[0].data && (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    경로 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Route className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-900">실제 도로 거리</span>
                      </div>
                      <div className="text-3xl font-bold text-indigo-700">
                        {routes[0].distance} km
                      </div>
                      {routes[0].duration && (
                        <div className="text-sm text-slate-600 mt-2">
                          예상 주행시간: {Math.round(routes[0].duration / 60)}분
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">평균 통행시간</div>
                        <div className="text-xl font-bold text-orange-700">
                          {(routes[0].data.reduce((sum, d) => sum + d.travelTime, 0) / routes[0].data.length).toFixed(0)}초
                        </div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg">
                        <div className="text-xs text-slate-600 mb-1">경로 구간</div>
                        <div className="text-xl font-bold text-cyan-700">
                          {routes[0].positions.length}개
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Travel Time Chart */}
        {routes.length > 0 && routes[0].data && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">시간대별 통행시간 (실제 도로 경로 기반)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={routes[0].data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" />
                  <YAxis 
                    label={{ value: '통행시간 (초)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="travelTime" 
                    stroke="rgb(249, 115, 22)" 
                    strokeWidth={3}
                    name="통행시간 (초)"
                    dot={{ fill: 'rgb(249, 115, 22)', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span>출퇴근 시간대(8-9시, 17-19시)에는 통행시간이 최대 80% 증가합니다</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}