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

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
  // 라벨 위치 계산 생략 (기존 동일)
  return null; // HUD 공간 확보를 위해 차트 내부 라벨은 숨김 (Tooltip 활용)
};

export default function GEHAnalysis({ trafficData, compact = false }) {
  // 카드 스타일 분기 처리
  const cardStyle = compact 
    ? "bg-slate-950/90 backdrop-blur-md border-slate-800/80 shadow-2xl" 
    : "bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm";

  const titleStyle = compact ? "text-slate-100 text-sm" : "text-slate-900 dark:text-white text-base";
  const iconColor = compact ? "text-cyan-400" : "text-amber-500";

  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className={`${cardStyle} h-full flex justify-center items-center`}>
        <div className="text-slate-400 text-sm">데이터 없음</div>
      </Card>
    );
  }

  const gehData = trafficData.map(data => {
    const geh = calculateGEH(data.vehs || 0, data.소계_대 || 0);
    return { geh, simulated: data.vehs || 0, observed: data.소계_대 || 0 };
  });

  const gehDistribution = {
    'GEH ≤ 5 (우수)': gehData.filter(d => d.geh <= 5).length,
    '5 < GEH ≤ 10 (양호)': gehData.filter(d => d.geh > 5 && d.geh <= 10).length,
    'GEH > 10 (불량)': gehData.filter(d => d.geh > 10).length,
  };

  const pieData = Object.entries(gehDistribution).filter(([, value]) => value > 0).map(([name, value]) => ({ name, value }));
  const meanObserved = gehData.reduce((sum, d) => sum + d.observed, 0) / gehData.length;
  const ssTot = gehData.reduce((sum, d) => sum + Math.pow(d.observed - meanObserved, 2), 0);
  const ssRes = gehData.reduce((sum, d) => sum + Math.pow(d.observed - d.simulated, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return (
    <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'} h-full`}>
      
      {/* GEH 분포 */}
      <Card className={`${cardStyle} flex flex-col h-full overflow-hidden`}>
        <CardHeader className={`border-b border-slate-100 dark:border-slate-700/30 shrink-0 ${compact ? 'py-3 px-4' : 'py-4 px-6'}`}>
          <CardTitle className={`${titleStyle} font-bold flex items-center gap-2`}>
            <Activity className={`w-4 h-4 ${iconColor}`} /> GEH 분포
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={compact ? 30 : 40} outerRadius={compact ? 50 : 70} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={GEH_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(20,20,30,0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '10px', color: compact ? '#cbd5e1' : '#64748b' }} layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* R-Squared */}
      <Card className={`${cardStyle} flex flex-col h-full overflow-hidden`}>
        <CardHeader className={`border-b border-slate-100 dark:border-slate-700/30 shrink-0 ${compact ? 'py-3 px-4' : 'py-4 px-6'}`}>
          <CardTitle className={`${titleStyle} font-bold flex items-center gap-2`}>
            <TrendingUp className={`w-4 h-4 ${compact ? 'text-green-400' : 'text-green-500'}`} /> R² 적합도
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
           <div className={`mb-2 p-2 rounded border text-center shrink-0 ${compact ? 'bg-green-900/20 border-green-800/30' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30'}`}>
              <span className={`text-2xl font-bold ${compact ? 'text-green-400' : 'text-green-600 dark:text-green-400'}`}>{rSquared.toFixed(4)}</span>
           </div>
           <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={compact ? "#334155" : "#e2e8f0"} />
                  <XAxis type="number" dataKey="observed" name="실제" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="simulated" name="시뮬" tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(20,20,30,0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Scatter data={gehData} fill="rgb(139, 92, 246)" fillOpacity={0.6} r={3} />
                </ScatterChart>
              </ResponsiveContainer>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}