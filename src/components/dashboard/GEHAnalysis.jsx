import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp } from 'lucide-react';

const GEH_COLORS = {
  'GEH ≤ 5 (우수)': 'rgb(16, 185, 129)',
  '5 < GEH ≤ 10 (양호)': 'rgb(251, 191, 36)',
  'GEH > 10 (불량)': 'rgb(239, 68, 68)',
};

const calculateGEH = (simulated, observed) => {
  if (observed === 0 && simulated === 0) return 0;
  return Math.sqrt((2 * Math.pow(simulated - observed, 2)) / (simulated + observed));
};

// 파이 차트 내부 라벨 위치 계산 함수
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central" 
      className="text-xs font-bold drop-shadow-md"
    >
      {value}
    </text>
  );
};

export default function GEHAnalysis({ trafficData }) {
  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">GEH 통계 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-slate-400 dark:text-slate-600">
            데이터 없음
          </div>
        </CardContent>
      </Card>
    );
  }

  const gehData = trafficData.map(data => {
    const geh = calculateGEH(data.vehs || 0, data.소계_대 || 0);
    let category;
    if (geh <= 5) category = 'GEH ≤ 5 (우수)';
    else if (geh <= 10) category = '5 < GEH ≤ 10 (양호)';
    else category = 'GEH > 10 (불량)';
    
    return {
      direction: data.direction_eng,
      geh: geh,
      category: category,
      simulated: data.vehs || 0,
      observed: data.소계_대 || 0,
    };
  });

  const gehDistribution = {
    'GEH ≤ 5 (우수)': gehData.filter(d => d.geh <= 5).length,
    '5 < GEH ≤ 10 (양호)': gehData.filter(d => d.geh > 5 && d.geh <= 10).length,
    'GEH > 10 (불량)': gehData.filter(d => d.geh > 10).length,
  };

  const pieData = Object.entries(gehDistribution)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const meanObserved = gehData.reduce((sum, d) => sum + d.observed, 0) / gehData.length;
  const ssTot = gehData.reduce((sum, d) => sum + Math.pow(d.observed - meanObserved, 2), 0);
  const ssRes = gehData.reduce((sum, d) => sum + Math.pow(d.observed - d.simulated, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return (
    <div className="flex flex-col gap-4">
      
      {/* 1. GEH 분포 파이 차트 */}
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-dashdark-border">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            GEH 분포
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel} 
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                stroke="none" 
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GEH_COLORS[entry.name]} />
                ))}
              </Pie>
              {/* ▼▼▼ [수정] 툴팁 스타일: 배경색을 밝게, 텍스트를 어둡게 수정 (다크모드 대응 클래스 추가 안됨 - 인라인 스타일 우선) ▼▼▼ */}
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '8px',
                  color: '#1e293b',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
                itemStyle={{ color: '#1e293b' }} // 텍스트 색상 강제 지정
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2 space-y-1">
            {Object.entries(gehDistribution).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-dashdark-sidebar rounded border border-transparent dark:border-dashdark-border">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: GEH_COLORS[category] }}
                  />
                  <span className="text-[10px] text-slate-600 dark:text-dashdark-muted">{category}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{count}개</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. R-Squared 적합도 */}
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-lg">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-dashdark-border">
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            R² 적합도
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/30">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                {rSquared.toFixed(4)}
              </div>
              <div className="text-xs text-slate-600 dark:text-green-200/70">R-Squared 값</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A303F" />
              <XAxis 
                type="number" 
                dataKey="observed" 
                name="실제"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
              />
              <YAxis 
                type="number" 
                dataKey="simulated" 
                name="시뮬"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
              />
              {/* ▼▼▼ [수정] ScatterChart 툴팁 스타일도 동일하게 적용 ▼▼▼ */}
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '8px',
                  color: '#1e293b',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#1e293b' }}
              />
              <Scatter 
                data={gehData} 
                fill="rgb(139, 92, 246)"
                fillOpacity={0.6}
                r={4}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}