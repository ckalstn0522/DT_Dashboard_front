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
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

export function SelectValue({ placeholder, className }) {
  const { value } = useContext(SelectContext);
  // 자식 컴포넌트에서 선택된 텍스트를 찾기 위한 단순화된 로직
  return <span className={className}>{value || placeholder}</span>;
}

export function SelectContent({ className, children, ...props }) {
  const { open, setOpen } = useContext(SelectContext);
  const ref = useRef(null);

  // 외부 클릭 시 닫기
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
    <div ref={ref} className={`absolute z-[1000] mt-1 max-h-60 w-full min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-md animate-in fade-in-80 ${className}`} {...props}>
      <div className="p-1">{children}</div>
    </div>
  );
}

export function SelectItem({ value, children, className, ...props }) {
  const { handleSelect } = useContext(SelectContext);
  return (
    <div
      onClick={() => handleSelect(value)}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-900 cursor-pointer ${className}`}
      {...props}
    >
      <span className="truncate">{children}</span>
    </div>
  );
}