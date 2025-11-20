import React, { useState, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from 'lucide-react';

// 컴포넌트 불러오기
import IntersectionMap from "../../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../../components/dashboard/VehicleTypeChart";
import GEHAnalysis from "../../components/dashboard/GEHAnalysis";

// API 서버 주소
const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function CombinedHUD() {
  const [selectedId, setSelectedId] = useState(null);

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
    // 1. React 내부 상태 업데이트
    setSelectedId(intersection.intersection_id);

    // 2. Unity로 카메라 이동 신호 전송
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
    <div className="flex w-full h-screen bg-transparent overflow-hidden">
      
      {/* --- [왼쪽 패널] 맵 (너비 25%) --- */}
      <div className="w-[25%] h-full p-3 pointer-events-auto flex flex-col">
        {/* bg-slate-900/80: 검은색 배경에 80% 불투명도 (뒤가 살짝 비침)
           backdrop-blur-xl: 뒤에 있는 유니티 화면을 흐리게 처리 (유리 효과)
        */}
        <Card className="flex-1 w-full bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden">
          <CardContent className="p-0 h-full relative">
            <div className="h-full w-full absolute inset-0">
              <IntersectionMap
                intersections={intersections}
                onSelectIntersection={handleMarkerClick}
                selectedIntersectionId={selectedId}
                initialZoom={14} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- [중앙 패널] 빈 공간 (너비 50%) --- */}
      {/* pointer-events-none으로 설정하여 중앙 클릭 시 유니티 화면이 클릭되도록 함 */}
      <div className="w-[50%] h-full pointer-events-none bg-transparent" />

      {/* --- [오른쪽 패널] 차트 (너비 25%) --- */}
      {/* overflow-y-auto: 내용이 많으면 세로 스크롤 생성 
          max-h-screen: 화면 높이를 넘어가지 않도록 제한
      */}
      <div className="w-[25%] h-full max-h-screen p-3 pointer-events-auto flex flex-col gap-3 overflow-y-auto scrollbar-hide">
        
        {/* 1. 정보 카드 */}
        <Card className="shrink-0 bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="pb-2 pt-4 px-4"> 
            <CardTitle className="text-slate-100 flex items-center gap-2 text-base font-semibold">
              <Building2 className="w-4 h-4 text-cyan-400" />
              {selectedIntersection ? selectedIntersection.intersection_name : "교차로 선택"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {selectedIntersection ? (
              <div className="text-xs text-slate-300 space-y-1.5">
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
              <div className="text-xs text-slate-500 text-center py-2">지도에서 마커를 클릭하세요.</div>
            )}
          </CardContent>
        </Card>

        {/* 차트들 (선택 시 표시) */}
        {selectedId && (
          <>
            {/* 2. 차종 분포 */}
            {/* min-h-[300px]: 최소 높이를 300px로 강제하여 차트가 찌그러지지 않게 함 */}
            <Card className="shrink-0 min-h-[300px] bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
              <CardHeader className="py-3 px-4 border-b border-slate-700/30 shrink-0">
                <CardTitle className="text-slate-100 text-sm font-medium">차종 분포</CardTitle>
              </CardHeader>
              <CardContent className="p-2 flex-1 relative">
                <div className="absolute inset-0 p-2">
                    <VehicleTypeChart trafficData={filteredTrafficData} />
                </div>
              </CardContent>
            </Card>
            
            {/* 3. GEH 분석 */}
            {/* min-h-[300px]: 최소 높이 확보 */}
            <Card className="shrink-0 min-h-[300px] bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
              <CardHeader className="py-3 px-4 border-b border-slate-700/30 shrink-0">
                <CardTitle className="text-slate-100 text-sm font-medium">GEH 분석</CardTitle>
              </CardHeader>
              <CardContent className="p-2 flex-1 relative">
                 <div className="absolute inset-0 p-2">
                    <GEHAnalysis trafficData={filteredTrafficData} />
                 </div>
              </CardContent>
            </Card>
            
            {/* 스크롤 여유 공간 */}
            <div className="h-10 shrink-0" />
          </>
        )}
      </div>

    </div>
  );
}