import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Database, Filter, Target, LayoutDashboard, Navigation, Maximize2, X } from 'lucide-react';

import IntersectionMap from "../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../components/dashboard/VehicleTypeChart";
import TrafficVolumeDisplay from "../components/dashboard/TrafficVolumeDisplay";
import GEHAnalysis from "../components/dashboard/GEHAnalysis";
import { useFilter } from "@/context/FilterContext";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function Dashboard() {
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [isTrafficVolumeOpen, setIsTrafficVolumeOpen] = useState(false);
  
  const { 
    selectedDate, timePeriod, 
    setAvailableDates, setAvailableTimePeriods, setIsSelectionEnabled,
    setSelectedDate, setTimePeriod 
  } = useFilter();

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
    
    setSelectedDate('all');
    setTimePeriod('all');

  }, [selectedIntersection, allTrafficData, setAvailableDates, setAvailableTimePeriods, setIsSelectionEnabled, setSelectedDate, setTimePeriod]);

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
    <div className="max-w-[1800px] mx-auto space-y-3 h-[calc(100vh-4rem)] flex flex-col p-2">
      
      {/* [모달] 방향별 교통량 상세 보기 */}
      {isTrafficVolumeOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          {/* 모달 컨테이너: 최대 너비/높이 제한 */}
          <div className="bg-white dark:bg-dashdark-bg w-full h-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-dashdark-border relative">
            
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-dashdark-border bg-slate-50 dark:bg-dashdark-sidebar shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg">
                  <Navigation className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">방향별 교통량 상세 분석</h2>
                  <p className="text-sm text-slate-500 dark:text-dashdark-muted">
                    {selectedIntersection ? selectedIntersection.intersection_name : "전체"} 교통 흐름 시각화
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsTrafficVolumeOpen(false)} className="rounded-full hover:bg-slate-200 dark:hover:bg-dashdark-hover">
                <X className="w-6 h-6 text-slate-500 dark:text-white" />
              </Button>
            </div>
            
            {/* 모달 콘텐츠: 오직 TrafficVolumeDisplay만 렌더링 (지도 없음!) */}
            <div className="flex-1 p-0 bg-slate-100 dark:bg-dashdark-bg/50 relative overflow-hidden">
               <TrafficVolumeDisplay 
                 trafficData={filteredTrafficData}
                 // ▼▼▼ [핵심] 모달에서는 배경 지도 이미지도 안 보이게 null 처리 ▼▼▼
                 intersectionImage={null} 
                 // ▲▲▲ [핵심] ▲▲▲
               />
            </div>
          </div>
        </div>
      )}

      {/* Header & Top Bar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-end md:items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-violet-500" />
            교통 데이터 대시보드
          </h1>
        </div>

        {/* 상단바: 방향별 교통량 바로가기 */}
        <Card className="flex items-center gap-4 p-2 px-4 bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsTrafficVolumeOpen(true)}>
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-violet-100 dark:bg-violet-900/20 rounded-md">
               <Navigation className="w-4 h-4 text-violet-600 dark:text-violet-400" />
             </div>
             <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-900 dark:text-white">방향별 교통량</span>
               <span className="text-[10px] text-slate-500 dark:text-dashdark-muted">클릭하여 상세 보기</span>
             </div>
          </div>
          <Maximize2 className="w-4 h-4 text-slate-400 dark:text-slate-600" />
        </Card>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        
        {/* [Left Column] 연구 범위 맵 */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col h-full overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-dashdark-sidebar border-b border-slate-100 dark:border-dashdark-border py-3 px-4 shrink-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">연구 범위 맵</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-0">
              {isLoadingIntersections ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <div className="w-full h-full">
                  <IntersectionMap
                    intersections={intersections}
                    onSelectIntersection={setSelectedIntersection}
                    selectedIntersectionId={selectedIntersection?.intersection_id}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* [Right Column] 통계 및 차트 */}
        <div className="lg:col-span-8 flex flex-col gap-3 h-full min-h-0">
          
          {/* 1. 데이터 요약 */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            <div className="p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-dashdark-muted">
                <BarChart2 className="w-3 h-3" /> 총 교차로
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{intersections.length}</span>
            </div>
            <div className="p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-dashdark-muted">
                <Database className="w-3 h-3" /> 데이터
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{allTrafficData.length}</span>
            </div>
            <div className="p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-dashdark-muted">
                <Filter className="w-3 h-3" /> 필터링
              </div>
              <span className="text-lg font-bold text-emerald-500">{filteredTrafficData.length}</span>
            </div>
            <div className="p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-dashdark-muted">
                <Target className="w-3 h-3" /> 선택 ID
              </div>
              <span className="text-lg font-bold text-amber-500">{selectedIntersection ? selectedIntersection.intersection_id : '-'}</span>
            </div>
          </div>

          {/* 2. 차종 분포 */}
          <div className="flex-[2] min-h-0">
             <VehicleTypeChart trafficData={filteredTrafficData} />
          </div>

          {/* 3. GEH 분석 & R^2 */}
          <div className="flex-1 min-h-[240px]">
             <GEHAnalysis trafficData={filteredTrafficData} />
          </div>

        </div>

      </div>
    </div>
  );
}