import React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-day-picker/dist/style.css"; 

export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`p-3 ${className}`}
      classNames={{
        // 기본 레이아웃 유지
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-slate-900 dark:text-white", // ▼▼▼ 캡션(월/년) 색상 수정
        nav: "space-x-1 flex items-center",
        // ▼▼▼ 네비게이션 버튼 스타일 수정 (다크모드 호버 대응)
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dashdark-hover rounded-md transition-colors flex items-center justify-center",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        // ▼▼▼ 요일 헤더 색상 수정
        head_cell: "text-slate-500 dark:text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        // ▼▼▼ 날짜 셀 스타일 수정
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-100 dark:[&:has([aria-selected])]:bg-dashdark-hover first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        // ▼▼▼ 날짜 버튼 스타일 수정 (글자색 흰색으로)
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 dark:hover:bg-dashdark-hover rounded-md transition-colors text-slate-900 dark:text-slate-200",
        // ▼▼▼ 선택된 날짜 스타일 (보라색 포인트)
        day_selected: "!bg-violet-600 !text-white hover:bg-violet-600 hover:text-white focus:bg-violet-600 focus:text-white",
        day_today: "bg-slate-100 dark:bg-dashdark-hover text-slate-900 dark:text-white",
        day_outside: "text-slate-500 opacity-50 dark:text-slate-400",
        day_disabled: "text-slate-500 opacity-50 dark:text-slate-400",
        day_range_middle: "aria-selected:bg-slate-100 dark:aria-selected:bg-dashdark-hover aria-selected:text-slate-900 dark:aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}