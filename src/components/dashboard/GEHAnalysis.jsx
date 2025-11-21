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

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold drop-shadow-md">
      {value}
    </text>
  );
};

export default function GEHAnalysis({ trafficData }) {
  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm h-full flex justify-center items-center">
        <div className="text-slate-400 dark:text-slate-600 text-sm">데이터 없음</div>
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

  const pieData = Object.entries(gehDistribution).filter(([, value]) => value > 0).map(([name, value]) => ({ name, value }));
  const meanObserved = gehData.reduce((sum, d) => sum + d.observed, 0) / gehData.length;
  const ssTot = gehData.reduce((sum, d) => sum + Math.pow(d.observed - meanObserved, 2), 0);
  const ssRes = gehData.reduce((sum, d) => sum + Math.pow(d.observed - d.simulated, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col h-full">
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border shrink-0">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" /> GEH 분포
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius="80%" fill="#8884d8" dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={GEH_COLORS[entry.name]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }} itemStyle={{ color: '#1e293b' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-dashdark-card border-slate-200 dark:border-dashdark-border shadow-sm flex flex-col h-full">
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-dashdark-border shrink-0">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> R² 적합도
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
           <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800/30 text-center shrink-0">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{rSquared.toFixed(4)}</span>
           </div>
           <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A303F" />
                  <XAxis type="number" dataKey="observed" name="실제" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <YAxis type="number" dataKey="simulated" name="시뮬" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={{ stroke: '#475569' }} tickLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#e2e8f0', borderRadius: '8px', color: '#1e293b' }} itemStyle={{ color: '#1e293b' }} />
                  <Scatter data={gehData} fill="rgb(139, 92, 246)" fillOpacity={0.6} r={4} />
                </ScatterChart>
              </ResponsiveContainer>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}