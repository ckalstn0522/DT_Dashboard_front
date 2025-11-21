import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Image as ImageIcon, BarChart2, Database, Filter, Target } from 'lucide-react';

import IntersectionMap from "../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../components/dashboard/VehicleTypeChart";
import TrafficVolumeDisplay from "../components/dashboard/TrafficVolumeDisplay";
import GEHAnalysis from "../components/dashboard/GEHAnalysis";
import TimePeriodSelector from "../components/dashboard/TimePeriodSelector";
import DateSelector from "../components/dashboard/DateSelector";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function Dashboard() {
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [timePeriod, setTimePeriod] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

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

  const { availableDates, availableTimePeriods } = useMemo(() => {
    if (!selectedIntersection) {
      return { availableDates: [], availableTimePeriods: [] };
    }
    const intersectionData = allTrafficData.filter(
      data => String(data.intersection_id) === String(selectedIntersection.intersection_id)
    );
    const dates = [...new Set(intersectionData.map(d => d.date).filter(Boolean))].sort();
    const times = [...new Set(intersectionData.map(d => d.time_period).filter(Boolean))].sort();
    return { availableDates: dates, availableTimePeriods: times };
  }, [selectedIntersection, allTrafficData]);

  useEffect(() => {
    if (selectedIntersection) {
      setTimePeriod('all');
      setSelectedDate('all');
    }
  }, [selectedIntersection?.intersection_id]);

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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            교차로 교통량 분석
          </h1>
          <p className="text-slate-600 dark:text-dashdark-muted mt-1">연구 범위 내 교차로 데이터 시각화</p>
        </div>
        
        {/* 필터 카드 */}
        <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-md relative z-20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <DateSelector 
                value={selectedDate} 
                onChange={setSelectedDate}
                availableDates={availableDates}
                disabled={!selectedIntersection}
              />
              <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 hidden md:block" />
              <TimePeriodSelector 
                value={timePeriod} 
                onChange={setTimePeriod}
                availableTimePeriods={availableTimePeriods}
                disabled={!selectedIntersection}
              />
            </div>
            {selectedIntersection && (
              <div className="mt-3 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800/50">
                <div className="text-xs text-violet-700 dark:text-violet-300">
                  💡 <strong>{selectedIntersection.intersection_name}</strong>에서 사용 가능: 
                  <strong> {availableDates.length}일</strong>, 
                  <strong> {availableTimePeriods.length}개 시간대</strong>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 기존 Alert 패널 제거됨 */}

      {/* 메인 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-0">
        
        {/* 1. Map Section + Stats Info */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-slate-50 dark:bg-dashdark-sidebar border-b border-slate-100 dark:border-dashdark-border shrink-0">
              <CardTitle className="text-slate-900 dark:text-white">연구 범위 맵</CardTitle>
            </CardHeader>
            
            {/* ▼▼▼ [수정] 카드 내부 레이아웃: 지도와 통계 정보를 세로로 배치 ▼▼▼ */}
            <CardContent className="p-0 flex flex-col flex-1">
              
              {/* 지도 영역 (높이 조정) */}
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

              {/* ▼▼▼ [추가] 하단 통계 정보 (요청하신 빨간 네모 영역) ▼▼▼ */}
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
              {/* ▲▲▲ [추가 완료] ▲▲▲ */}

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