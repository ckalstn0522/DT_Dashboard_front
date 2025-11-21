import React from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Activity, Car, AlertTriangle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function TopKPIBar() {
  // 1. 교차로 데이터 (운영 교차로 수)
  const { data: intersections, isLoading: loadingIntersections } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  // 2. 시뮬레이션 통계 (속도, 교통량 등)
  const { data: comparisons, isLoading: loadingStats } = useQuery({
    queryKey: ['simulationcomparison'],
    queryFn: () => axios.get(`${API_URL}/simulationcomparison`).then(res => res.data),
    initialData: [],
  });

  // 현재 운영 상태(Base 시나리오) 기준
  const baseStats = comparisons.find(c => c.scenario_name === 'Base') || {};

  const kpiItems = [
    {
      label: "운영 중인 교차로",
      value: intersections.length ? `${intersections.length}개소` : "-",
      icon: MapPin,
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      desc: "실시간 신호 제어"
    },
    {
      label: "평균 통행 속도",
      value: baseStats.avg_speed ? `${baseStats.avg_speed.toFixed(1)} km/h` : "-",
      icon: Activity,
      color: "text-green-500 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-500/10",
      desc: "전체 구간 평균"
    },
    {
      label: "실시간 혼잡 구간",
      // 데이터가 없으므로 평균 지체시간이 높으면 경고하는 로직으로 대체
      value: (baseStats.avg_delay > 40) ? "주의" : "정상", 
      icon: AlertTriangle,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      desc: "지체시간 기준"
    },
    {
      label: "금일 누적 교통량",
      value: baseStats.total_volume ? `${baseStats.total_volume.toLocaleString()}대` : "-",
      icon: Car,
      color: "text-violet-500 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      desc: "00:00 ~ 현재"
    }
  ];

  if (loadingIntersections || loadingStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/50 dark:bg-dashdark-card/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {kpiItems.map((item, idx) => (
        <Card key={idx} className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-dashdark-muted mb-1">
                {item.label}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {item.value}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {item.desc}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}