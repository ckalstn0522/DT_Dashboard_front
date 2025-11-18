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

export default function GEHAnalysis({ trafficData }) {
  if (!trafficData || trafficData.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">GEH 통계 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-400">
            교차로를 선택해주세요
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

  // Calculate R-squared
  const meanObserved = gehData.reduce((sum, d) => sum + d.observed, 0) / gehData.length;
  const ssTot = gehData.reduce((sum, d) => sum + Math.pow(d.observed - meanObserved, 2), 0);
  const ssRes = gehData.reduce((sum, d) => sum + Math.pow(d.observed - d.simulated, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            GEH 분포
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${value}개 (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GEH_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {Object.entries(gehDistribution).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: GEH_COLORS[category] }}
                  />
                  <span className="text-xs text-slate-600">{category}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{count}개</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            R² 적합도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {rSquared.toFixed(4)}
              </div>
              <div className="text-sm text-slate-600">R-Squared 값</div>
              <div className="text-xs text-slate-500 mt-2">
                {rSquared > 0.9 ? '매우 우수한 적합도' : 
                 rSquared > 0.7 ? '우수한 적합도' : 
                 rSquared > 0.5 ? '양호한 적합도' : '개선 필요'}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="observed" 
                name="실제 교통량"
                label={{ value: '실제 교통량', position: 'bottom', style: { fontSize: 12 } }}
              />
              <YAxis 
                type="number" 
                dataKey="simulated" 
                name="시뮬레이션 교통량"
                label={{ value: '시뮬레이션', angle: -90, position: 'left', style: { fontSize: 12 } }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                data={gehData} 
                fill="rgb(99, 102, 241)"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}