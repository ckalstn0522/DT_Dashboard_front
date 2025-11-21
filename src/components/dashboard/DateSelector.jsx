import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function DateSelector({ value, onChange, availableDates, disabled }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
      setOpen(false);
    }
  };

  const handleAllDates = () => {
    onChange('all');
    setOpen(false);
  };

  const disabledDates = (date) => {
    if (!availableDates || availableDates.length === 0) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return !availableDates.includes(dateStr);
  };

  return (
    // ▼▼▼ [수정] 사이드바용 스타일: w-full, flex-col(라벨 위로) 또는 유지
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 px-1">
        <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-violet-400" />
        <span className="text-xs font-medium text-slate-700 dark:text-dashdark-text">날짜 선택</span>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            // ▼▼▼ [수정] w-52 -> w-full (꽉 차게)
            className="w-full justify-start text-left font-normal text-sm h-9 bg-white dark:bg-dashdark-bg border-slate-300 dark:border-dashdark-border text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dashdark-hover"
          >
            {disabled ? (
              <span className="text-slate-400 dark:text-slate-500 truncate">교차로 선택 필요</span>
            ) : value === 'all' ? (
              <span>전체 날짜</span>
            ) : (
              <span>{format(new Date(value), 'yyyy-MM-dd')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-slate-200 dark:border-dashdark-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-dashdark-hover"
              onClick={handleAllDates}
            >
              전체 날짜
              {availableDates && availableDates.length > 0 && (
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                  ({availableDates.length}일)
                </span>
              )}
            </Button>
          </div>
          <Calendar
            mode="single"
            selected={value !== 'all' ? new Date(value) : undefined}
            onSelect={handleSelect}
            disabled={disabledDates}
            initialFocus
            locale={ko}
            className="rounded-md"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}