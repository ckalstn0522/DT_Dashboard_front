import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Route, GitCompare, BarChart3, Map } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import DateSelector from "@/components/dashboard/DateSelector";
import TimePeriodSelector from "@/components/dashboard/TimePeriodSelector";
import { useFilter } from "@/context/FilterContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "메인 대시보드", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
  { title: "경로 분석", url: createPageUrl("RoutePlanning"), icon: Route },
  { title: "시뮬레이션 비교", url: createPageUrl("Comparison"), icon: GitCompare },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { 
    selectedDate, setSelectedDate, 
    timePeriod, setTimePeriod, 
    availableDates, availableTimePeriods, 
    isSelectionEnabled 
  } = useFilter();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50 dark:bg-dashdark-bg transition-colors duration-300">
        
        <Sidebar className="hidden md:flex border-r border-slate-200 dark:border-dashdark-border bg-white dark:bg-dashdark-sidebar">
          <SidebarHeader className="border-b border-slate-200 dark:border-dashdark-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-dashdark-text text-lg tracking-tight">교통 데이터</h2>
                <p className="text-xs text-slate-500 dark:text-dashdark-muted">시각화 대시보드</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3 flex flex-col h-full">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-dashdark-muted uppercase tracking-wider px-3 py-2">
                Analytics
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`w-full block transition-all duration-200 rounded-xl mb-1 ${
                            isActive
                              ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400 font-semibold'
                              : 'text-slate-600 dark:text-dashdark-muted hover:bg-slate-100 dark:hover:bg-dashdark-hover'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3 w-full">
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-dashdark-muted'}`} />
                            <span>{item.title}</span>
                            {isActive && <div className="ml-auto w-1 h-4 bg-violet-500 rounded-full" />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupContent>
                <div className="mx-3 px-4 py-4 bg-slate-100 dark:bg-dashdark-card rounded-xl border border-slate-200 dark:border-dashdark-border">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-dashdark-text">연구 범위</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-dashdark-muted space-y-1 font-mono">
                    <div>NW: 36.673, 126.664</div>
                    <div>SE: 36.640, 126.688</div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-2">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-dashdark-muted uppercase tracking-wider px-3 py-2">
                Data Filter
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 space-y-4">
                  <DateSelector 
                    value={selectedDate} 
                    onChange={setSelectedDate}
                    availableDates={availableDates}
                    disabled={!isSelectionEnabled}
                  />
                  <TimePeriodSelector 
                    value={timePeriod} 
                    onChange={setTimePeriod}
                    availableTimePeriods={availableTimePeriods}
                    disabled={!isSelectionEnabled}
                  />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 border-t border-slate-200 dark:border-dashdark-border flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-dashdark-muted">테마 설정</span>
                <ModeToggle />
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden h-screen">
          <header className="bg-white/80 dark:bg-dashdark-sidebar/80 backdrop-blur-md border-b border-slate-200 dark:border-dashdark-border px-6 py-4 md:hidden shadow-sm flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 dark:hover:bg-dashdark-hover p-2 rounded-lg transition-colors duration-200 dark:text-dashdark-text" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                교통 데이터
              </h1>
            </div>
            <ModeToggle />
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}