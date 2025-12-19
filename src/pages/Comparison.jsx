import React from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GitCompare, TrendingDown, TrendingUp, Activity, Clock, Gauge, Car, Timer } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

export default function Comparison() {
  const { t } = useLanguage();
  const { data: comparisons, isLoading } = useQuery({
    queryKey: ['simulationcomparison'],
    queryFn: () => axios.get(`${API_URL}/simulationcomparison`).then(res => res.data),
    initialData: [],
  });

  const baseData = comparisons.find(c => c.scenario_name === 'Base') || {};
  const optionData = comparisons.find(c => c.scenario_name === 'Option') || {};

  // 데이터 가공 및 새로운 지표 계산 함수
  const getMetricValue = (data, type) => {
    if (!data) return 0;
    const vol = data.total_volume || 0;
    const time = data.avg_travel_time || 0;
    const dist = data.total_distance || 0;
    const speed = data.avg_speed || 0;
    const delay = data.avg_delay || 0;

    switch (type) {
      case 'VHT': return (vol * time) / 3600; // Vehicle Hours Traveled (시간 단위)
      case 'VKT': return dist;                // Vehicle Kilometers Traveled
      case 'VCur': return speed;              // Velocity Current (속도)
      case 'TCur': return time;               // Time Current (통행시간)
      case 'Delay': return delay;             // Delay
      case 'Vol': return vol;                 // Traffic Volume
      default: return 0;
    }
  };

  // 6가지 지표 설정
  const metrics = [
    { key: 'VHT', label: t('vht'), unit: 'veh-h', icon: Clock, decimals: 1 },
    { key: 'VKT', label: t('vkt'), unit: 'veh-km', icon: Activity, decimals: 0 },
    { key: 'VCur', label: t('vcur'), unit: 'km/h', icon: Gauge, decimals: 1 },
    { key: 'TCur', label: t('tcur'), unit: 's', icon: Timer, decimals: 0 },
    { key: 'Delay', label: t('delay'), unit: 's', icon: TrendingDown, decimals: 1 },
    { key: 'Vol', label: t('volume'), unit: 'veh', icon: Car, decimals: 0 },
  ];

  const comparisonData = metrics.map(metric => {
    const baseVal = getMetricValue(baseData, metric.key);
    const optionVal = getMetricValue(optionData, metric.key);
    return {
      metric: metric.key,
      Base: parseFloat(baseVal.toFixed(metric.decimals)),
      Option: parseFloat(optionVal.toFixed(metric.decimals)),
    };
  });

  // 레이더 차트 데이터 (기존 유지)
  const radarData = [
    { subject: 'Volume', Base: 80, Option: 85 },
    { subject: 'Speed', Base: 70, Option: 82 },
    { subject: 'Delay', Base: 60, Option: 75 },
    { subject: 'Efficiency', Base: 65, Option: 88 },
    { subject: 'Safety', Base: 75, Option: 90 },
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
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t('compTitle')}
        </h1>
        <p className="text-slate-600 dark:text-dashdark-muted mt-1">{t('compDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map(metric => {
          const Icon = metric.icon;
          const baseValue = getMetricValue(baseData, metric.key);
          const optionValue = getMetricValue(optionData, metric.key);
          const diff = calculateDifference(baseValue, optionValue);
          
          // 값이 낮을수록 좋은 지표들 (지체, 시간 등)
          const isLowerBetter = ['Delay', 'TCur', 'VHT'].includes(metric.key);
          const isImprovement = isLowerBetter ? diff < 0 : diff > 0;

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
                      {baseValue.toLocaleString(undefined, { maximumFractionDigits: metric.decimals })} {metric.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 dark:text-slate-500">Option</span>
                    <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                      {optionValue.toLocaleString(undefined, { maximumFractionDigits: metric.decimals })} {metric.unit}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-dashdark-border ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                    {isImprovement ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-sm font-semibold">
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
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              {t('majorComp')}
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
                <Bar dataKey="Base" fill="#64748B" name="Base" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Option" fill="#8B5CF6" name="Option" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              {t('radarTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} outerRadius={150}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 14 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="Base" dataKey="Base" stroke="#64748B" strokeWidth={3} fill="#64748B" fillOpacity={0.3} />
                <Radar name="Option" dataKey="Option" stroke="#8B5CF6" strokeWidth={3} fill="#8B5CF6" fillOpacity={0.3} />
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