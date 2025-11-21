import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from 'lucide-react';

const ArrowIcons = {
  up: "M12 19V5M12 5l-7 7M12 5l7 7",
  down: "M12 5v14M12 19l-7-7M12 19l7-7",
  left: "M19 12H5M5 12l7-7M5 12l7 7",
  right: "M5 12h14M19 12l-7-7M19 12l-7 7",
};

const directionConfig = {
  'S-W': { position: 'bottom', arrow: 'left', turnType: '좌회전', label: '남→서', color: 'rgb(239, 68, 68)', order: 1 },
  'S-N': { position: 'bottom', arrow: 'up', turnType: '직진', label: '남→북', color: 'rgb(59, 130, 246)', order: 2 },
  'S-E': { position: 'bottom', arrow: 'right', turnType: '우회전', label: '남→동', color: 'rgb(16, 185, 129)', order: 3 },
  'E-N': { position: 'right', arrow: 'up', turnType: '우회전', label: '동→북', color: 'rgb(16, 185, 129)', order: 1 },
  'E-W': { position: 'right', arrow: 'left', turnType: '직진', label: '동→서', color: 'rgb(59, 130, 246)', order: 2 },
  'E-S': { position: 'right', arrow: 'down', turnType: '좌회전', label: '동→남', color: 'rgb(239, 68, 68)', order: 3 },
  'N-W': { position: 'top', arrow: 'left', turnType: '우회전', label: '북→서', color: 'rgb(16, 185, 129)', order: 1 },
  'N-S': { position: 'top', arrow: 'down', turnType: '직진', label: '북→남', color: 'rgb(59, 130, 246)', order: 2 },
  'N-E': { position: 'top', arrow: 'right', turnType: '좌회전', label: '북→동', color: 'rgb(239, 68, 68)', order: 3 },
  'W-N': { position: 'left', arrow: 'up', turnType: '좌회전', label: '서→북', color: 'rgb(239, 68, 68)', order: 1 },
  'W-E': { position: 'left', arrow: 'right', turnType: '직진', label: '서→동', color: 'rgb(59, 130, 246)', order: 2 },
  'W-S': { position: 'left', arrow: 'down', turnType: '우회전', label: '서→남', color: 'rgb(16, 185, 129)', order: 3 },
};

export default function TrafficVolumeDisplay({ trafficData, intersectionImage }) {
  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm h-full flex justify-center items-center">
        <div className="text-slate-400 dark:text-slate-600 text-sm">교차로를 선택해주세요</div>
      </Card>
    );
  }

  const aggregatedData = {};
  trafficData.forEach(data => {
    const dir = data.direction_eng;
    if (!aggregatedData[dir]) aggregatedData[dir] = { vehs: 0, actual: 0, direction: dir };
    aggregatedData[dir].vehs += data.vehs || 0;
    aggregatedData[dir].actual += data.소계_대 || 0;
  });

  const groupedByPosition = { top: [], right: [], bottom: [], left: [] };
  Object.values(aggregatedData).forEach(data => {
    const config = directionConfig[data.direction];
    if (config) groupedByPosition[config.position].push({ ...data, ...config });
  });
  Object.keys(groupedByPosition).forEach(position => {
    groupedByPosition[position].sort((a, b) => a.order - b.order);
  });

  const DirectionArrow = ({ data, isHorizontal = false }) => (
    <div className={`flex ${isHorizontal ? 'flex-col items-center' : 'flex-row items-center'} gap-2 p-2 bg-white dark:bg-dashdark-sidebar rounded border border-slate-200 dark:border-dashdark-border hover:border-violet-400 dark:hover:border-violet-500 transition-all shadow-sm min-w-[100px]`}>
      <div className="p-1.5 rounded flex-shrink-0" style={{ backgroundColor: data.color + '20' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={data.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={ArrowIcons[data.arrow]} />
        </svg>
      </div>
      <div className={`flex-1 min-w-0 ${isHorizontal ? 'text-center' : ''}`}>
        <div className="text-xs font-bold text-slate-800 dark:text-white">{data.turnType}</div>
        <div className="grid grid-cols-1 gap-0.5 text-[10px]">
          <div><span className="text-slate-500 dark:text-slate-400">시뮬 </span><span className="font-bold text-cyan-600 dark:text-cyan-400">{data.vehs.toLocaleString()}</span></div>
          <div><span className="text-slate-500 dark:text-slate-400">실제 </span><span className="font-bold text-indigo-600 dark:text-indigo-400">{data.actual.toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm h-full flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border shrink-0">
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Navigation className="w-4 h-4 text-violet-500" />
          방향별 교통량 (사거리 형태)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative flex-1 overflow-hidden">
        {intersectionImage && (
          <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20 pointer-events-none">
            <img src={intersectionImage} alt="교차로" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex justify-center items-center">
          <div className="absolute top-0 bottom-0 left-1/2 w-20 bg-slate-200 dark:bg-slate-800 -translate-x-1/2 flex flex-col justify-center">
             <div className="h-full border-l-2 border-dashed border-white/50 dark:border-slate-600 mx-auto"></div>
          </div>
          <div className="absolute left-0 right-0 top-1/2 h-20 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 flex flex-col justify-center">
             <div className="w-full border-t-2 border-dashed border-white/50 dark:border-slate-600 my-auto"></div>
          </div>
          <div className="absolute z-10 w-16 h-16 bg-amber-400 rounded-lg shadow-lg flex items-center justify-center border-2 border-white dark:border-slate-700">
            <span className="text-2xl">🚦</span>
          </div>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {groupedByPosition.top.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={true} />)}
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
            {groupedByPosition.right.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={false} />)}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {groupedByPosition.bottom.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={true} />)}
          </div>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
            {groupedByPosition.left.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={false} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}