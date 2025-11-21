import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Truck, Bus } from 'lucide-react';

const COLORS = {
  '승용': 'rgb(59, 130, 246)',
  '버스': 'rgb(16, 185, 129)',
  '화물': 'rgb(234, 88, 12)',
};

// ▼▼▼ [수정] compact prop 추가 (HUD 호환용) ▼▼▼
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
    <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm h-full flex flex-col">
      <CardHeader className="border-b border-slate-100 dark:border-dashdark-border py-3 px-4 shrink-0">
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Car className="w-4 h-4 text-violet-500" />
          차종 분포
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col min-h-0">
        {/* 차트 영역: 남은 공간을 모두 차지하도록 설정 */}
        <div className="flex-1 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius="80%"
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
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#1e293b' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* 하단 리스트: compact 모드일 때는 숨기거나 스크롤 처리 */}
        <div className={`mt-2 space-y-1 shrink-0 overflow-y-auto ${compact ? 'max-h-[80px]' : 'max-h-[120px]'}`}>
          {dataWithPercentage.map(item => {
            const Icon = iconMap[item.name];
            return (
              <div key={item.name} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-dashdark-sidebar rounded hover:bg-slate-100 dark:hover:bg-dashdark-hover transition-colors">
                <div className="p-1.5 rounded bg-white/50 dark:bg-black/20">
                  <Icon className="w-3 h-3" style={{ color: COLORS[item.name] }} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-xs text-slate-700 dark:text-white font-medium">{item.name}</span>
                  <span className="text-xs text-slate-500 dark:text-dashdark-muted">{item.value.toLocaleString()}대 ({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}