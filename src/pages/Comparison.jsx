import React from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GitCompare, TrendingDown, TrendingUp, Activity, Clock } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function Comparison() {
  const { data: comparisons, isLoading } = useQuery({
    queryKey: ['simulationcomparison'],
    queryFn: () => axios.get(`${API_URL}/simulationcomparison`).then(res => res.data),
    initialData: [],
  });

  const baseData = comparisons.find(c => c.scenario_name === 'Base') || {};
  const optionData = comparisons.find(c => c.scenario_name === 'Option') || {};

  const metrics = [
    { key: 'total_volume', label: '총 교통량', unit: '대', icon: Activity },
    { key: 'unserved_vehicles', label: '미진입 차량', unit: '대', icon: TrendingDown },
    { key: 'avg_speed', label: '평균 속도', unit: 'km/h', icon: TrendingUp },
    { key: 'avg_delay', label: '평균 지체시간', unit: '초', icon: Clock },
    { key: 'avg_travel_time', label: '평균 통행시간', unit: '초', icon: Clock },
    { key: 'total_distance', label: '총 주행거리', unit: 'km', icon: Activity },
  ];

  const comparisonData = metrics.map(metric => ({
    metric: metric.label,
    Base: baseData[metric.key] || 0,
    Option: optionData[metric.key] || 0,
    improvement: baseData[metric.key] 
      ? (((baseData[metric.key] - optionData[metric.key]) / baseData[metric.key]) * 100).toFixed(1)
      : 0
  }));

  const radarData = [
    { subject: '교통량', Base: 80, Option: 85 },
    { subject: '속도', Base: 70, Option: 82 },
    { subject: '지체시간', Base: 60, Option: 75 },
    { subject: '효율성', Base: 65, Option: 88 },
    { subject: '안정성', Base: 75, Option: 90 },
  ];

  const calculateDifference = (base, option) => {
    if (!base) return 0;
    return ((option - base) / base * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 bg-slate-200 dark:bg-dashdark-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full bg-slate-200 dark:bg-dashdark-card" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full bg-slate-200 dark:bg-dashdark-card" />
          <Skeleton className="h-96 w-full bg-slate-200 dark:bg-dashdark-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          시뮬레이션 비교 분석
        </h1>
        <p className="text-slate-600 dark:text-dashdark-muted mt-1">Base 모델과 Option 모델의 성능 비교</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(metric => {
          const Icon = metric.icon;
          const baseValue = baseData[metric.key] || 0;
          const optionValue = optionData[metric.key] || 0;
          const diff = calculateDifference(baseValue, optionValue);
          const isImprovement = metric.key === 'unserved_vehicles' || metric.key === 'avg_delay' || metric.key === 'avg_travel_time'
            ? diff < 0
            : diff > 0;

          return (
            <Card key={metric.key} className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-dashdark-muted flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 dark:text-slate-500">Base</span>
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
                      {baseValue.toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 dark:text-slate-500">Option</span>
                    <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {optionValue.toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-dashdark-border ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                    {isImprovement ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-semibold">
                      {Math.abs(diff)}% {isImprovement ? '개선' : '감소'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              주요 지표 비교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A303F" vertical={false} />
                <XAxis dataKey="metric" angle={-45} textAnchor="end" height={100} interval={0} style={{ fontSize: '12px', fill: '#94A3B8' }} />
                <YAxis style={{ fontSize: '12px', fill: '#94A3B8' }} />
                <Tooltip cursor={{fill: '#252A38'}} contentStyle={{ backgroundColor: '#1E2330', borderColor: '#2A303F', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Base" fill="#64748B" name="Base 모델" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Option" fill="#8B5CF6" name="Option 모델" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ▼▼▼ [수정] 레이더 차트: fillOpacity를 낮춰 겹침 문제 해결 ▼▼▼ */}
        <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              종합 성능 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} outerRadius={150}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 14 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                {/* Base 모델: 회색, 투명도 0.3 */}
                <Radar 
                  name="Base 모델" 
                  dataKey="Base" 
                  stroke="#64748B" 
                  strokeWidth={3}
                  fill="#64748B" 
                  fillOpacity={0.3} 
                />
                {/* Option 모델: 보라색, 투명도 0.3 (이제 뒤에 있는 것도 보임) */}
                <Radar 
                  name="Option 모델" 
                  dataKey="Option" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  fill="#8B5CF6" 
                  fillOpacity={0.3} 
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1E2330', borderColor: '#2A303F', color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}