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

  // 1. 데이터 로딩 (한 번에 다 가져옴)
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

  // 2. 교차로 클릭 핸들러
  const handleMarkerClick = (intersection) => {
    // A. 내부 상태 업데이트 (오른쪽 차트 즉시 갱신)
    setSelectedId(intersection.intersection_id);

    // B. Unity로 카메라 전환 신호 전송 (Title Hack)
    const message = `CLICKED:${intersection.intersection_id}`;
    document.title = message;
    console.log("Signal to Unity:", message);

    // Title 리셋
    setTimeout(() => { document.title = "HUD"; }, 200);
  };

  // 3. 데이터 필터링
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
    <div className="hud-container">
      
      {/* --- [왼쪽 대시보드] 맵 --- */}
      <div className="left-dashboard">
        <Card className="w-full h-full bg-slate-900/70 backdrop-blur-xl border-slate-700/50 shadow-2xl overflow-hidden">
          <CardContent className="p-0 h-full">
            <div className="h-full">
              <IntersectionMap
                intersections={intersections}
                onSelectIntersection={handleMarkerClick}
                selectedIntersectionId={selectedId}
                initialZoom={15}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- [중앙 투명 영역] Unity 화면이 보임 --- */}
      <div className="center-transparent" />

      {/* --- [오른쪽 대시보드] 차트 --- */}
      <div className="right-dashboard">
        <div className="space-y-4">
          {/* 정보 카드 */}
          <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-700/50 shadow-2xl transition-all hover:bg-slate-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 flex items-center gap-2 text-lg font-medium">
                <Building2 className="w-5 h-5 text-cyan-400" />
                {selectedIntersection ? selectedIntersection.intersection_name : "교차로 선택"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedIntersection ? (
                <div className="text-sm text-slate-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">ID:</span>
                    <span className="font-mono">{selectedIntersection.intersection_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">위도:</span>
                    <span className="font-mono">{parseFloat(selectedIntersection.latitude).toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">경도:</span>
                    <span className="font-mono">{parseFloat(selectedIntersection.longitude).toFixed(4)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400 py-2">지도에서 마커를 클릭하세요.</div>
              )}
            </CardContent>
          </Card>

          {/* 차트들 (선택 시 표시) */}
          {selectedId && (
            <>
              <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-700/50 shadow-2xl transition-all hover:bg-slate-900/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-100 text-base font-medium">차종 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <VehicleTypeChart trafficData={filteredTrafficData} />
                </CardContent>
              </Card>
              
              <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-700/50 shadow-2xl transition-all hover:bg-slate-900/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-100 text-base font-medium">GEH 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <GEHAnalysis trafficData={filteredTrafficData} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

    </div>
  );
}