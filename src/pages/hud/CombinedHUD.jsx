import React, { useState, useMemo, useEffect } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from 'lucide-react';

import IntersectionMap from "../../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../../components/dashboard/VehicleTypeChart";
import GEHAnalysis from "../../components/dashboard/GEHAnalysis";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

// HUD 카드 공통 스타일
const hudCardStyle = "bg-slate-950/90 backdrop-blur-md border-slate-800/80 shadow-2xl";

export default function CombinedHUD() {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      // document.documentElement.classList.remove('dark');
    };
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


  if (isLoadingIntersections || isLoadingTraffic) {
    return <Skeleton className="w-full h-screen bg-transparent" />;
  }

  return (
    <div className="flex w-full h-screen overflow-hidden" style={{ backgroundColor: 'transparent' }}>
      
      {/* [왼쪽 패널] 지도(85%) + 정보(15%) */}
      <div className="w-[25%] h-full p-3 pointer-events-auto flex flex-col gap-3">
        
        {/* 1. 상단: 지도 카드 (높이를 85%로 대폭 늘림) */}
        <Card className={`h-[85%] w-full overflow-hidden ${hudCardStyle}`}>
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

        {/* 2. 하단: 정보 카드 (나머지 공간 flex-1, 약 15%) - 컴팩트한 디자인 적용 */}
        <Card className={`flex-1 shrink-0 flex flex-col justify-center overflow-hidden ${hudCardStyle}`}>
          <CardHeader className="py-2 px-4 min-h-0 shrink-0"> 
            <CardTitle className="text-slate-100 flex items-center gap-2 text-sm font-semibold">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="truncate">
                {selectedIntersection ? selectedIntersection.intersection_name : "교차로 선택"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2 pt-0 flex-1 min-h-0 overflow-auto">
            {selectedIntersection ? (
              <div className="text-[11px] text-slate-300 space-y-1">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-1">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono font-bold text-cyan-200">{selectedIntersection.intersection_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">위도</span>
                  <span className="font-mono">{parseFloat(selectedIntersection.latitude).toFixed(5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">경도</span>
                  <span className="font-mono">{parseFloat(selectedIntersection.longitude).toFixed(5)}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center flex h-full items-center justify-center">
                지도에서 마커를 클릭하세요.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* [중앙 패널] 투명 공간 */}
      <div className="w-[50%] h-full pointer-events-none" style={{ backgroundColor: 'transparent' }} />

      {/* [오른쪽 패널] 차트 */}
      <div 
        className="w-[25%] h-full p-3 pointer-events-auto flex flex-col gap-3"
        style={{ 
          overflowY: 'auto',
          maxHeight: '100vh',
          scrollBehavior: 'smooth'
        }}
      >
        {selectedId && (
          <>
            {/* 1. 차종 분포 */}
            <Card className={`shrink-0 overflow-hidden ${hudCardStyle}`}>
              <CardHeader className="py-3 px-4 border-b border-slate-800/50">
                <CardTitle className="text-slate-100 text-sm font-medium">차종 분포</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[300px]">
                  <VehicleTypeChart trafficData={filteredTrafficData} compact={true} />
              </CardContent>
            </Card>
            
            {/* 2. GEH 분석 */}
            <Card className={`shrink-0 overflow-hidden ${hudCardStyle}`}>
               <CardContent className="p-0 h-[600px]">
                  <GEHAnalysis trafficData={filteredTrafficData} compact={true} />
               </CardContent>
            </Card>

            <div className="h-20 shrink-0"></div>
          </>
        )}
      </div>

    </div>
  );
}