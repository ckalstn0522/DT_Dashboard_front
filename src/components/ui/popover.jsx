import React, { useState, useRef, useEffect } from "react";

export function Popover({ children }) {
  const [open, setOpen] = useState(false);
  // 자식 컴포넌트(Trigger, Content)에 상태 전달
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
      className={`absolute z-[1000] mt-2 w-72 rounded-md border border-slate-200 bg-white p-4 shadow-md outline-none ${className}`}
      style={{ left: align === "center" ? "50%" : "0", transform: align === "center" ? "translateX(-50%)" : "none" }}
      {...props}
    >
      {children}
    </div>
  );
}