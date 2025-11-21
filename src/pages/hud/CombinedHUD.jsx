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

const hudCardStyle = "bg-slate-950/90 backdrop-blur-md border-slate-800/80 shadow-2xl overflow-hidden rounded-2xl";

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
    <div className="flex w-full h-screen overflow-hidden p-4 gap-4" style={{ backgroundColor: 'transparent' }}>
      
      {/* [왼쪽 패널] 지도 + 정보 */}
      <div className="w-[25%] h-full pointer-events-auto flex flex-col gap-4">
        <Card className={`h-[70%] w-full ${hudCardStyle}`}>
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

        <Card className={`flex-1 shrink-0 flex flex-col justify-center ${hudCardStyle}`}>
          <CardHeader className="py-3 px-5 min-h-0 shrink-0 border-b border-slate-800/50"> 
            <CardTitle className="text-slate-100 flex items-center gap-2 text-base font-bold">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span className="truncate leading-tight">
                {selectedIntersection ? selectedIntersection.intersection_name : "교차로 선택"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-3 flex-1 min-h-0 overflow-auto flex flex-col justify-center">
            {selectedIntersection ? (
              <div className="text-xs text-slate-300 space-y-2 font-medium">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-1.5">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono font-extrabold text-cyan-300 text-sm">{selectedIntersection.intersection_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">위도</span>
                  <span className="font-mono tracking-tight">{parseFloat(selectedIntersection.latitude).toFixed(5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">경도</span>
                  <span className="font-mono tracking-tight">{parseFloat(selectedIntersection.longitude).toFixed(5)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center flex h-full items-center justify-center animate-pulse">
                지도에서 마커를 클릭하세요
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* [중앙 패널] 투명 공간 */}
      <div className="flex-1 h-full pointer-events-none" style={{ backgroundColor: 'transparent' }} />

      {/* [오른쪽 패널] 차트 영역 */}
      {/* ▼▼▼ [수정] h-full 및 flex-1 적용하여 전체 높이 사용하도록 변경 ▼▼▼ */}
      <div 
        className="w-[25%] h-full pointer-events-auto flex flex-col gap-4 overflow-hidden"
      >
        {selectedId ? (
          <>
            {/* 1. 차종 분포: flex-1을 주어 남은 공간을 모두 차지하게 함 */}
            <Card className={`flex-1 w-full shrink-0 ${hudCardStyle} flex flex-col`}>
              <CardHeader className="py-3 px-5 border-b border-slate-800/50 shrink-0">
                <CardTitle className="text-slate-100 text-base font-bold">차종 분포</CardTitle>
              </CardHeader>
              {/* 내부 콘텐츠도 높이를 꽉 채우도록 설정 */}
              <CardContent className="p-0 flex-1 h-full min-h-0">
                  <VehicleTypeChart trafficData={filteredTrafficData} compact={true} />
              </CardContent>
            </Card>
            
            {/* 2. GEH 분석: 고정 높이 유지 (필요 시 비율 조정 가능) */}
            <Card className={`h-[45%] shrink-0 ${hudCardStyle} flex flex-col`}>
               <CardContent className="p-0 flex-1 h-full min-h-0">
                  <GEHAnalysis trafficData={filteredTrafficData} compact={true} />
               </CardContent>
            </Card>
          </>
        ) : (
          // 선택된 교차로가 없을 때 표시할 빈 카드 (공간 차지용)
          <Card className={`h-full w-full ${hudCardStyle} flex items-center justify-center`}>
            <div className="text-slate-500 text-sm animate-pulse">
              교차로를 선택하면 분석 결과가 표시됩니다.
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}