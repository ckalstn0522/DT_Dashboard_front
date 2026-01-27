import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Database, Filter, Target, Activity, Car, Clock, FileText, LayoutDashboard } from 'lucide-react';
import { useFilter } from "@/context/FilterContext";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion"; // [Motion]

// Components
import IntersectionMap from "../components/dashboard/IntersectionMap";
import TrafficVolumeDisplay from "../components/dashboard/TrafficVolumeDisplay";
import { AnimatedCounter } from "../components/ui/AnimatedCounter"; // [Motion]

const API_URL = 'https://dt-dashboard-back.onrender.com/api';

// [Animation Variants] 등장 애니메이션 설정
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 12 }
  }
};

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

  const optionTrafficData = useMemo(() => {
    return filteredTrafficData.map(data => {
      const multiplier = 1.0 + Math.random() * 2.0; 
      return { ...data, 소계_대: Math.floor((data.소계_대 || 0) * multiplier) };
    });
  }, [filteredTrafficData]);

  const calculateIntersectionStats = (data) => {
    if (!data || data.length === 0) return { volume: 0, delay: 0, los: 'A' };
    const dirs = { N: 0, S: 0, E: 0, W: 0 };
    let totalVol = 0;
    data.forEach(d => {
      const dirCode = d.direction_eng || ''; 
      const origin = dirCode.charAt(0); 
      const vol = d.소계_대 || 0;
      if (dirs[origin] !== undefined) { dirs[origin] += vol; totalVol += vol; }
    });
    if (totalVol === 0) return { volume: 0, delay: 0, los: 'A' };
    let sumDelay = 0;
    Object.values(dirs).forEach(vol => { const dirDelay = vol > 0 ? vol / 35 : 0; sumDelay += dirDelay; });
    const avgDelay = (sumDelay / 4).toFixed(1);
    let los = 'A';
    if (avgDelay > 80) los = 'F'; else if (avgDelay > 60) los = 'E'; else if (avgDelay > 40) los = 'D'; else if (avgDelay > 25) los = 'C'; else if (avgDelay > 15) los = 'B';
    return { volume: totalVol, delay: avgDelay, los };
  };

  const baseStats = calculateIntersectionStats(filteredTrafficData);
  const optionStats = calculateIntersectionStats(optionTrafficData);

  const kpiItems = [
    { label: t('kpiTotalInt'), value: intersections.length, icon: BarChart2, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: t('kpiSelectedId'), value: selectedIntersection ? selectedIntersection.intersection_id : '-', icon: Target, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    { label: t('kpiDataTemp'), value: allTrafficData.length, icon: Database, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { label: t('kpiFilterTemp'), value: filteredTrafficData.length, icon: Filter, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  ];

  if (isLoadingIntersections || isLoadingTraffic) {
     return <div className="p-6 h-screen flex flex-col gap-6"><Skeleton className="h-12 w-1/3" /><div className="flex-1 grid grid-cols-12 gap-6"><Skeleton className="col-span-4 h-full" /><Skeleton className="col-span-8 h-full" /></div></div>;
  }

  return (
    // [Motion] 메인 컨테이너
    <motion.div 
      className="w-full max-w-[1920px] mx-auto p-4 lg:p-6 flex flex-col h-[calc(100vh-20px)] overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
          {/* 아이콘 회전 효과 */}
          <motion.div 
            initial={{ rotate: -180, opacity: 0 }} 
            animate={{ rotate: 0, opacity: 1 }} 
            transition={{ duration: 0.8, type: "spring" }}
          >
            <LayoutDashboard className="w-6 h-6 text-violet-600" />
          </motion.div>
          {t('dashTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-dashdark-muted mt-1">{t('mainDashboard')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* [Left Map] 3D 효과를 위한 hover scale */}
        <motion.div variants={itemVariants} className="lg:col-span-4 xl:col-span-3 h-full min-h-[400px]">
          <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-md h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 transform">
             <CardHeader className="border-b border-slate-50 dark:border-dashdark-border py-3 px-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardTitle className="text-slate-800 dark:text-white flex items-center gap-2 text-sm font-bold">
                  <Activity className="w-4 h-4 text-violet-600 animate-pulse" /> {/* 맥박 효과 */}
                  {t('dashMapTitle')}
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0 flex-1 relative bg-slate-50">
               <div className="absolute inset-0">
                 <IntersectionMap
                    intersections={intersections}
                    onSelectIntersection={setSelectedIntersection}
                    selectedIntersectionId={selectedIntersection?.intersection_id}
                  />
               </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* [Right Content] */}
        <div className="lg:col-span-8 xl:col-span-9 h-full flex flex-col overflow-y-auto pr-1 custom-scrollbar gap-4">
            
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            {kpiItems.map((item, idx) => (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                  className="p-4 bg-white dark:bg-dashdark-card rounded-xl border border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col items-center justify-center gap-1 relative overflow-hidden group cursor-default"
                >
                  {/* 배경 데코레이션 (Glassmorphism Glow) */}
                  <div className={`absolute -top-6 -right-6 w-20 h-20 ${item.bg} rounded-full blur-2xl opacity-60 group-hover:scale-150 transition-transform duration-700`}></div>
                  
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-dashdark-muted z-10 font-medium uppercase tracking-wider">
                    <item.icon className="w-3.5 h-3.5" /> {item.label}
                  </div>
                  <div className={`text-xl font-black ${item.color} z-10 flex items-baseline gap-1`}>
                     {typeof item.value === 'number' ? <AnimatedCounter value={item.value} /> : item.value}
                  </div>
                </motion.div>
            ))}
          </div>

          {/* Charts Area */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[350px] shrink-0">
            <div className="flex flex-col gap-2 h-full">
                <div className="flex items-center justify-between shrink-0 px-1">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white border-l-4 border-slate-500 pl-2">{t('base')}</h3>
                </div>
                <div className="flex-1 h-full min-h-0 bg-white dark:bg-dashdark-card rounded-xl border border-slate-200 dark:border-dashdark-border shadow-sm p-3 hover:border-slate-400 dark:hover:border-slate-600 transition-colors duration-300">
                    <TrafficVolumeDisplay trafficData={filteredTrafficData} />
                </div>
            </div>

            <div className="flex flex-col gap-2 h-full">
                <div className="flex items-center justify-between shrink-0 px-1">
                    <h3 className="text-sm font-bold text-violet-600 dark:text-violet-400 border-l-4 border-violet-500 pl-2">{t('option')}</h3>
                </div>
                <div className="flex-1 h-full min-h-0 bg-white dark:bg-dashdark-card rounded-xl border border-slate-200 dark:border-dashdark-border shadow-sm p-3 hover:border-violet-400 dark:hover:border-violet-500 transition-colors duration-300">
                    <TrafficVolumeDisplay trafficData={optionTrafficData} />
                </div>
            </div>
          </motion.div>

          {/* Summary Card */}
          <motion.div variants={itemVariants} className="flex-1 min-h-[200px] flex flex-col mb-1">
              <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex-1 flex flex-col hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border shrink-0 bg-slate-50/30 dark:bg-slate-900/30">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        {t('intersectionDataTitle')} 
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    
                    {/* Base Stats Panel */}
                    <div className="flex items-center justify-around p-4 bg-slate-50 dark:bg-dashdark-sidebar rounded-xl border border-slate-100 dark:border-dashdark-border h-full max-h-[140px] relative overflow-hidden group">
                        <div className="absolute left-0 top-0 w-1 h-full bg-slate-400 group-hover:w-1.5 transition-all"></div>
                        <div className="text-center">
                            <div className="text-xs text-slate-500 mb-1 font-semibold uppercase">{t('volume')}</div>
                            <div className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-1 justify-center">
                                <Car className="w-4 h-4 text-slate-400"/> <AnimatedCounter value={baseStats.volume} />
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-dashdark-border"></div>
                        <div className="text-center">
                            <div className="text-xs text-slate-500 mb-1 font-semibold uppercase">{t('delay')}</div>
                            <div className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-1 justify-center">
                                <Clock className="w-4 h-4 text-slate-400"/> {baseStats.delay}s
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-dashdark-border"></div>
                        <div className="text-center">
                            <div className="text-xs text-slate-500 mb-1 font-semibold uppercase">{t('los')}</div>
                            <motion.div 
                                key={baseStats.los}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`font-black text-2xl px-3 py-0.5 rounded-md shadow-sm ${
                                baseStats.los === 'A' || baseStats.los === 'B' ? 'bg-green-100 text-green-700' :
                                baseStats.los === 'C' || baseStats.los === 'D' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {baseStats.los}
                            </motion.div>
                        </div>
                    </div>

                    {/* Option Stats Panel */}
                    <div className="flex items-center justify-around p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800 h-full max-h-[140px] relative overflow-hidden group">
                        <div className="absolute left-0 top-0 w-1 h-full bg-violet-500 group-hover:w-1.5 transition-all"></div>
                        <div className="text-center">
                            <div className="text-xs text-violet-500 mb-1 font-semibold uppercase">{t('volume')}</div>
                            <div className="font-bold text-xl text-violet-800 dark:text-violet-300 flex items-center gap-1 justify-center">
                                <Car className="w-4 h-4 text-violet-400"/> <AnimatedCounter value={optionStats.volume} />
                            </div>
                        </div>
                        <div className="w-px h-8 bg-violet-200 dark:bg-violet-800"></div>
                        <div className="text-center">
                            <div className="text-xs text-violet-500 mb-1 font-semibold uppercase">{t('delay')}</div>
                            <div className="font-bold text-xl text-violet-800 dark:text-violet-300 flex items-center gap-1 justify-center">
                                <Clock className="w-4 h-4 text-violet-400"/> {optionStats.delay}s
                            </div>
                        </div>
                        <div className="w-px h-8 bg-violet-200 dark:bg-violet-800"></div>
                        <div className="text-center">
                            <div className="text-xs text-violet-500 mb-1 font-semibold uppercase">{t('los')}</div>
                            <motion.div 
                                key={optionStats.los}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`font-black text-2xl px-3 py-0.5 rounded-md shadow-sm ${
                                optionStats.los === 'A' || optionStats.los === 'B' ? 'bg-green-100 text-green-700' :
                                optionStats.los === 'C' || optionStats.los === 'D' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {optionStats.los}
                            </motion.div>
                        </div>
                    </div>
                  </CardContent>
              </Card>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}