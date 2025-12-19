import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Database, Filter, Target, LayoutDashboard, Car, Clock } from 'lucide-react';
import { useFilter } from "@/context/FilterContext";
import { useLanguage } from "@/context/LanguageContext";

// Components
import IntersectionMap from "../components/dashboard/IntersectionMap";
import TrafficVolumeDisplay from "../components/dashboard/TrafficVolumeDisplay";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function Dashboard() {
  const { t } = useLanguage();
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  
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

  // [수정됨] Option 시나리오 가상 데이터 생성 (교통량 차이를 최대 3배까지 랜덤 적용)
  const optionTrafficData = useMemo(() => {
    return filteredTrafficData.map(data => {
      // 1.0배 ~ 3.0배 사이의 랜덤 승수 생성
      const multiplier = 1.0 + Math.random() * 2.0; 
      
      return {
        ...data,
        소계_대: Math.floor((data.소계_대 || 0) * multiplier)
      };
    });
  }, [filteredTrafficData]);

  // 통합 통계 계산 함수 (4방향 단순 산술평균)
  const calculateIntersectionStats = (data) => {
    if (!data || data.length === 0) return { volume: 0, delay: 0, los: 'A' };

    // 1. 방향별 교통량 집계 (N, S, E, W)
    const dirs = { N: 0, S: 0, E: 0, W: 0 };
    let totalVol = 0;

    data.forEach(d => {
      const dirCode = d.direction_eng || ''; 
      const origin = dirCode.charAt(0); // 'N', 'S', 'E', 'W'
      const vol = d.소계_대 || 0;
      if (dirs[origin] !== undefined) {
        dirs[origin] += vol;
        totalVol += vol;
      }
    });

    if (totalVol === 0) return { volume: 0, delay: 0, los: 'A' };

    // 2. 방향별 지체시간 계산 후 4로 나누어 산술평균
    let sumDelay = 0;
    
    // 4개 방향에 대해 각각 지체시간(vol / 35)을 구해서 합산
    Object.values(dirs).forEach(vol => {
       const dirDelay = vol > 0 ? vol / 35 : 0; 
       sumDelay += dirDelay;
    });

    // 평균 지체시간 = (북쪽지체 + 남쪽지체 + 동쪽지체 + 서쪽지체) / 4
    const avgDelay = (sumDelay / 4).toFixed(1);
    
    // LOS 산정
    let los = 'A';
    if (avgDelay > 80) los = 'F';
    else if (avgDelay > 60) los = 'E';
    else if (avgDelay > 40) los = 'D';
    else if (avgDelay > 25) los = 'C';
    else if (avgDelay > 15) los = 'B';

    return { volume: totalVol, delay: avgDelay, los };
  };

  const baseStats = calculateIntersectionStats(filteredTrafficData);
  const optionStats = calculateIntersectionStats(optionTrafficData);

  // KPI Items
  const kpiItems = [
    { label: t('kpiTotalInt'), value: intersections.length, icon: BarChart2, color: 'text-slate-900 dark:text-white' },
    { label: t('kpiSelectedId'), value: selectedIntersection ? selectedIntersection.intersection_id : '-', icon: Target, color: 'text-amber-500' },
    { label: t('kpiDataTemp'), value: allTrafficData.length, icon: Database, color: 'text-slate-900 dark:text-white' },
    { label: t('kpiFilterTemp'), value: filteredTrafficData.length, icon: Filter, color: 'text-emerald-500' },
  ];

  return (
    <div className="max-w-[1800px] mx-auto space-y-4 h-[calc(100vh-4rem)] flex flex-col p-2">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-end md:items-center shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-violet-500" />
            {t('dashTitle')}
          </h1>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Left: Map */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col h-full overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-dashdark-sidebar border-b border-slate-100 dark:border-dashdark-border py-3 px-4 shrink-0">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">{t('mapTitle')}</CardTitle>
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

        {/* Right: Analytics */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0 overflow-y-auto">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {kpiItems.map((item, idx) => (
               <div key={idx} className="p-3 bg-white dark:bg-dashdark-card rounded-lg border border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-dashdark-muted">
                    <item.icon className="w-3 h-3" /> {item.label}
                  </div>
                  <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
               </div>
            ))}
          </div>

          {/* Base vs Option Split View */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
            {/* Base Column */}
            <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white border-l-4 border-slate-500 pl-2">{t('base')}</h3>
                </div>
                <div className="flex-1 h-full">
                    <TrafficVolumeDisplay trafficData={filteredTrafficData} />
                </div>
            </div>

            {/* Option Column */}
            <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 border-l-4 border-violet-500 pl-2">{t('option')}</h3>
                </div>
                <div className="flex-1 h-full">
                    <TrafficVolumeDisplay trafficData={optionTrafficData} />
                </div>
            </div>
          </div>

          {/* Bottom Summary (Total Vol, Delay, LOS) */}
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm shrink-0">
             <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Summary */}
                <div className="flex items-center justify-around p-3 bg-slate-50 dark:bg-dashdark-sidebar rounded-lg border border-slate-100 dark:border-dashdark-border">
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">{t('volume')}</div>
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1 justify-center">
                            <Car className="w-3 h-3"/> {baseStats.volume.toLocaleString()}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-dashdark-border"></div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">{t('delay')}</div>
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3"/> {baseStats.delay}s
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-dashdark-border"></div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">{t('los')}</div>
                        <div className={`font-bold text-xl px-2 py-0.5 rounded ${
                            baseStats.los === 'A' || baseStats.los === 'B' ? 'bg-green-100 text-green-700' :
                            baseStats.los === 'C' || baseStats.los === 'D' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {baseStats.los} <span className="text-xs font-normal">{t('grade')}</span>
                        </div>
                    </div>
                </div>

                {/* Option Summary */}
                <div className="flex items-center justify-around p-3 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-800">
                    <div className="text-center">
                        <div className="text-xs text-violet-500 mb-1">{t('volume')}</div>
                        <div className="font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1 justify-center">
                            <Car className="w-3 h-3"/> {optionStats.volume.toLocaleString()}
                        </div>
                    </div>
                    <div className="w-px h-8 bg-violet-200 dark:bg-violet-800"></div>
                    <div className="text-center">
                        <div className="text-xs text-violet-500 mb-1">{t('delay')}</div>
                        <div className="font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1 justify-center">
                            <Clock className="w-3 h-3"/> {optionStats.delay}s
                        </div>
                    </div>
                    <div className="w-px h-8 bg-violet-200 dark:bg-violet-800"></div>
                    <div className="text-center">
                        <div className="text-xs text-violet-500 mb-1">{t('los')}</div>
                        <div className={`font-bold text-xl px-2 py-0.5 rounded ${
                            optionStats.los === 'A' || optionStats.los === 'B' ? 'bg-green-100 text-green-700' :
                            optionStats.los === 'C' || optionStats.los === 'D' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {optionStats.los} <span className="text-xs font-normal">{t('grade')}</span>
                        </div>
                    </div>
                </div>
             </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}