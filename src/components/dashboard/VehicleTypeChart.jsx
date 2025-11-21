import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Truck, Bus } from 'lucide-react';

const COLORS = {
  '승용': 'rgb(59, 130, 246)',
  '버스': 'rgb(16, 185, 129)',
  '화물': 'rgb(234, 88, 12)',
};

export default function VehicleTypeChart({ trafficData }) {
  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">차종 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-600">
            교차로를 선택해주세요
          </div>
        </CardContent>
      </Card>
    );
  }

  const aggregateVehicleData = () => {
    const totals = {
      '승용': 0,
      '버스': 0,
      '화물': 0,
    };

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

  const iconMap = {
    '승용': Car,
    '버스': Bus,
    '화물': Truck,
  };

  return (
    <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
      <CardHeader className="border-b border-slate-100 dark:border-dashdark-border pb-4">
        <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          차종 분포
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage}%`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            {/* ▼▼▼ [수정] 툴팁 스타일: 흰색 배경에 검은 글씨로 변경하여 가독성 확보 ▼▼▼ */}
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
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          {dataWithPercentage.map(item => {
            const Icon = iconMap[item.name];
            return (
              <div key={item.name} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-dashdark-sidebar rounded-lg border border-transparent dark:border-dashdark-border hover:bg-slate-100 dark:hover:bg-dashdark-hover transition-colors">
                <div 
                  className="p-2 rounded-lg" 
                  style={{ backgroundColor: COLORS[item.name] + '20' }}
                >
                  <Icon className="w-5 h-5" style={{ color: COLORS[item.name] }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700 dark:text-white">{item.name}</div>
                  <div className="text-xs text-slate-500 dark:text-dashdark-muted">{item.percentage}%</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{item.value.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 dark:text-dashdark-muted">대</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-lg border border-violet-200 dark:border-violet-800/30">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">총 교통량</span>
            <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400">{total.toLocaleString()}대</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}