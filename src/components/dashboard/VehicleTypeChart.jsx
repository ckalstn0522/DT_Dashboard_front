import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Truck, Bus } from 'lucide-react';
// 다국어 지원 Context 임포트
import { useLanguage } from "../../context/LanguageContext";

const COLORS = {
  '승용': 'rgb(59, 130, 246)',
  '버스': 'rgb(16, 185, 129)',
  '화물': 'rgb(234, 88, 12)',
};

export default function VehicleTypeChart({ trafficData, compact = false }) {
  // 언어 설정 가져오기
  const { language } = useLanguage();
  const isKo = language === 'ko';

  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className={`${compact ? 'bg-transparent border-0 shadow-none' : 'bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm'} h-full flex flex-col justify-center items-center`}>
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

  return (
    <Card className={`h-full flex flex-col ${compact ? 'bg-transparent border-0 shadow-none' : 'bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm'}`}>
      
      {/* 위 카드(정보 카드)와 패딩(py-2 px-4) 및 폰트(text-sm font-semibold)를 완벽히 일치시킴 */}
      <CardHeader className={`shrink-0 ${compact ? 'py-2 px-4 border-b border-slate-700/50' : 'py-3 px-4 border-b border-slate-100 dark:border-dashdark-border'}`}>
        <CardTitle className={`flex items-center gap-2 ${compact ? 'text-sm font-semibold text-slate-100' : 'text-base font-bold text-slate-900 dark:text-white'}`}>
          <Car className={`w-4 h-4 ${compact ? 'text-cyan-400' : 'text-violet-500'}`} />
          {isKo ? '차종 분포' : 'Vehicle Distribution'}
        </CardTitle>
      </CardHeader>
      
      {/* 가로(row) 배치, 여백 최적화 (p-3 gap-4) */}
      <CardContent className={`flex-1 flex flex-row items-center justify-between min-h-0 ${compact ? 'p-3 gap-4' : 'p-4 gap-4'}`}>
        
        {/* 왼쪽: 차량 리스트 (비율 45%, 찌그러지지 않게 정렬) */}
        <div className={`w-[45%] flex flex-col justify-center space-y-2 h-full shrink-0 ${compact ? '' : 'overflow-y-auto'}`}>
          {dataWithPercentage.map(item => {
              const Icon = iconMap[item.koName];
              
              const containerClass = compact 
                ? "bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/50" 
                : "bg-slate-50 dark:bg-dashdark-sidebar border-transparent hover:bg-slate-100 dark:hover:bg-dashdark-hover";
              
              const iconBgClass = compact ? "bg-black/30" : "bg-white dark:bg-black/20 shadow-sm";
              const textClass = compact ? "text-slate-200" : "text-slate-700 dark:text-white";
              const subTextClass = compact ? "text-slate-400" : "text-slate-500 dark:text-dashdark-muted";

              return (
                <div key={item.koName} className={`flex items-center gap-2 p-2 rounded border transition-colors ${containerClass}`}>
                    <div className={`p-1.5 rounded ${iconBgClass}`}>
                      <Icon className="w-3 h-3" style={{ color: COLORS[item.koName] }} />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`text-xs font-medium ${textClass}`}>{item.name}</span>
                      <span className={`text-xs ${subTextClass}`}>
                        {item.value.toLocaleString()}{isKo ? '대' : ''} <span className="opacity-70 text-[10px] ml-0.5">({item.percentage}%)</span>
                      </span>
                    </div>
                </div>
              );
          })}
        </div>

        {/* 오른쪽: 파이차트 (비율 55%, 중앙 정렬) */}
        <div className="flex-1 min-h-0 h-full w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={compact ? null : ({ name, value, percentage }) => `${name} (${percentage}%)`}
                outerRadius={compact ? "80%" : "80%"} 
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
              {!compact && <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
      </CardContent>
    </Card>
  );
}