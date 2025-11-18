import React, { useState, useEffect, useMemo } from "react";
import axios from 'axios';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

import IntersectionMap from "../components/dashboard/IntersectionMap";
import VehicleTypeChart from "../components/dashboard/VehicleTypeChart";
import TrafficVolumeDisplay from "../components/dashboard/TrafficVolumeDisplay";
import GEHAnalysis from "../components/dashboard/GEHAnalysis";
import TimePeriodSelector from "../components/dashboard/TimePeriodSelector";
import DateSelector from "../components/dashboard/DateSelector";

const API_URL = 'http://localhost:3001/api';

export default function Dashboard() {
  const [selectedIntersection, setSelectedIntersection] = useState(null);
  const [timePeriod, setTimePeriod] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  const { data: intersections, isLoading: isLoadingIntersections } = useQuery({
    queryKey: ['intersections'],
    queryFn: () => axios.get(`${API_URL}/intersections`).then(res => res.data),
    initialData: [],
  });

  const { data: allTrafficData, isLoading: isLoadingTraffic } = useQuery({
    queryKey: ['trafficData'],
    queryFn: () => axios.get(`${API_URL}/trafficdata`).then(res => res.data),
    initialData: [],
  });

  const { availableDates, availableTimePeriods } = useMemo(() => {
    if (!selectedIntersection) {
      return { availableDates: [], availableTimePeriods: [] };
    }
    const intersectionData = allTrafficData.filter(
      data => String(data.intersection_id) === String(selectedIntersection.intersection_id)
    );
    const dates = [...new Set(intersectionData.map(d => d.date).filter(Boolean))].sort();
    const times = [...new Set(intersectionData.map(d => d.time_period).filter(Boolean))].sort();
    return { availableDates: dates, availableTimePeriods: times };
  }, [selectedIntersection, allTrafficData]);

  useEffect(() => {
    if (selectedIntersection) {
      setTimePeriod('all');
      setSelectedDate('all');
    }
  }, [selectedIntersection?.intersection_id]);

  const filteredTrafficData = useMemo(() => {
    if (!selectedIntersection) return [];
    return allTrafficData.filter(data => {
      const matchesIntersection = String(data.intersection_id) === String(selectedIntersection.intersection_id);
      const matchesTime = timePeriod === 'all' || data.time_period === timePeriod;
      const matchesDate = selectedDate === 'all' || data.date === selectedDate;
      return matchesIntersection && matchesTime && matchesDate;
    });
  }, [selectedIntersection, allTrafficData, timePeriod, selectedDate]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
              교차로 교통량 분석
            </h1>
            <p className="text-slate-600 mt-1">연구 범위 내 교차로 데이터 시각화</p>
          </div>
          
          {/* // 👇👇 1. 필터 카드: z-20 (가장 높게) 
          */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-md relative z-20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <DateSelector 
                  value={selectedDate} 
                  onChange={setSelectedDate}
                  availableDates={availableDates}
                  disabled={!selectedIntersection}
                />
                <div className="h-8 w-px bg-slate-300 hidden md:block" />
                <TimePeriodSelector 
                  value={timePeriod} 
                  onChange={setTimePeriod}
                  availableTimePeriods={availableTimePeriods}
                  disabled={!selectedIntersection}
                />
              </div>
              {selectedIntersection && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700">
                    💡 <strong>{selectedIntersection.intersection_name}</strong>에서 사용 가능: 
                    <strong> {availableDates.length}일</strong>, 
                    <strong> {availableTimePeriods.length}개 시간대</strong>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* // 👇👇 2. 정보 패널: z-10 (중간) 
        */}
        <Alert className="bg-slate-50 border-slate-300 relative z-10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="text-xs space-y-1">
              <div>📊 <strong>총 교차로:</strong> {intersections.length}개</div>
              <div>📊 <strong>총 교통 데이터:</strong> {allTrafficData.length}개</div>
              <div>✅ <strong>필터링된 데이터:</strong> {filteredTrafficData.length}개</div>
              {selectedIntersection && (
                <>
                  <div>🎯 <strong>선택된 교차로 ID:</strong> {selectedIntersection.intersection_id}</div>
                  <div>📅 <strong>사용 가능한 날짜:</strong> {availableDates.join(', ') || '없음'}</div>
                  <div>⏰ <strong>사용 가능한 시간대:</strong> {availableTimePeriods.length}개</div>
                </>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* // 👇👇 3. 메인 레이아웃(지도): z-0 (가장 낮게) 
        */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative z-0">
          {/* Map Section */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white">
                <CardTitle>연구 범위 맵</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  {isLoadingIntersections ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <div className="text-slate-400">지도 데이터를 불러오는 중...</div>
                    </div>
                  ) : (
                    <IntersectionMap
                      intersections={intersections}
                      onSelectIntersection={setSelectedIntersection}
                      selectedIntersectionId={selectedIntersection?.intersection_id}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* GEH Analysis */}
            <GEHAnalysis trafficData={filteredTrafficData} />
          </div>

          {/* Right Panel - Intersection Details */}
          <div className="space-y-6">
            {/* Intersection Info */}
            <Card className="bg-gradient-to-br from-white to-cyan-50 border-cyan-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-600" />
                  선택된 교차로
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedIntersection ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {selectedIntersection.intersection_name}
                      </div>
                      <div className="text-sm text-slate-600">
                        교차로 번호: {selectedIntersection.intersection_id}
                      </div>
                      <div className="text-sm text-slate-600">
                        신호 페이즈: {selectedIntersection.phase_count || 'N/A'}개
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        위도: {selectedIntersection.latitude?.toFixed(6)}° / 
                        경도: {selectedIntersection.longitude?.toFixed(6)}°
                      </div>
                    </div>

                    {selectedIntersection.intersection_image && (
                      <div className="relative bg-slate-100 rounded-lg p-2">
                        <img
                          src={selectedIntersection.intersection_image}
                          alt={selectedIntersection.intersection_name}
                          className="w-full h-48 object-contain rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Filter Info */}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">선택된 날짜:</span>
                          <span className="font-semibold text-slate-900">
                            {selectedDate === 'all' ? '전체' : selectedDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">선택된 시간대:</span>
                          <span className="font-semibold text-slate-900">
                            {timePeriod === 'all' ? '전체' : timePeriod}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">데이터 개수:</span>
                          <span className={`font-semibold ${filteredTrafficData.length > 0 ? 'text-cyan-700' : 'text-red-600'}`}>
                            {filteredTrafficData.length}개
                          </span>
                        </div>
                      </div>
                    </div>

                    {filteredTrafficData.length === 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          선택한 필터에 해당하는 데이터가 없습니다.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>지도에서 교차로를 선택해주세요</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle Type Distribution */}
            <VehicleTypeChart trafficData={filteredTrafficData} />
          </div>
        </div>

        {/* Traffic Volume Section */}
        <TrafficVolumeDisplay 
          trafficData={filteredTrafficData}
          intersectionImage={selectedIntersection?.intersection_image}
        />
      </div>
    </div>
  );
}