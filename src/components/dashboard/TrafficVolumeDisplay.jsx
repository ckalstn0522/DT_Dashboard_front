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
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">방향별 교통량</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-slate-400 dark:text-slate-600">
            교차로를 선택해주세요
          </div>
        </CardContent>
      </Card>
    );
  }

  const aggregatedData = {};
  trafficData.forEach(data => {
    const dir = data.direction_eng;
    if (!aggregatedData[dir]) {
      aggregatedData[dir] = { vehs: 0, actual: 0, direction: dir };
    }
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
    <div className={`flex ${isHorizontal ? 'flex-col items-center' : 'flex-row items-center'} gap-3 p-4 bg-white dark:bg-dashdark-sidebar rounded-xl border-2 border-slate-200 dark:border-dashdark-border hover:border-violet-400 dark:hover:border-violet-500 transition-all hover:shadow-lg min-w-[150px]`}>
      <div 
        className="p-3 rounded-lg flex-shrink-0"
        style={{ backgroundColor: data.color + '20' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={data.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={ArrowIcons[data.arrow]} />
        </svg>
      </div>
      <div className={`flex-1 min-w-0 ${isHorizontal ? 'text-center' : ''}`}>
        <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">{data.turnType}</div>
        <div className="text-xs text-slate-500 dark:text-dashdark-muted mb-2">({data.label})</div>
        <div className={`grid ${isHorizontal ? 'grid-cols-1' : 'grid-cols-2'} gap-2 text-xs`}>
          <div>
            <span className="text-slate-500 dark:text-slate-400">시뮬</span>
            <div className="font-bold text-cyan-600 dark:text-cyan-400">{data.vehs.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">실제</span>
            <div className="font-bold text-indigo-600 dark:text-indigo-400">{data.actual.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          방향별 교통량 (사거리 형태)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {intersectionImage && (
          <div className="mb-6 relative">
            <img 
              src={intersectionImage} 
              alt="교차로" 
              className="w-full h-64 object-cover rounded-lg shadow-md"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        {/* 사거리 레이아웃 */}
        <div className="relative bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-dashdark-border">
          {/* 도로 표시 - 수직 (다크 모드: 어두운 도로) */}
          <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-32 bg-slate-300 dark:bg-slate-800">
            <div className="absolute top-0 bottom-0 left-1/2 w-1 border-l-4 border-dashed border-white/50 dark:border-slate-600" />
          </div>
          
          {/* 도로 표시 - 수평 */}
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-32 bg-slate-300 dark:bg-slate-800">
            <div className="absolute left-0 right-0 top-1/2 h-1 border-t-4 border-dashed border-white/50 dark:border-slate-600" />
          </div>

          {/* 중앙 교차로 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-amber-400 via-amber-300 to-amber-400 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white dark:border-slate-700 z-10">
            <div className="text-white text-center">
              <div className="text-3xl font-bold mb-1">🚦</div>
              <div className="text-xs font-bold bg-white/30 px-2 py-1 rounded backdrop-blur-sm">교차로</div>
            </div>
          </div>

          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {groupedByPosition.top.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={true} />)}
          </div>
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-20">
            {groupedByPosition.right.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={false} />)}
          </div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
            {groupedByPosition.bottom.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={true} />)}
          </div>
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-20">
            {groupedByPosition.left.map(data => <DirectionArrow key={data.direction} data={data} isHorizontal={false} />)}
          </div>

          <div className="h-[700px]" />
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 범례 카드들도 다크모드 적용 */}
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border-2 border-red-200 dark:border-red-900/30">
            <div className="text-xs text-red-600 dark:text-red-400 mb-1 font-semibold">좌회전</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 shadow" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">빨강</span>
            </div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border-2 border-blue-200 dark:border-blue-900/30">
            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-semibold">직진</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">파랑</span>
            </div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border-2 border-green-200 dark:border-green-900/30">
            <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-semibold">우회전</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 shadow" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">초록</span>
            </div>
          </div>
          <div className="p-4 bg-violet-50 dark:bg-violet-900/10 rounded-lg border-2 border-violet-200 dark:border-violet-900/30">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">총 데이터</div>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-400">
              {Object.keys(aggregatedData).length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">개 방향</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}