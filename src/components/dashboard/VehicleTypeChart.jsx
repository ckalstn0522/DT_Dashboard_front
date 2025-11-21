import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Truck, Bus } from 'lucide-react';

const COLORS = {
  '승용': 'rgb(59, 130, 246)',
  '버스': 'rgb(16, 185, 129)',
  '화물': 'rgb(234, 88, 12)',
};

export default function VehicleTypeChart({ trafficData, compact = false }) {
  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className={`${compact ? 'bg-transparent border-0 shadow-none' : 'bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm'} h-full flex flex-col justify-center items-center`}>
        <div className="text-slate-400 dark:text-slate-600 text-sm">데이터 없음</div>
      </Card>
    );
  }

  const aggregateVehicleData = () => {
    const totals = { '승용': 0, '버스': 0, '화물': 0 };
    trafficData.forEach(data => {
      totals['승용'] += data.소형_승용 || 0;
      totals['버스'] += (data.버스_소형 || 0) + (data.버스_대형 || 0);
      totals['화물'] += (data.화물_소형 || 0) + (data.화물_중형 || 0) + (data.화물_대형 || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  };

  const data = aggregateVehicleData();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }));

  const iconMap = { '승용': Car, '버스': Bus, '화물': Truck };

  return (
    <Card className={`h-full flex flex-col ${compact ? 'bg-transparent border-0 shadow-none' : 'bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm'}`}>
      
      {/* ▼▼▼ [수정] HUD(compact)일 때도 헤더가 보이도록 조건 제거 및 스타일 분기 ▼▼▼ */}
      <CardHeader className={`shrink-0 ${compact ? 'py-2 px-4 border-b border-slate-700/30' : 'py-3 px-4 border-b border-slate-100 dark:border-dashdark-border'}`}>
        <CardTitle className={`font-bold flex items-center gap-2 ${compact ? 'text-sm text-slate-100' : 'text-base text-slate-900 dark:text-white'}`}>
          <Car className={`w-4 h-4 ${compact ? 'text-cyan-400' : 'text-violet-500'}`} />
          차종 분포
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`flex-1 flex flex-col min-h-0 ${compact ? 'p-2' : 'p-4'}`}>
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                // ▼▼▼ [수정] HUD(compact)는 라벨 숨김(깔끔하게), 대시보드는 표시 ▼▼▼
                label={compact ? null : ({ name, value, percentage }) => `${name} (${percentage}%)`}
                outerRadius={compact ? "70%" : "80%"}
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => value.toLocaleString() + '대'} 
                contentStyle={{ 
                  backgroundColor: 'rgba(20, 20, 30, 0.9)', 
                  borderColor: '#334155', 
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '4px 8px'
                }}
                itemStyle={{ color: '#fff' }}
              />
              {/* 대시보드 모드일 때만 범례(Legend) 표시, HUD는 하단 리스트로 대체 */}
              {!compact && <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* ▼▼▼ [수정] 하단 리스트: HUD와 대시보드 모두 표시하되 스타일 다르게 적용 ▼▼▼ */}
        <div className={`mt-2 space-y-1 shrink-0 overflow-y-auto ${compact ? 'max-h-[40%] px-1' : 'max-h-[120px]'}`}>
          {dataWithPercentage.map(item => {
              const Icon = iconMap[item.name];
              
              // 스타일 분기: HUD(어두운 투명) vs 대시보드(밝은 배경)
              const containerClass = compact 
                ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/50" 
                : "bg-slate-50 dark:bg-dashdark-sidebar border-transparent hover:bg-slate-100 dark:hover:bg-dashdark-hover";
              
              const iconBgClass = compact ? "bg-black/30" : "bg-white dark:bg-black/20 shadow-sm";
              const textClass = compact ? "text-slate-200" : "text-slate-700 dark:text-white";
              const subTextClass = compact ? "text-slate-400" : "text-slate-500 dark:text-dashdark-muted";

              return (
                <div key={item.name} className={`flex items-center gap-2 p-2 rounded border transition-colors ${containerClass}`}>
                    <div className={`p-1.5 rounded ${iconBgClass}`}>
                      <Icon className="w-3 h-3" style={{ color: COLORS[item.name] }} />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`text-xs font-medium ${textClass}`}>{item.name}</span>
                      <span className={`text-xs ${subTextClass}`}>
                        {item.value.toLocaleString()}대 <span className="opacity-70 text-[10px]">({item.percentage}%)</span>
                      </span>
                    </div>
                </div>
              );
          })}
        </div>
      </CardContent>
    </Card>
  );
}