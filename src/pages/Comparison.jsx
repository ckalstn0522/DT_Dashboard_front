import React from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GitCompare, TrendingDown, TrendingUp, Activity, Clock, Gauge, Car, Timer } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import IntersectionMap from "@/components/dashboard/IntersectionMap";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function Comparison() {
  const { t } = useLanguage();
  
  const { data: comparisons, isLoading: isComparisonsLoading } = useQuery({
    queryKey: ['simulationcomparison'],
    queryFn: () => axios.get(`${API_URL}/simulationcomparison`).then(res => res.data),
    initialData: [],
  });

  const { data: intersections, isLoading: isIntersectionsLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const isLoading = isComparisonsLoading || isIntersectionsLoading;

  const baseData = comparisons.find(c => c.scenario_name === 'Base') || {};
  const optionData = comparisons.find(c => c.scenario_name === 'Option') || {};

  const getMetricValue = (data, type) => {
    if (!data) return 0;
    const vol = data.total_volume || 0;
    const time = data.avg_travel_time || 0;
    const dist = data.total_distance || 0;
    const speed = data.avg_speed || 0;
    const delay = data.avg_delay || 0;

    switch (type) {
      case 'VHT': return (vol * time) / 3600; 
      case 'VKT': return dist;                
      case 'VCur': return speed;              
      case 'TCur': return time;               
      case 'Delay': return delay;             
      case 'Vol': return vol;                 
      default: return 0;
    }
  };

  // [수정됨] 지표 순서 및 아이콘/단위 설정
  // 순서: VHT, VKT, 교통량(도착차량수), 통행시간, 속도, 지체시간
  const metrics = [
    { key: 'VHT', label: t('vht'), unit: 'veh-h', icon: Clock, decimals: 1 },
    { key: 'VKT', label: t('vkt'), unit: 'veh-km', icon: Activity, decimals: 0 },
    { key: 'Vol', label: t('volume'), unit: 'veh', icon: Car, decimals: 0 },
    { key: 'TCur', label: t('tcur'), unit: 's', icon: Timer, decimals: 0 },
    { key: 'VCur', label: t('vcur'), unit: 'km/h', icon: Gauge, decimals: 1 },
    { key: 'Delay', label: t('delay'), unit: 's', icon: TrendingDown, decimals: 1 },
  ];

  const comparisonData = metrics.map(metric => {
    const baseVal = getMetricValue(baseData, metric.key);
    const optionVal = getMetricValue(optionData, metric.key);
    return {
      metric: metric.label, 
      [t('base')]: parseFloat(baseVal.toFixed(metric.decimals)),
      [t('option')]: parseFloat(optionVal.toFixed(metric.decimals)),
    };
  });

  const radarData = [
    { subject: 'Volume', [t('base')]: 80, [t('option')]: 85 },
    { subject: 'Speed', [t('base')]: 70, [t('option')]: 82 },
    { subject: 'Delay', [t('base')]: 60, [t('option')]: 75 },
    { subject: 'Efficiency', [t('base')]: 65, [t('option')]: 88 },
    { subject: 'Safety', [t('base')]: 75, [t('option')]: 90 },
  ];

  const calculateDifference = (base, option) => {
    if (!base) return 0;
    return ((option - base) / base * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 bg-slate-200 dark:bg-dashdark-card" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Skeleton className="h-[500px] w-full col-span-1 bg-slate-200 dark:bg-dashdark-card" />
             <div className="col-span-2 space-y-6">
                <Skeleton className="h-40 w-full bg-slate-200 dark:bg-dashdark-card" />
                <Skeleton className="h-40 w-full bg-slate-200 dark:bg-dashdark-card" />
             </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('compTitle')}
        </h1>
        <p className="text-slate-600 dark:text-dashdark-muted mt-1">{t('compDesc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        
        {/* 왼쪽: 지도 (4열) - 제목 변경됨 */}
        <div className="lg:col-span-4 h-full">
            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg h-full flex flex-col">
                <CardHeader className="border-b border-slate-100 dark:border-dashdark-border">
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    {t('compMapTitle')} 
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative overflow-hidden">
                   <div className="absolute inset-0">
                    <IntersectionMap intersections={intersections} />
                   </div>
                </CardContent>
            </Card>
        </div>

        {/* 오른쪽: 차트 및 통계 (8열) */}
        <div className="lg:col-span-8 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map(metric => {
                const Icon = metric.icon;
                const baseValue = getMetricValue(baseData, metric.key);
                const optionValue = getMetricValue(optionData, metric.key);
                const diff = calculateDifference(baseValue, optionValue);
                
                const isLowerBetter = ['Delay', 'TCur', 'VHT'].includes(metric.key);
                const isImprovement = isLowerBetter ? diff < 0 : diff > 0;

                return (
                    <Card key={metric.key} className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-medium text-slate-600 dark:text-dashdark-muted flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        {metric.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] uppercase text-slate-400">{t('base')}</span>
                            <span className="text-base font-bold text-slate-700 dark:text-slate-200">
                            {baseValue.toLocaleString(undefined, { maximumFractionDigits: metric.decimals })} {metric.unit}
                            </span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] uppercase text-slate-400">{t('option')}</span>
                            <span className="text-base font-bold text-violet-600 dark:text-violet-400">
                            {optionValue.toLocaleString(undefined, { maximumFractionDigits: metric.decimals })} {metric.unit}
                            </span>
                        </div>
                        <div className={`flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-dashdark-border ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                            {isImprovement ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span className="text-xs font-semibold">
                            {Math.abs(diff)}% {isImprovement ? t('improvement') : t('decrease')}
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
                        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                        <GitCompare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        {t('majorComp')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="metric" tick={{fontSize: 11}} angle={-15} textAnchor="end" height={60} />
                            <YAxis tick={{fontSize: 11}} />
                            <Tooltip 
                                cursor={{fill: 'rgba(0,0,0,0.05)'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey={t('base')} fill="#64748B" name={t('base')} radius={[4, 4, 0, 0]} />
                            <Bar dataKey={t('option')} fill="#8B5CF6" name={t('option')} radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                        <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        {t('radarTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData} outerRadius={100}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                            <Radar name={t('base')} dataKey={t('base')} stroke="#64748B" strokeWidth={2} fill="#64748B" fillOpacity={0.3} />
                            <Radar name={t('option')} dataKey={t('option')} stroke="#8B5CF6" strokeWidth={2} fill="#8B5CF6" fillOpacity={0.3} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}