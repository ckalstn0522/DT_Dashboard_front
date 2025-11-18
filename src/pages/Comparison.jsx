import React from "react";
// ▼▼▼ [수정됨] base44 -> axios 임포트 ▼▼▼
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { GitCompare, TrendingDown, TrendingUp, Activity, Clock } from 'lucide-react';
// ▼▼▼ [수정됨] Skeleton 임포트 추가 ▼▼▼
import { Skeleton } from "@/components/ui/skeleton";
// ▲▲▲ [수정됨] ▲▲▲

// API 서버 주소
const API_URL = 'http://localhost:3001/api';

export default function Comparison() {
  // ▼▼▼ [수정됨] base44 -> axios로 API 호출 변경 ▼▼▼
  const { data: comparisons, isLoading } = useQuery({
    queryKey: ['simulationcomparison'], // API 서버의 경로
    queryFn: () => axios.get(`${API_URL}/simulationcomparison`).then(res => res.data),
    initialData: [],
  });
  // ▲▲▲ [수정됨] ▲▲▲

  const baseData = comparisons.find(c => c.scenario_name === 'Base') || {};
  const optionData = comparisons.find(c => c.scenario_name === 'Option') || {};

  const metrics = [
    { key: 'total_volume', label: '총 교통량', unit: '대', icon: Activity },
    { key: 'unserved_vehicles', label: '미진입 차량', unit: '대', icon: TrendingDown },
    { key: 'avg_speed', label: '평균 속도', unit: 'km/h', icon: TrendingUp },
    { key: 'avg_delay', label: '평균 지체시간', unit: '초', icon: Clock },
    { key: 'avg_travel_time', label: '평균 통행시간', unit: '초', icon: Clock },
    { key: 'total_distance', label: '총 주행거리', unit: 'km', icon: Activity },
  ];

  const comparisonData = metrics.map(metric => ({
    metric: metric.label,
    Base: baseData[metric.key] || 0,
    Option: optionData[metric.key] || 0,
    improvement: baseData[metric.key] 
      ? (((baseData[metric.key] - optionData[metric.key]) / baseData[metric.key]) * 100).toFixed(1)
      : 0
  }));

  const radarData = [
    { subject: '교통량', Base: 80, Option: 85 },
    { subject: '속도', Base: 70, Option: 82 },
    { subject: '지체시간', Base: 60, Option: 75 },
    { subject: '효율성', Base: 65, Option: 88 },
    { subject: '안정성', Base: 75, Option: 90 },
  ];

  const calculateDifference = (base, option) => {
    if (!base) return 0;
    return ((option - base) / base * 100).toFixed(1);
  };

  // ▼▼▼ [수정됨] 로딩 스켈레톤 UI 추가 ▼▼▼
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }
  // ▲▲▲ [수정됨] ▲▲▲

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
            시뮬레이션 비교 분석
          </h1>
          <p className="text-slate-600 mt-1">Base 모델과 Option 모델의 성능 비교</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map(metric => {
            const Icon = metric.icon;
            const baseValue = baseData[metric.key] || 0;
            const optionValue = optionData[metric.key] || 0;
            const diff = calculateDifference(baseValue, optionValue);
            const isImprovement = metric.key === 'unserved_vehicles' || metric.key === 'avg_delay' || metric.key === 'avg_travel_time'
              ? diff < 0
              : diff > 0;

            return (
              <Card key={metric.key} className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500">Base</span>
                      <span className="text-lg font-bold text-slate-700">
                        {baseValue.toLocaleString()} {metric.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500">Option</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {optionValue.toLocaleString()} {metric.unit}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 pt-2 border-t ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                      {isImprovement ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-semibold">
                        {Math.abs(diff)}% {isImprovement ? '개선' : '감소'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-cyan-600" />
                주요 지표 비교
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="metric" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Base" fill="rgb(148, 163, 184)" name="Base 모델" />
                  <Bar dataKey="Option" fill="rgb(99, 102, 241)" name="Option 모델" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                종합 성능 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" style={{ fontSize: '14px' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Base 모델" 
                    dataKey="Base" 
                    stroke="rgb(148, 163, 184)" 
                    fill="rgb(148, 163, 184)" 
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                  <Radar 
                    name="Option 모델" 
                    dataKey="Option" 
                    stroke="rgb(99, 102, 241)" 
                    fill="rgb(99, 102, 241)" 
                    fillOpacity={0.5}
                    strokeWidth={2}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">개선 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg">
                <div className="text-sm text-slate-600 mb-2">주요 개선 사항</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>미진입 차량 감소로 교통 흐름 개선</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>평균 속도 향상으로 통행 시간 단축</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>지체시간 감소로 효율성 증대</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <div className="text-sm text-slate-600 mb-2">권장 사항</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span>Option 모델 적용 검토 필요</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span>추가 시뮬레이션으로 검증 강화</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span>실제 도로 환경에서의 테스트 권장</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}