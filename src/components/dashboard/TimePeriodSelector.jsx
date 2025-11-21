import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from 'lucide-react';

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
    return [
      { value: 'all', label: `전체 시간대 (${availableTimePeriods.length}개)` },
      ...ALL_TIME_PERIODS.filter(period => 
        period.value === 'all' || availableTimePeriods.includes(period.value)
      ).filter(period => period.value !== 'all')
    ];
  }, [availableTimePeriods]);

  return (
    // ▼▼▼ [수정] 사이드바용 스타일: w-full, flex-col
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 px-1">
        <Clock className="w-4 h-4 text-cyan-600 dark:text-violet-400" />
        <span className="text-xs font-medium text-slate-700 dark:text-dashdark-text">시간대 선택</span>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        {/* ▼▼▼ [수정] w-52 -> w-full */}
        <SelectTrigger className="w-full h-9 text-sm border-slate-300 dark:border-dashdark-border bg-white dark:bg-dashdark-bg text-slate-900 dark:text-white">
          <SelectValue placeholder={disabled ? "교차로 선택 필요" : "시간대 선택"} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
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