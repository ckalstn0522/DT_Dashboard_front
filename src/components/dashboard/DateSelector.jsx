import React, { useState, useMemo } from 'react';
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

  // 사용 가능한 날짜만 활성화
  const disabledDates = (date) => {
    if (!availableDates || availableDates.length === 0) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return !availableDates.includes(dateStr);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-indigo-600" />
        <span className="text-sm font-medium text-slate-700">날짜</span>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-52 justify-start text-left font-normal bg-white border-slate-300"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {disabled ? (
              <span className="text-slate-400">교차로를 먼저 선택하세요</span>
            ) : value === 'all' ? (
              <span>전체 날짜</span>
            ) : (
              <span>{format(new Date(value), 'PPP', { locale: ko })}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={handleAllDates}
            >
              전체 날짜
              {availableDates && availableDates.length > 0 && (
                <span className="ml-auto text-xs text-slate-500">
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