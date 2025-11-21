import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Database, Filter, Target } from 'lucide-react';

import IntersectionMap from "../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../components/dashboard/VehicleTypeChart";
import TrafficVolumeDisplay from "../components/dashboard/TrafficVolumeDisplay";
import GEHAnalysis from "../components/dashboard/GEHAnalysis";
// DateSelector, TimePeriodSelector 임포트 제거 (Layout으로 이동됨)
// ▼▼▼ [추가] useFilter 임포트 ▼▼▼
import { useFilter } from "@/context/FilterContext";
// ▲▲▲ [추가] ▲▲▲

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function Dashboard() {
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  
  // ▼▼▼ [수정] Context에서 필터 상태 및 세터 가져오기 ▼▼▼
  const { 
    selectedDate, timePeriod, 
    setAvailableDates, setAvailableTimePeriods, setIsSelectionEnabled,
    setSelectedDate, setTimePeriod 
  } = useFilter();
  // ▲▲▲ [수정] ▲▲▲

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

  // ▼▼▼ [수정] 데이터 로드 시 사이드바 필터 옵션 업데이트 로직 ▼▼▼
  useEffect(() => {
    if (!selectedIntersection) {
      setAvailableDates([]);
      setAvailableTimePeriods([]);
      setIsSelectionEnabled(false);
      return;
    }

    const intersectionData = allTrafficData.filter(
      data => String(data.intersection_id) === String(selectedIntersection.intersection_id)
    );
    
    const dates = [...new Set(intersectionData.map(d => d.date).filter(Boolean))].sort();
    const times = [...new Set(intersectionData.map(d => d.time_period).filter(Boolean))].sort();

    setAvailableDates(dates);
    setAvailableTimePeriods(times);
    setIsSelectionEnabled(true);
    
    // 교차로 변경 시 필터 초기화
    setSelectedDate('all');
    setTimePeriod('all');

  }, [selectedIntersection, allTrafficData, setAvailableDates, setAvailableTimePeriods, setIsSelectionEnabled, setSelectedDate, setTimePeriod]);
  // ▲▲▲ [수정] ▲▲▲

  const filteredTrafficData = useMemo(() => {
    if (!selectedIntersection) return [];
    return allTrafficData.filter(data => {
      const matchesIntersection = String(data.intersection_id) === String(selectedIntersection.intersection_id);
      const matchesTime = timePeriod === 'all' || data.time_period === timePeriod;
      const matchesDate = selectedDate === 'all' || data.date === selectedDate;
      return matchesIntersection && matchesTime && matchesDate;
    });
  }, [selectedIntersection, allTrafficData, timePeriod, selectedDate]);

  return (
    <div className="max-w-[1800px] mx-auto space-y-6">
      {/* Header: 필터 카드가 제거되어 제목만 남음 */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            교차로 교통량 분석
          </h1>
          <p className="text-slate-600 dark:text-dashdark-muted mt-1">연구 범위 내 교차로 데이터 시각화</p>
        </div>
        {/* 기존 필터 카드 제거됨 (사이드바 이동) */}
      </div>

      {/* 메인 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-0">
        
        {/* 1. Map Section + Stats Info */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-dashdark-sidebar border-b border-slate-100 dark:border-dashdark-border shrink-0">
              <CardTitle className="text-slate-900 dark:text-white">연구 범위 맵</CardTitle>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col flex-1">
              {/* 지도 영역 */}
              <div className="relative h-[550px] w-full shrink-0">
                {isLoadingIntersections ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-dashdark-bg">
                    <div className="text-slate-400">지도 데이터를 불러오는 중...</div>
                  </div>
                ) : (
                  <IntersectionMap
                    intersections={intersections}
                    onSelectIntersection={setSelectedIntersection}
                    selectedIntersectionId={selectedIntersection?.intersection_id}
                  />
                )}
              </div>

              {/* 하단 통계 정보 */}
              <div className="flex-1 p-5 bg-slate-50 dark:bg-dashdark-sidebar/50 border-t border-slate-200 dark:border-dashdark-border">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">데이터 요약</h4>
                <div className="space-y-3">
                  
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                        <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-dashdark-muted">총 교차로</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {intersections.length}개
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-md">
                        <Database className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-dashdark-muted">총 교통 데이터</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {allTrafficData.length}개
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                        <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-dashdark-muted">필터링된 데이터</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {filteredTrafficData.length}개
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                        <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 dark:text-dashdark-muted">선택된 교차로 ID</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedIntersection ? selectedIntersection.intersection_id : '-'}
                    </span>
                  </div>

                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* 2. Charts Section */}
        <div className="xl:col-span-2 space-y-6">
          <VehicleTypeChart trafficData={filteredTrafficData} />
          <GEHAnalysis trafficData={filteredTrafficData} />
        </div>

      </div>

      {/* 3. Traffic Volume */}
      <TrafficVolumeDisplay 
        trafficData={filteredTrafficData}
        intersectionImage={selectedIntersection?.intersection_image}
      />
    </div>
  );
}