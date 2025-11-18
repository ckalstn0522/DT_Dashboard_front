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
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">차종 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-400">
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
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <Car className="w-5 h-5 text-cyan-600" />
          차종 분포
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value.toLocaleString() + '대'} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          {dataWithPercentage.map(item => {
            const Icon = iconMap[item.name];
            return (
              <div key={item.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div 
                  className="p-2 rounded-lg" 
                  style={{ backgroundColor: COLORS[item.name] + '20' }}
                >
                  <Icon className="w-5 h-5" style={{ color: COLORS[item.name] }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.percentage}%</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{item.value.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">대</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-gradient-to-r from-cyan-50 to-indigo-50 rounded-lg border border-cyan-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">총 교통량</span>
            <span className="text-xl font-bold text-indigo-700">{total.toLocaleString()}대</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}