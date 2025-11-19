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
const API_URL = 'https://dt-dashboard-back.onrender.com/api';//'http://localhost:3001';

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
    setSelectedId(intersection.intersection_id);
    const message = `CLICKED:${intersection.intersection_id}`;
    document.title = message;
    console.log("Signal to Unity:", message);
    setTimeout(() => { document.title = "HUD"; }, 200);
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
        <Card className="flex-1 w-full bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden">
          <CardContent className="p-0 h-full relative">
            <div className="h-full w-full absolute inset-0">
              <IntersectionMap
                intersections={intersections}
                onSelectIntersection={handleMarkerClick}
                selectedIntersectionId={selectedId}
                // ▼▼▼ [수정됨] 줌 레벨을 14로 낮췄습니다 (멀리 보기) ▼▼▼
                initialZoom={14}
                // ▲▲▲ [수정됨] ▲▲▲
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- [중앙 패널] 빈 공간 (너비 50%) --- */}
      <div className="w-[50%] h-full pointer-events-none bg-transparent" />

      {/* --- [오른쪽 패널] 차트 (너비 25%) --- */}
      <div className="w-[25%] h-full p-3 pointer-events-auto overflow-y-auto custom-scrollbar space-y-3">
        
        {/* 1. 정보 카드 (Compact 스타일 적용) */}
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          {/* 패딩을 pb-2로 줄임 */}
          <CardHeader className="pb-2 pt-4 px-4"> 
            <CardTitle className="text-slate-100 flex items-center gap-2 text-base font-semibold">
              <Building2 className="w-4 h-4 text-cyan-400" />
              {selectedIntersection ? selectedIntersection.intersection_name : "교차로 선택"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {selectedIntersection ? (
              // 글자 크기를 text-xs(아주 작음) ~ sm으로 조정하여 짤림 방지
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

        {/* 2. 차트 영역 (Compact 스타일 적용) */}
        {selectedId && (
          <>
            {/* 차종 분포 */}
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-slate-700/30">
                <CardTitle className="text-slate-100 text-sm font-medium">차종 분포</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {/* min-w-0과 h-[200px]로 크기 강제 제한 */}
                <div className="w-full h-[200px] min-w-0">
                  <VehicleTypeChart trafficData={filteredTrafficData} />
                </div>
              </CardContent>
            </Card>
            
            {/* GEH 분석 */}
            <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-slate-700/30">
                <CardTitle className="text-slate-100 text-sm font-medium">GEH 분석</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="w-full h-[200px] min-w-0">
                  <GEHAnalysis trafficData={filteredTrafficData} />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

    </div>
  );
}