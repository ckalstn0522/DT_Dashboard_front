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
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm h-full flex flex-col justify-center items-center">
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
    // ▼▼▼ [수정] 배경 투명 & 테두리 제거 (HUD 카드 안에 들어가므로) ▼▼▼
    <Card className="h-full flex flex-col bg-transparent border-0 shadow-none">
      {/* ▼▼▼ [수정] compact 모드에서도 헤더 표시 (제목 통일) ▼▼▼ */}
      <CardHeader className={`border-b border-slate-100 dark:border-dashdark-border shrink-0 ${compact ? 'py-2 px-4 border-slate-700/30' : 'py-3 px-4'}`}>
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Car className="w-4 h-4 text-violet-500" />
          차종 분포
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`flex-1 flex flex-col min-h-0 ${compact ? 'p-2' : 'p-4'}`}>
        {/* 차트 영역 */}
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={compact ? null : ({ name, percentage }) => `${name} ${percentage}%`}
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
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '8px',
                  color: '#1e293b',
                  fontSize: '11px',
                  padding: '4px 8px'
                }}
                itemStyle={{ color: '#1e293b' }}
              />
              {!compact && <Legend wrapperStyle={{ fontSize: '11px' }} />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* 하단 리스트 (compact 모드용) */}
        {compact && (
            <div className="mt-1 space-y-1 shrink-0 overflow-y-auto max-h-[40%] px-1 pb-1">
            {dataWithPercentage.map(item => {
                const Icon = iconMap[item.name];
                return (
                <div key={item.name} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded hover:bg-slate-700/50 transition-colors">
                    <div className="p-1 rounded bg-black/30">
                    <Icon className="w-3 h-3" style={{ color: COLORS[item.name] }} />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                    <span className="text-[10px] text-slate-200 font-medium">{item.name}</span>
                    <span className="text-[10px] text-slate-400">{item.value.toLocaleString()} <span className="text-[9px] opacity-70">({item.percentage}%)</span></span>
                    </div>
                </div>
                );
            })}
            </div>
        )}
      </CardContent>
    </Card>
  );
}