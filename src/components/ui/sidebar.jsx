import React, { createContext, useContext, useState } from "react";
import { PanelLeft } from "lucide-react";

const SidebarContext = createContext({ open: true, setOpen: () => {} });

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }) {
  return <div className={`flex flex-col w-64 bg-white border-r ${className}`}>{children}</div>;
}

export function SidebarHeader({ className, children }) {
  return <div className={className}>{children}</div>;
}

export function SidebarContent({ className, children }) {
  return <div className={`flex-1 overflow-auto ${className}`}>{children}</div>;
}

export function SidebarGroup({ className, children }) {
  return <div className={className}>{children}</div>;
}

export function SidebarGroupLabel({ className, children }) {
  return <div className={className}>{children}</div>;
}

export function SidebarGroupContent({ children }) {
  return <div>{children}</div>;
}

export function SidebarMenu({ children }) {
  return <ul className="space-y-1">{children}</ul>;
}

export function SidebarMenuItem({ children }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ asChild, className, children }) {
  const Comp = asChild ? React.Fragment : "button";
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function SidebarTrigger({ className }) {
  const { open, setOpen } = useContext(SidebarContext);
  return (
    <button onClick={() => setOpen(!open)} className={className}>
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}