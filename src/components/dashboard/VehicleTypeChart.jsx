import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Truck, Bus } from 'lucide-react';
import { useLanguage } from "../../context/LanguageContext";

const COLORS = {
  '승용': 'rgb(59, 130, 246)',
  '버스': 'rgb(16, 185, 129)',
  '화물': 'rgb(234, 88, 12)',
};

export default function VehicleTypeChart({ trafficData, compact = false }) {
  const { language } = useLanguage();
  const isKo = language === 'ko';

  if (!trafficData || trafficData.length === 0) {
    return compact ? (
      <div className="h-full w-full flex flex-col justify-center items-center text-slate-400 text-sm">
        {isKo ? '데이터 없음' : 'No Data'}
      </div>
    ) : (
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm h-full flex flex-col justify-center items-center">
        <div className="text-slate-400 dark:text-slate-600 text-sm">
          {isKo ? '데이터 없음' : 'No Data'}
        </div>
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
      .map(([koName, value]) => {
        let name = koName;
        if (!isKo) {
          if (koName === '승용') name = 'Car';
          else if (koName === '버스') name = 'Bus';
          else if (koName === '화물') name = 'Truck';
        }
        return { koName, name, value };
      })
      .filter(item => item.value > 0);
  };

  const data = aggregateVehicleData();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1)
  }));

  const iconMap = { '승용': Car, '버스': Bus, '화물': Truck };

  // HUD 모드일 때는 헤더 없이 순수 컨텐츠(리스트 + 차트) 레이아웃만 반환하여 부모 카드 디자인에 맞춤
  if (compact) {
    return (
      <div className="flex-1 flex flex-row items-center w-full h-full p-3 gap-3 min-h-0">
        {/* 왼쪽: 차량 리스트 (비율 45%, 여백 최적화) */}
        <div className="w-[45%] flex flex-col justify-center space-y-2 h-full shrink-0 pl-1">
          {dataWithPercentage.map(item => {
              const Icon = iconMap[item.koName];
              return (
                <div key={item.koName} className="flex items-center gap-2 p-1.5 rounded bg-slate-800/40 border border-slate-700/30">
                    <div className="p-1.5 rounded bg-black/30">
                      <Icon className="w-3 h-3" style={{ color: COLORS[item.koName] }} />
                    </div>
                    <div className="flex-1 flex justify-between items-center pr-1">
                      <span className="text-xs font-medium text-slate-200">{item.name}</span>
                      <span className="text-xs text-slate-400">
                        {item.value.toLocaleString()}{isKo ? '대' : ''} <span className="opacity-70 text-[10px] ml-0.5">({item.percentage}%)</span>
                      </span>
                    </div>
                </div>
              );
          })}
        </div>

        {/* 오른쪽: 파이차트 (나머지 공간 꽉 채우며 정중앙 배치) */}
        <div className="flex-1 min-h-0 h-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius="80%" 
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.koName]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => value.toLocaleString() + (isKo ? '대' : '')} 
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 기본 대시보드 모드 (Dashboard.jsx용)
  return (
    <Card className="h-full flex flex-col bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm">
      <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border shrink-0">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Car className="w-4 h-4 text-violet-500" />
          {isKo ? '차종 분포' : 'Vehicle Distribution'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-row items-center justify-between min-h-0 p-4 gap-4">
        {/* 왼쪽 리스트 */}
        <div className="w-[45%] flex flex-col justify-center space-y-2 h-full shrink-0 overflow-y-auto">
          {dataWithPercentage.map(item => {
              const Icon = iconMap[item.koName];
              return (
                <div key={item.koName} className="flex items-center gap-2 p-2 rounded border transition-colors bg-slate-50 dark:bg-dashdark-sidebar border-transparent hover:bg-slate-100 dark:hover:bg-dashdark-hover">
                    <div className="p-1.5 rounded bg-white dark:bg-black/20 shadow-sm">
                      <Icon className="w-3 h-3" style={{ color: COLORS[item.koName] }} />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-700 dark:text-white">{item.name}</span>
                      <span className="text-xs text-slate-500 dark:text-dashdark-muted">
                        {item.value.toLocaleString()}{isKo ? '대' : ''} <span className="opacity-70 text-[10px] ml-0.5">({item.percentage}%)</span>
                      </span>
                    </div>
                </div>
              );
          })}
        </div>

        {/* 오른쪽 파이차트 */}
        <div className="flex-1 min-h-0 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percentage }) => `${name} (${percentage}%)`}
                outerRadius="80%" 
                fill="#8884d8"
                dataKey="value"
                stroke="none"
              >
                {dataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.koName]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => value.toLocaleString() + (isKo ? '대' : '')} 
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
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}