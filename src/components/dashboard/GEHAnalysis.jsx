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
          <div className="h-32 flex items-center justify-center text-slate-400">
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
    // [수정] Grid 제거 -> Flex Column으로 변경 (좁은 곳에서 1열 배치)
    <div className="flex flex-col gap-4">
      
      {/* 1. GEH 분포 파이 차트 */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-900 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-amber-600" />
            GEH 분포
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // 라벨 단순화
                label={({ value }) => `${value}`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GEH_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2 space-y-1">
            {Object.entries(gehDistribution).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-1.5 bg-slate-50 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: GEH_COLORS[category] }}
                  />
                  <span className="text-[10px] text-slate-600">{category}</span>
                </div>
                <span className="text-xs font-semibold text-slate-900">{count}개</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. R-Squared 적합도 */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-900 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            R² 적합도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="text-center">
              {/* [수정] 글자 크기 축소 (4xl -> 3xl) */}
              <div className="text-3xl font-bold text-green-700 mb-1">
                {rSquared.toFixed(4)}
              </div>
              <div className="text-xs text-slate-600">R-Squared 값</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="observed" 
                name="실제"
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                type="number" 
                dataKey="simulated" 
                name="시뮬"
                tick={{ fontSize: 10 }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                data={gehData} 
                fill="rgb(99, 102, 241)"
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