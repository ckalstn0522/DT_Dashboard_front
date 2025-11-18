import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css"; // 기본 스타일 사용

export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`p-3 ${className}`}
      {...props}
    />
  );
}