import React from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { TrendingDown, TrendingUp, Activity, Clock, Gauge, Car, Timer } from 'lucide-react';
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

  const calculateDifference = (base, option) => {
    if (!base) return 0;
    return ((option - base) / base * 100).toFixed(1);
  };

  // 요청하신 배치 순서대로 배열 정의
  // 1행: VHT, VKT
  // 2행: Vol, TCur
  // 3행: VCur, Delay
  const metrics = [
    { key: 'VHT', label: t('vht'), unit: 'h', icon: Clock, decimals: 1 },
    { key: 'VKT', label: t('vkt'), unit: 'km', icon: Activity, decimals: 0 },
    { key: 'Vol', label: t('volume'), unit: 'veh', icon: Car, decimals: 0 },
    { key: 'TCur', label: t('tcur'), unit: 's', icon: Timer, decimals: 0 },
    { key: 'VCur', label: t('vcur'), unit: 'km/h', icon: Gauge, decimals: 1 },
    { key: 'Delay', label: t('delay'), unit: 's', icon: TrendingDown, decimals: 1 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             <div className="lg:col-span-4"><Skeleton className="h-[600px] w-full" /></div>
             <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[250px] w-full" />)}
                </div>
             </div>
        </div>
      </div>
    );
  }

  // --- 시각화 컴포넌트 ---

  const RenderSimpleBar = ({ base, option, unit, color }) => {
    const data = [
      { name: 'BEFORE', value: base },
      { name: 'AFTER', value: option }
    ];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} width={30} />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} barSize={50}>
            <LabelList dataKey="value" position="top" fill="#64748b" fontSize={12} fontWeight="bold" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const RenderVolumeChart = () => {
    return (
        <div className="grid grid-cols-2 h-full items-center relative w-full">
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2/3 w-px bg-slate-200 dark:bg-slate-700"></div>
             <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-full shadow-sm">
                    <Car className="w-12 h-12 text-slate-400" />
                </div>
             </div>
             <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="p-5 bg-violet-50 dark:bg-violet-900/20 rounded-full shadow-sm">
                    <Car className="w-14 h-14 text-violet-500" />
                </div>
             </div>
        </div>
    );
  };

  const RenderGaugeChart = ({ base, option }) => {
    const MAX_SPEED = 200; 
    const baseVal = Math.min(base, MAX_SPEED);
    const optionVal = Math.min(option, MAX_SPEED);
    const data = [
      { name: 'BEFORE', value: baseVal, color: '#94a3b8' },
      { name: 'AFTER', value: optionVal, color: '#8b5cf6' }
    ];

    return (
      <div className="grid grid-cols-2 h-full items-end pb-2 w-full">
        {data.map((item) => (
          <div key={item.name} className="flex flex-col items-center justify-end w-full h-full relative">
            <div className="w-[120px] h-[120px] lg:w-[140px] lg:h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={[{ val: item.value }, { val: MAX_SPEED - item.value }]}
                    cx="50%" 
                    cy="85%"  
                    startAngle={180} 
                    endAngle={0}
                    innerRadius="60%" 
                    outerRadius="90%" 
                    dataKey="val" 
                    stroke="none"
                    >
                    <Cell fill={item.color} />
                    <Cell fill="#e2e8f0" />
                    </Pie>
                </PieChart>
                </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const RenderTimeDisplay = () => {
     return (
        <div className="grid grid-cols-2 h-full items-center relative w-full">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2/3 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <Clock className="w-8 h-8 text-slate-400" />
                </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-violet-500 shadow-lg bg-violet-50 dark:bg-violet-900/20">
                    <Timer className="w-10 h-10 text-violet-600 dark:text-violet-400" />
                </div>
            </div>
        </div>
     );
  };

  const RenderLollipopChart = ({ base, option }) => {
    const data = [
        { name: 'BEFORE', value: base, fill: '#ef4444' }, 
        { name: 'AFTER', value: option, fill: base > option ? '#22c55e' : '#ef4444' } 
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
                barSize={12} 
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} />
                <Bar dataKey="value" fill="#e2e8f0" background={{ fill: 'transparent' }} radius={[0, 10, 10, 0]}>
                   <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                </Bar>
                 <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={10} >
                     {
                        data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))
                     }
                 </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
  };

  const renderVisualization = (metric, baseVal, optionVal) => {
    switch(metric.key) {
        case 'VHT': return <RenderSimpleBar base={baseVal} option={optionVal} unit="h" color="#8b5cf6" />;
        case 'VKT': return <RenderSimpleBar base={baseVal} option={optionVal} unit="km" color="#3b82f6" />;
        case 'Vol': return <RenderVolumeChart />;
        case 'TCur': return <RenderTimeDisplay />;
        case 'VCur': return <RenderGaugeChart base={baseVal} option={optionVal} />;
        case 'Delay': return <RenderLollipopChart base={baseVal} option={optionVal} />;
        default: return null;
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto space-y-4 h-full pb-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('compTitle')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-dashdark-muted mt-0.5">{t('compDesc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
        
        {/* 왼쪽: 지도 (4열) */}
        <div className="lg:col-span-4 h-auto lg:h-[calc(100vh-150px)] min-h-[500px]">
            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg h-full flex flex-col">
                <CardHeader className="border-b border-slate-100 dark:border-dashdark-border py-3">
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-base">
                    <Activity className="w-4 h-4 text-violet-600 dark:text-violet-400" />
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

        {/* 오른쪽: 통합된 통계 및 시각화 그리드 (8열) */}
        <div className="lg:col-span-8 h-auto lg:h-[calc(100vh-150px)] pr-2 overflow-y-auto">
            
            {/* [수정] 2열(grid-cols-2) x 3행(grid-rows-3) 구조 적용 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 md:grid-rows-3 lg:grid-rows-3 gap-3 w-full h-full">
                {metrics.map((metric) => {
                    const baseVal = parseFloat(getMetricValue(baseData, metric.key).toFixed(metric.decimals));
                    const optionVal = parseFloat(getMetricValue(optionData, metric.key).toFixed(metric.decimals));
                    const diff = calculateDifference(baseVal, optionVal);
                    const isLowerBetter = ['Delay', 'TCur', 'VHT'].includes(metric.key);
                    const isImprovement = isLowerBetter ? diff < 0 : diff > 0;
                    const Icon = metric.icon;

                    return (
                        <Card key={metric.key} className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col h-full">
                            {/* Header */}
                            <CardHeader className="py-2 px-4 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between space-y-0 shrink-0">
                                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                                        <Icon className="w-4 h-4 text-violet-600" />
                                    </div>
                                    {metric.label}
                                </CardTitle>
                                <span className="text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {metric.unit}
                                </span>
                            </CardHeader>

                            <CardContent className="p-0 flex-1 flex flex-col h-full min-h-0">
                                {/* Visualization Area */}
                                <div className="flex-1 w-full min-h-0 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 flex items-center justify-center p-2">
                                    {renderVisualization(metric, baseVal, optionVal)}
                                </div>

                                {/* Stats Area */}
                                <div className="p-2 shrink-0 flex flex-col justify-center gap-2 bg-white dark:bg-dashdark-card">
                                    <div className="grid grid-cols-2 w-full">
                                        <div className="flex flex-col items-center justify-center gap-0 border-r border-slate-100 dark:border-slate-800 w-full">
                                            <span className="text-[10px] uppercase text-slate-400 font-bold mb-1">BEFORE</span>
                                            <span className="text-3xl font-bold text-slate-700 dark:text-slate-200 leading-none">
                                                {baseVal.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center gap-0 w-full">
                                            <span className="text-[10px] uppercase text-violet-500 font-bold mb-1">AFTER</span>
                                            <span className="text-3xl font-bold text-violet-600 dark:text-violet-400 leading-none">
                                                {optionVal.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-center gap-1.5 rounded-lg py-1 mt-1 mx-auto w-3/4 ${isImprovement ? 'bg-green-50 text-green-700 dark:bg-green-900/20' : 'bg-red-50 text-red-700 dark:bg-red-900/20'}`}>
                                        {isImprovement ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        <span className="text-sm font-bold">
                                            {Math.abs(diff)}% {isImprovement ? t('improvement') : t('decrease')}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

        </div>
      </div>
    </div>
  );
}