import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { TrendingDown, TrendingUp, Activity, Clock, Gauge, Car, Timer } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/LanguageContext";
import IntersectionMap from "@/components/dashboard/IntersectionMap";
import { motion } from "framer-motion";
import { AnimatedCounter } from "../components/ui/AnimatedCounter";

const API_URL = import.meta.env.VITE_API_URL;

// [Animation Variants]
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { 
    y: 0, opacity: 1,
    transition: { type: "spring", stiffness: 150, damping: 20 }
  }
};

export default function Comparison() {
  const { t } = useLanguage();
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [baseScenarioId, setBaseScenarioId] = useState('');
  const [optionScenarioId, setOptionScenarioId] = useState('');
  
  const { data: intersections, isLoading: isIntersectionsLoading } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const { data: scenarios = [], isLoading: isScenariosLoading } = useQuery({
    queryKey: ['comparisonScenarios'],
    queryFn: () => axios.get(`${API_URL}/scenarios`).then(res => res.data),
    initialData: [],
  });

  useEffect(() => {
    if (!selectedIntersection && intersections.length > 0) {
      setSelectedIntersection(intersections[0]);
    }
  }, [intersections, selectedIntersection]);

  useEffect(() => {
    if (!Array.isArray(scenarios) || scenarios.length === 0) return;

    const sortedScenarios = [...scenarios].sort((a, b) => String(a.scenario_id).localeCompare(String(b.scenario_id)));
    const baseCandidate = sortedScenarios.find((item) => item.scenario_id === 'S000001') || sortedScenarios[0];

    if (!baseScenarioId || !sortedScenarios.some((item) => item.scenario_id === baseScenarioId)) {
      setBaseScenarioId(baseCandidate?.scenario_id || '');
    }

    const optionCandidates = sortedScenarios.filter(
      (item) => item.scenario_id !== (baseScenarioId || baseCandidate?.scenario_id)
    );

    if (
      !optionScenarioId ||
      optionScenarioId === (baseScenarioId || baseCandidate?.scenario_id) ||
      !sortedScenarios.some((item) => item.scenario_id === optionScenarioId)
    ) {
      const defaultOption = optionCandidates.at(-1) || sortedScenarios.at(-1);
      if (defaultOption?.scenario_id && defaultOption.scenario_id !== (baseScenarioId || baseCandidate?.scenario_id)) {
        setOptionScenarioId(defaultOption.scenario_id);
      }
    }
  }, [scenarios, baseScenarioId, optionScenarioId]);

  const selectedIntersectionId = selectedIntersection?.intersection_id;

  const { data: comparison, isLoading: isComparisonsLoading } = useQuery({
    queryKey: ['results-comparison', selectedIntersectionId, baseScenarioId, optionScenarioId],
    enabled: Boolean(selectedIntersectionId && baseScenarioId && optionScenarioId),
    queryFn: () =>
      axios
        .get(`${API_URL}/results/comparison`, {
          params: {
            intersection_id: selectedIntersectionId,
            base_scenario_id: baseScenarioId,
            option_scenario_id: optionScenarioId,
          },
        })
        .then((res) => res.data),
    initialData: null,
  });

  const isLoading = isComparisonsLoading || isIntersectionsLoading || isScenariosLoading;
  const baseData = comparison?.base || {};
  const optionData = comparison?.option || {};
  const resolvedBaseScenarioName =
    comparison?.scenario?.base_scenario_name ||
    scenarios.find((item) => item.scenario_id === baseScenarioId)?.scenario_name ||
    t('base');
  const resolvedOptionScenarioName =
    comparison?.scenario?.option_scenario_name ||
    scenarios.find((item) => item.scenario_id === optionScenarioId)?.scenario_name ||
    t('option');

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
    if (!base || base === 0) return 0;
    return ((option - base) / base * 100).toFixed(1);
  };

  const metrics = [
    { key: 'VHT', label: t('vht'), unit: 'h', icon: Clock, decimals: 1 },
    { key: 'VKT', label: t('vkt'), unit: 'km', icon: Activity, decimals: 0 },
    { key: 'Vol', label: t('volume'), unit: 'veh', icon: Car, decimals: 0 },
    { key: 'TCur', label: t('tcur'), unit: 's', icon: Timer, decimals: 0 },
    { key: 'VCur', label: t('vcur'), unit: 'km/h', icon: Gauge, decimals: 1 },
    { key: 'Delay', label: t('delay'), unit: 's', icon: TrendingDown, decimals: 1 },
  ];

  if (isLoading) {
    return <div className="p-6 h-screen flex flex-col gap-6"><Skeleton className="h-12 w-1/3" /><div className="flex-1 grid grid-cols-12 gap-6"><Skeleton className="col-span-4 h-full" /><Skeleton className="col-span-8 h-full" /></div></div>;
  }

  // --- 시각화 컴포넌트 ---
  const RenderSimpleBar = ({ base, option, color }) => {
    const data = [{ name: 'BEFORE', value: base }, { name: 'AFTER', value: option }];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 30, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border:'none'}} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} barSize={45}>
            <LabelList dataKey="value" position="top" fill="#64748b" fontSize={11} fontWeight="bold" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const RenderVolumeChart = () => (
    <div className="flex items-center justify-around w-full h-full">
      <div className="flex flex-col items-center">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-2 animate-bounce-slow">
          <Car className="w-10 h-10 text-slate-400" />
        </div>
        <span className="text-[10px] font-bold text-slate-400">BEFORE</span>
      </div>
      <div className="h-16 w-px bg-slate-200 dark:bg-slate-700" />
      <div className="flex flex-col items-center">
        <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-2 animate-bounce-slow" style={{animationDelay: '0.2s'}}>
          <Car className="w-12 h-12 text-violet-500" />
        </div>
        <span className="text-[10px] font-bold text-violet-500">AFTER</span>
      </div>
    </div>
  );

  const RenderGaugeChart = ({ base, option }) => {
    const MAX_VAL = 120;
    const data = [
      { name: 'BEFORE', value: Math.min(base, MAX_VAL), color: '#94a3b8' },
      { name: 'AFTER', value: Math.min(option, MAX_VAL), color: '#8b5cf6' }
    ];
    return (
      <div className="flex justify-around items-end w-full h-full pb-2">
        {data.map((item) => (
          <div key={item.name} className="relative w-[45%] h-[95%] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ v: item.value }, { v: MAX_VAL - item.value }]}
                  cx="50%" cy="85%" startAngle={180} endAngle={0}
                  innerRadius="60%" outerRadius="100%"
                  dataKey="v" stroke="none"
                >
                  <Cell fill={item.color} />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="text-[10px] font-bold text-slate-400 absolute bottom-0">{item.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const RenderTimeDisplay = () => (
    <div className="flex items-center justify-around w-full h-full">
      <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-2 border-slate-200 bg-slate-50">
        <Clock className="w-8 h-8 text-slate-400" />
      </div>
      <div className="h-12 w-px bg-slate-200" />
      <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-2 border-violet-500 bg-violet-50 shadow-sm animate-pulse">
        <Timer className="w-10 h-10 text-violet-600" />
      </div>
    </div>
  );

  const RenderLollipopChart = ({ base, option }) => {
    const data = [{ n: 'B', v: base, f: '#94a3b8' }, { n: 'A', v: option, f: '#8b5cf6' }];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis dataKey="n" type="category" width={20} tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
          <Bar dataKey="v" radius={[0, 10, 10, 0]} barSize={12}>
             {data.map((e, i) => <Cell key={i} fill={e.f} />)}
             <LabelList dataKey="v" position="right" style={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderVisualization = (metric, baseVal, optionVal) => {
    switch(metric.key) {
        case 'VHT': return <RenderSimpleBar base={baseVal} option={optionVal} color="#8b5cf6" />;
        case 'VKT': return <RenderSimpleBar base={baseVal} option={optionVal} color="#3b82f6" />;
        case 'Vol': return <RenderVolumeChart />;
        case 'TCur': return <RenderTimeDisplay />;
        case 'VCur': return <RenderGaugeChart base={baseVal} option={optionVal} />;
        case 'Delay': return <RenderLollipopChart base={baseVal} option={optionVal} />;
        default: return null;
    }
  };

  return (
    <motion.div 
      className="w-full max-w-[1920px] mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-20px)] overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      <motion.div variants={itemVariants} className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
          {t('compTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">{t('compDesc')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Left Map */}
        <motion.div variants={itemVariants} className="lg:col-span-4 xl:col-span-3 h-full min-h-[400px]">
            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-md h-full flex flex-col overflow-hidden hover:shadow-xl transition-shadow">
                <CardHeader className="border-b border-slate-50 dark:border-dashdark-border py-3 px-4 shrink-0 bg-slate-900/50 backdrop-blur-sm">
                  <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2 text-sm font-bold">
                    <Activity className="w-4 h-4 text-violet-600 animate-pulse" />
                    {t('compMapTitle')} 
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative bg-slate-50">
                    <div className="absolute inset-0">
                        <IntersectionMap
                          intersections={intersections}
                          onSelectIntersection={setSelectedIntersection}
                          selectedIntersectionId={selectedIntersectionId}
                        />
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Right Content */}
        <div className="lg:col-span-8 xl:col-span-9 h-full flex flex-col overflow-y-auto pr-1 custom-scrollbar">
            <motion.div variants={itemVariants} className="mb-4 shrink-0">
              <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm">
                <CardContent className="px-4 py-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-dashdark-muted">
                          Selected Intersection
                        </div>
                        <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                          {selectedIntersection?.intersection_name || '-'}
                        </div>
                      </div>
                      <div className="rounded-full bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        ID {selectedIntersectionId || '-'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Base Scenario</div>
                        <Select value={baseScenarioId} onValueChange={setBaseScenarioId}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select base scenario" />
                          </SelectTrigger>
                          <SelectContent>
                            {scenarios.map((scenario) => (
                              <SelectItem key={scenario.scenario_id} value={scenario.scenario_id}>
                                {scenario.scenario_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Option Scenario</div>
                        <Select value={optionScenarioId} onValueChange={setOptionScenarioId}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select option scenario" />
                          </SelectTrigger>
                          <SelectContent>
                            {scenarios
                              .filter((scenario) => scenario.scenario_id !== baseScenarioId)
                              .map((scenario) => (
                                <SelectItem key={scenario.scenario_id} value={scenario.scenario_id}>
                                  {scenario.scenario_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Before: {resolvedBaseScenarioName}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-1 font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                      After: {resolvedOptionScenarioName}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 md:grid-rows-3 xl:grid-rows-2 gap-4 h-full min-h-[600px]">
                {metrics.map((metric) => {
                    const rawBase = getMetricValue(baseData, metric.key);
                    const rawOption = getMetricValue(optionData, metric.key);
                    const baseVal = parseFloat(rawBase.toFixed(metric.decimals));
                    const optionVal = parseFloat(rawOption.toFixed(metric.decimals));
                    const diff = calculateDifference(rawBase, rawOption);
                    const isLowerBetter = ['Delay', 'TCur', 'VHT'].includes(metric.key);
                    const isImprovement = isLowerBetter ? diff < 0 : diff > 0;
                    const Icon = metric.icon;

                    return (
                        <motion.div variants={itemVariants} key={metric.key} className="h-full">
                            <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col h-full overflow-hidden hover:border-violet-300 transition-colors">
                                <CardHeader className="py-2.5 px-4 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between space-y-0 shrink-0">
                                    <CardTitle className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                        <Icon className="w-3.5 h-3.5 text-violet-600" />
                                        {metric.label}
                                    </CardTitle>
                                    <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                                        {metric.unit}
                                    </span>
                                </CardHeader>

                                <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                                    <div className="flex-1 w-full bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-center p-2 border-b border-slate-50 min-h-0">
                                        {renderVisualization(metric, baseVal, optionVal)}
                                    </div>

                                    <div className="p-3 shrink-0 bg-white dark:bg-dashdark-card">
                                        <div className="flex items-center justify-between">
                                            <div className="text-center flex-1">
                                                <p className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase">Before</p>
                                                <p className="text-xl font-black text-slate-700 dark:text-slate-200 leading-none">
                                                  <AnimatedCounter value={baseVal} />
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate mt-1">{resolvedBaseScenarioName}</p>
                                            </div>
                                            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2" />
                                            <div className="text-center flex-1">
                                                <p className="text-[9px] font-bold text-violet-500 mb-0.5 uppercase">After</p>
                                                <p className="text-xl font-black text-violet-600 dark:text-violet-400 leading-none">
                                                  <AnimatedCounter value={optionVal} />
                                                </p>
                                                <p className="text-[10px] text-violet-500 truncate mt-1">{resolvedOptionScenarioName}</p>
                                            </div>
                                        </div>

                                        <div className={`flex items-center justify-center gap-1 rounded-full py-1 px-3 w-fit mx-auto mt-3 ${isImprovement ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {isImprovement ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            <span className="text-xs font-black">
                                                {Math.abs(diff)}% {isImprovement ? t('improvement') : t('decrease')}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
