import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation, Car, Clock, AlignJustify } from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext"; 

// 방향별 설정 (진입 기준)
const approachConfig = {
  'N': { position: 'top', color: 'rgb(239, 68, 68)' },
  'S': { position: 'bottom', color: 'rgb(59, 130, 246)' },
  'E': { position: 'right', color: 'rgb(16, 185, 129)' },
  'W': { position: 'left', color: 'rgb(249, 115, 22)' },
};

export default function TrafficVolumeDisplay({ trafficData, intersectionImage, compact = false }) {
  const { t } = useLanguage(); 

  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className={`h-full flex flex-col justify-center items-center ${compact ? 'bg-transparent border-0 shadow-none' : 'bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm'}`}>
        <div className="text-slate-400 dark:text-slate-600 text-sm">{t('selectPrompt')}</div>
      </Card>
    );
  }

  // 1. 방향별 데이터 집계 (N, S, E, W 진입 기준)
  const aggregatedData = useMemo(() => {
    const result = { N: null, S: null, E: null, W: null };

    Object.keys(result).forEach(key => {
      result[key] = { volume: 0, queue: 0, delay: 0, count: 0 };
    });

    trafficData.forEach(data => {
      const dirCode = data.direction_eng || ''; 
      const origin = dirCode.charAt(0); 

      if (result[origin]) {
        const vol = data.소계_대 || 0;
        result[origin].volume += vol;
        result[origin].count += 1;
      }
    });

    // 2. 대기행렬 및 지체시간 계산
    Object.keys(result).forEach(key => {
      const vol = result[key].volume;
      if (vol > 0) {
        result[key].queue = (vol / 15).toFixed(1); 
        result[key].delay = (vol / 35).toFixed(1);
      }
    });

    return result;
  }, [trafficData]);

  // 방향별 정보 카드 컴포넌트
  const ApproachCard = ({ dir }) => {
    const config = approachConfig[dir];
    const data = aggregatedData[dir];
    
    if (!data) return null;

    // 중앙에서 가장 멀어지도록 top-1, bottom-1, left-1, right-1 적용
    const positionStyles = {
      top: "top-1 left-1/2 -translate-x-1/2",
      bottom: "bottom-1 left-1/2 -translate-x-1/2",
      left: "left-1 top-1/2 -translate-y-1/2",
      right: "right-1 top-1/2 -translate-y-1/2",
    };

    return (
      // 카드의 너비와 높이를 고정 (w-[125px] h-[85px])하여 데이터가 길어져도 크기 불변
      <div className={`absolute z-20 bg-white/95 dark:bg-dashdark-sidebar/95 backdrop-blur-sm p-2 rounded-xl border border-slate-200 dark:border-dashdark-border shadow-lg flex flex-col justify-center gap-1.5 w-[143px] h-[85px] overflow-hidden ${positionStyles[config.position]}`}>
        
        {/* 교통량 */}
        <div className="flex items-start justify-between w-full gap-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center shrink-0 mt-0.5">
            <Car className="w-3 h-3 mr-1" /> {t('vehicleCount')}
          </span>
          {/* break-all을 통해 생략 없이 줄바꿈 처리 */}
          <span className="text-xs font-bold text-slate-900 dark:text-white text-right break-all leading-tight">
            {data.volume.toLocaleString()}
          </span>
        </div>
        
        {/* 대기행렬 */}
        <div className="flex items-start justify-between w-full gap-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center shrink-0 mt-0.5">
            <AlignJustify className="w-3 h-3 mr-1" /> {t('queue')}
          </span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-right break-all leading-tight">
            {data.queue}m
          </span>
        </div>
        
        {/* 지체시간 */}
        <div className="flex items-start justify-between w-full gap-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center shrink-0 mt-0.5">
            <Clock className="w-3 h-3 mr-1" /> {t('delaySimple')}
          </span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-right break-all leading-tight">
            {data.delay}s
          </span>
        </div>
        
      </div>
    );
  };

  return (
    <Card className={`h-full flex flex-col ${compact ? 'bg-transparent border-0 shadow-none' : 'bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm'}`}>
      
      {!compact && (
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border shrink-0">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-violet-500" />
            {t('trafficVolumeDirectional')}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-0 relative flex-1 overflow-hidden min-h-[300px]">
        {intersectionImage && (
          <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 pointer-events-none">
            <img src={intersectionImage} alt="교차로" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex justify-center items-center">
          {/* 도로 라인 */}
          <div className="absolute top-0 bottom-0 left-1/2 w-24 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 flex flex-col justify-center">
             <div className="h-full border-l-2 border-dashed border-white/50 dark:border-slate-600 mx-auto"></div>
          </div>
          <div className="absolute left-0 right-0 top-1/2 h-24 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 flex flex-col justify-center">
             <div className="w-full border-t-2 border-dashed border-white/50 dark:border-slate-600 my-auto"></div>
          </div>
          
          {/* 중앙 신호등 아이콘 */}
          <div className="absolute z-10 w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-100 dark:border-slate-700">
            <span className="text-3xl">🚦</span>
          </div>

          <ApproachCard dir="N" />
          <ApproachCard dir="E" />
          <ApproachCard dir="S" />
          <ApproachCard dir="W" />
        </div>
      </CardContent>
    </Card>
  );
}