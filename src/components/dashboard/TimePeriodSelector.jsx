import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from 'lucide-react';

// 15분 간격으로 시간대 생성
const generateTimePeriods = () => {
  const periods = [{ value: 'all', label: '전체 시간대' }];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  hours.forEach(hour => {
    ['00', '15', '30', '45'].forEach(minute => {
      const startHour = hour.toString().padStart(2, '0');
      const startMinute = minute;
      
      let endHour = hour;
      let endMinute = parseInt(minute) + 15;
      
      if (endMinute === 60) {
        endMinute = 0;
        endHour = (hour + 1) % 24;
      }
      
      const endHourStr = endHour.toString().padStart(2, '0');
      const endMinuteStr = endMinute.toString().padStart(2, '0');
      
      const value = `${startHour}:${startMinute}-${endHourStr}:${endMinuteStr}`;
      const label = value;
      
      periods.push({ value, label });
    });
  });
  
  return periods;
};

const ALL_TIME_PERIODS = generateTimePeriods();

export default function TimePeriodSelector({ value, onChange, availableTimePeriods, disabled }) {
  const timePeriods = useMemo(() => {
    if (!availableTimePeriods || availableTimePeriods.length === 0) {
      return ALL_TIME_PERIODS;
    }
    
    // 사용 가능한 시간대만 필터링
    return [
      { value: 'all', label: `전체 시간대 (${availableTimePeriods.length}개)` },
      ...ALL_TIME_PERIODS.filter(period => 
        period.value === 'all' || availableTimePeriods.includes(period.value)
      ).filter(period => period.value !== 'all')
    ];
  }, [availableTimePeriods]);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-cyan-600 dark:text-violet-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-white">시간대</span>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        {/* SelectTrigger 스타일은 components/ui/select.jsx에서 이미 다크모드 적용됨 */}
        <SelectTrigger className="w-52 border-slate-300 dark:border-dashdark-border">
          <SelectValue placeholder={disabled ? "교차로를 먼저 선택하세요" : "시간대 선택"} />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {timePeriods.map(period => (
            <SelectItem key={period.value} value={period.value}>
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}