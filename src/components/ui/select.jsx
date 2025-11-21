import React, { useState, createContext, useContext, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const SelectContext = createContext(null);

export function Select({ children, onValueChange, value, defaultValue }) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);

  const currentValue = value !== undefined ? value : internalValue;

  const handleSelect = (newValue) => {
    setInternalValue(newValue);
    if (onValueChange) onValueChange(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value: currentValue, handleSelect, open, setOpen }}>
      <div className="relative inline-block w-full text-left">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, ...props }) {
  const { open, setOpen } = useContext(SelectContext);
  
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      // ▼▼▼ [수정] 다크 모드 배경, 테두리, 텍스트 색상 추가
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-dashdark-border bg-white dark:bg-dashdark-card px-3 py-2 text-sm text-slate-900 dark:text-white ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder, className }) {
  const { value } = useContext(SelectContext);
  return <span className={className}>{value || placeholder}</span>;
}

export function SelectContent({ className, children, ...props }) {
  const { open, setOpen } = useContext(SelectContext);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div ref={ref} 
      // ▼▼▼ [수정] 드롭다운 배경색 및 테두리 다크 모드 적용
      className={`absolute z-[1000] mt-1 max-h-60 w-full min-w-[8rem] overflow-hidden rounded-md border border-slate-200 dark:border-dashdark-border bg-white dark:bg-dashdark-card text-slate-950 dark:text-white shadow-md animate-in fade-in-80 ${className}`} 
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

export function SelectItem({ value, children, className, ...props }) {
  const { handleSelect } = useContext(SelectContext);
  return (
    <div
      onClick={() => handleSelect(value)}
      // ▼▼▼ [수정] 호버 시 배경색 변경 (다크 모드 대응)
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-slate-100 dark:hover:bg-dashdark-hover focus:bg-slate-100 focus:text-slate-900 cursor-pointer ${className}`}
      {...props}
    >
      <span className="truncate">{children}</span>
    </div>
  );
}