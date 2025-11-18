import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, BarChart3 } from 'lucide-react';

// 기존 차트 컴포넌트 재사용 (경로 확인 필수)
import VehicleTypeChart from "../../components/dashboard/VehicleTypeChart";
import GEHAnalysis from "../../components/dashboard/GEHAnalysis";

// API 서버 주소
const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function RightCharts() {
  // Unity가 선택해준 교차로 ID
  const [selectedId, setSelectedId] = useState(null);

  // 데이터 미리 로딩
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

  // [핵심] Unity가 호출할 수 있는 전역 함수 등록
  useEffect(() => {
    window.updateCharts = (id) => {
      console.log(`Unity requested chart update for ID: ${id}`);
      setSelectedId(id); // ID 변경 -> 차트 리렌더링
    };

    return () => {
      delete window.updateCharts;
    };
  }, []);

  // 선택된 ID에 맞는 데이터 필터링
  const filteredTrafficData = useMemo(() => {
    if (!selectedId) return [];
    return allTrafficData.filter(data => 
      String(data.intersection_id) === String(selectedId)
    );
  }, [selectedId, allTrafficData]);

  const selectedIntersection = useMemo(() => {
    if (!selectedId) return null;
    return intersections.find(i => 
      String(i.intersection_id) === String(selectedId)
    );
  }, [selectedId, intersections]);

  if (isLoadingIntersections || isLoadingTraffic) {
    return <Skeleton className="w-full h-screen bg-white/50" />;
  }

  return (
    // 배경 투명 (Unity 씬이 뒤에 보이도록)
    <div className="w-full h-screen bg-transparent p-4 space-y-4 overflow-y-auto">
      
      {/* 1. 선택된 교차로 정보 */}
      <Card className="bg-white/90 backdrop-blur-sm border-cyan-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-900 flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-cyan-600" />
            {selectedIntersection ? selectedIntersection.intersection_name : "교차로 미선택"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedIntersection ? (
            <div className="text-sm text-slate-600">
              ID: {selectedIntersection.intersection_id} / 
              위도: {parseFloat(selectedIntersection.latitude).toFixed(4)}, 
              경도: {parseFloat(selectedIntersection.longitude).toFixed(4)}
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              왼쪽 지도에서 교차로를 클릭하세요.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. 차종 분포 차트 (데이터가 있을 때만 표시) */}
      {selectedId && (
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 text-base">차종 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleTypeChart trafficData={filteredTrafficData} />
          </CardContent>
        </Card>
      )}

      {/* 3. GEH 분석 차트 (데이터가 있을 때만 표시) */}
      {selectedId && (
        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 text-base">GEH 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <GEHAnalysis trafficData={filteredTrafficData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}