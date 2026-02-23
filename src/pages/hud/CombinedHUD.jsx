import React, { useState, useMemo, useEffect } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Car, Activity } from 'lucide-react';

// 컴포넌트 임포트
import IntersectionMap from "../../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../../components/dashboard/VehicleTypeChart";
import TrafficVolumeDisplay from "../../components/dashboard/TrafficVolumeDisplay";

// 다국어 지원 Context 임포트
import { useLanguage } from "../../context/LanguageContext";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

const hudCardStyle = "bg-slate-950/90 backdrop-blur-md border-slate-800/80 shadow-2xl";

export default function CombinedHUD() {
  const [selectedId, setSelectedId] = useState(null);
  
  const { language } = useLanguage();
  const isKo = language === 'ko';

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {};
  }, []);

  const { data: intersections, isLoading: isLoadingIntersections } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const { data: allTrafficData, isLoading: isLoadingTraffic } = useQuery({
    queryKey: ['trafficData'],
    queryFn: () => axios.get(`${API_URL}/trafficdata`).then(res => res.data),
    initialData: [],
  });

  const handleMarkerClick = (intersection) => {
    setSelectedId(intersection.intersection_id);
    if (window.uwb) {
      console.log(`[HUD] Unity로 이동 요청: ID ${intersection.intersection_id}`);
      window.uwb.ExecuteJsMethod("MoveToIntersection", Number(intersection.intersection_id));
    } else {
      console.warn("Unity 환경이 아닙니다. (uwb 객체 없음)");
    }
  };

  const filteredTrafficData = useMemo(() => {
    if (!selectedId) return [];
    return allTrafficData.filter(data => String(data.intersection_id) === String(selectedId));
  }, [selectedId, allTrafficData]);

  const selectedIntersection = useMemo(() => {
    if (!selectedId) return null;
    return intersections.find(i => String(i.intersection_id) === String(selectedId));
  }, [selectedId, intersections]);

  // 개선 후(After) 데이터 생성용
  const optionTrafficData = useMemo(() => {
    return filteredTrafficData.map(data => {
      const multiplier = 1.0 + Math.random() * 2.0; 
      return { ...data, 소계_대: Math.floor((data.소계_대 || 0) * multiplier) };
    });
  }, [filteredTrafficData]);

  if (isLoadingIntersections || isLoadingTraffic) {
    return <Skeleton className="w-full h-screen bg-transparent" />;
  }

  return (
    <div className="flex w-full h-screen overflow-hidden" style={{ backgroundColor: 'transparent' }}>
      
      {/* [왼쪽 패널] 지도 100% */}
      <div className="w-[25%] h-full p-3 pointer-events-auto flex flex-col gap-3">
        <Card className={`h-full w-full overflow-hidden ${hudCardStyle}`}>
          <CardContent className="p-0 h-full relative">
            <div className="h-full w-full absolute inset-0">
              <IntersectionMap
                intersections={intersections}
                onSelectIntersection={handleMarkerClick}
                selectedIntersectionId={selectedId}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* [중앙 패널] 투명 공간 */}
      <div className="w-[50%] h-full pointer-events-none" style={{ backgroundColor: 'transparent' }} />

      {/* [오른쪽 패널] 정보 카드 + 차트 영역 */}
      <div 
        className="w-[25%] h-full p-3 pointer-events-auto flex flex-col gap-3"
        style={{ 
          overflowY: 'auto',
          maxHeight: '100vh',
          scrollBehavior: 'smooth'
        }}
      >
        {/* 1. 교차로 정보 카드 */}
        <Card className={`w-full shrink-0 flex flex-col justify-center overflow-hidden py-2 ${hudCardStyle}`}>
          <CardHeader className="py-2 px-4 min-h-0 shrink-0 border-b border-slate-700/50"> 
            <CardTitle className="text-slate-100 flex items-center gap-2 text-sm font-semibold">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="truncate">
                {selectedIntersection ? selectedIntersection.intersection_name : (isKo ? "교차로 선택" : "Select Intersection")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2 pt-3 flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
            {selectedIntersection ? (
              <div className="text-[11px] text-slate-300 space-y-1.5 w-full">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-1">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono font-bold text-cyan-200">{selectedIntersection.intersection_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isKo ? '위도' : 'Lat'}</span>
                  <span className="font-mono truncate ml-2">{parseFloat(selectedIntersection.latitude).toFixed(5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{isKo ? '경도' : 'Lng'}</span>
                  <span className="font-mono truncate ml-2">{parseFloat(selectedIntersection.longitude).toFixed(5)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center w-full py-2">
                {isKo ? "지도에서 마커를 클릭하세요." : "Click a marker on the map."}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedId && (
          <>
            {/* 2. 차종 분포 카드 */}
            <Card className={`min-h-[220px] w-full shrink-0 flex flex-col overflow-hidden py-2 ${hudCardStyle}`}>
              <CardHeader className="py-2 px-4 min-h-0 shrink-0 border-b border-slate-700/50">
                <CardTitle className="text-slate-100 flex items-center gap-2 text-sm font-semibold">
                  <Car className="w-4 h-4 text-cyan-400" />
                  {isKo ? '차종 분포' : 'Vehicle Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                  <VehicleTypeChart trafficData={filteredTrafficData} compact={true} />
              </CardContent>
            </Card>

            {/* 3. 개선 후 (After) 방향별 교통량 카드 */}
            <Card className={`flex-1 min-h-[250px] w-full shrink-0 flex flex-col overflow-hidden py-2 ${hudCardStyle}`}>
              <CardHeader className="py-2 px-4 min-h-0 shrink-0 border-b border-slate-700/50">
                <CardTitle className="text-slate-100 flex items-center gap-2 text-sm font-semibold">
                  <Activity className="w-4 h-4 text-violet-400" />
                  {isKo ? '개선 후 (After) 방향별 교통량' : 'Directional Traffic (After)'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 flex-1 min-h-0 flex flex-col relative">
                {/* HUD 전용 모드이므로 compact={true}를 주어 중복 제목 발생을 차단 */}
                <TrafficVolumeDisplay trafficData={optionTrafficData} compact={true} />
              </CardContent>
            </Card>

            <div className="h-5 shrink-0"></div>
          </>
        )}
      </div>

    </div>
  );
}