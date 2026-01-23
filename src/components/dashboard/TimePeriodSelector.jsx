import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const generateTimePeriods = () => {
  const periods = [];
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
      periods.push({ value, label: value });
    });
  });
  return periods;
};

const TIME_DATA = generateTimePeriods();

export default function TimePeriodSelector({ value, onChange, availableTimePeriods, disabled }) {
  const { t } = useLanguage();

  const timePeriods = useMemo(() => {
    const baseLabel = t('allTime');
    if (!availableTimePeriods || availableTimePeriods.length === 0) {
      return [{ value: 'all', label: baseLabel }, ...TIME_DATA];
    }
    return [
      { value: 'all', label: `${baseLabel} (${availableTimePeriods.length}${t('periodsCount')})` },
      ...TIME_DATA.filter(period => availableTimePeriods.includes(period.value))
    ];
  }, [availableTimePeriods, t]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 px-1">
        <Clock className="w-4 h-4 text-cyan-600 dark:text-violet-400" />
        <span className="text-xs font-medium text-slate-700 dark:text-dashdark-text">
          {t('selectTime')}
        </span>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full h-9 text-sm border-slate-300 dark:border-dashdark-border bg-white dark:bg-dashdark-bg text-slate-900 dark:text-white">
          <SelectValue placeholder={disabled ? t('selectIntersectionFirst') : t('selectTime')} />
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