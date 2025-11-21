import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom"; // ▼▼▼ [추가] Portal 사용

export function Popover({ children }) {
  const [open, setOpen] = useState(false);
  // 트리거 요소의 위치를 저장할 ref
  const triggerRef = useRef(null);

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { open, setOpen, triggerRef });
    }
    return child;
  });
  return <div className="relative inline-block w-full">{childrenWithProps}</div>;
}

export function PopoverTrigger({ asChild, children, open, setOpen, triggerRef, ...props }) {
  const handleClick = () => setOpen(!open);
  
  // ref 연결
  const mergedRef = (node) => {
    if (triggerRef) triggerRef.current = node;
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { 
      onClick: handleClick, 
      ref: mergedRef,
      ...props 
    });
  }
  return (
    <button type="button" onClick={handleClick} ref={mergedRef} {...props}>
      {children}
    </button>
  );
}

export function PopoverContent({ className, align = "center", children, open, setOpen, triggerRef, ...props }) {
  const contentRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // ▼▼▼ [수정] 팝오버 위치 계산 (화면 밖으로 나가지 않도록 조정) ▼▼▼
  useEffect(() => {
    if (open && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      
      let top = triggerRect.bottom + window.scrollY + 5; // 기본: 아래쪽 표시
      let left = triggerRect.left + window.scrollX;      // 기본: 왼쪽 정렬

      // 화면 아래로 넘치면 위로 표시
      if (top + contentRect.height > window.innerHeight + window.scrollY) {
        top = triggerRect.top + window.scrollY - contentRect.height - 5;
      }

      // align="center"일 때 중앙 정렬
      if (align === "center") {
        left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2) + window.scrollX;
      }

      setPosition({ top, left });
    }
  }, [open, triggerRef, align]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        contentRef.current && !contentRef.current.contains(event.target) &&
        triggerRef.current && !triggerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // 스크롤 시 닫기 (선택 사항)
      // window.addEventListener("scroll", () => setOpen(false), true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // window.removeEventListener("scroll", () => setOpen(false), true);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  // ▼▼▼ [수정] Portal을 사용하여 document.body에 직접 렌더링 (z-index 최상위 보장) ▼▼▼
  return createPortal(
    <div
      ref={contentRef}
      className={`fixed z-[9999] w-72 rounded-md border border-slate-200 dark:border-dashdark-border bg-white dark:bg-dashdark-card text-slate-950 dark:text-white p-4 shadow-xl outline-none animate-in fade-in-80 zoom-in-95 ${className}`}
      style={{ 
        top: position.top, 
        left: position.left,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
}