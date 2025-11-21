import React, { useState, useRef, useEffect } from "react";

export function Popover({ children }) {
  const [open, setOpen] = useState(false);
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { open, setOpen });
    }
    return child;
  });
  return <div className="relative inline-block">{childrenWithProps}</div>;
}

export function PopoverTrigger({ asChild, children, open, setOpen, ...props }) {
  const handleClick = () => setOpen(!open);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick, ...props });
  }
  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function PopoverContent({ className, align = "center", children, open, setOpen, ...props }) {
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
    <div
      ref={ref}
      // ▼▼▼ [수정] 배경색: bg-white -> bg-white dark:bg-dashdark-card
      // ▼▼▼ [수정] 테두리: border-slate-200 -> border-slate-200 dark:border-dashdark-border
      // ▼▼▼ [수정] 텍스트: dark:text-white 추가
      className={`absolute z-[1000] mt-2 w-72 rounded-md border border-slate-200 dark:border-dashdark-border bg-white dark:bg-dashdark-card text-slate-950 dark:text-white p-4 shadow-md outline-none ${className}`}
      style={{ left: align === "center" ? "50%" : "0", transform: align === "center" ? "translateX(-50%)" : "none" }}
      {...props}
    >
      {children}
    </div>
  );
}