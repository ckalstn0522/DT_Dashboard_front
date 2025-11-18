import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils"; // vite 설정 덕분에 @ 사용 가능
import { LayoutDashboard, Route, GitCompare, BarChart3, Map } from "lucide-react";
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
  {
    title: "메인 대시보드",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "경로 분석",
    url: createPageUrl("RoutePlanning"),
    icon: Route,
  },
  {
    title: "시뮬레이션 비교",
    url: createPageUrl("Comparison"),
    icon: GitCompare,
  },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Sidebar className="hidden md:flex border-r border-slate-200 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">교통 데이터</h2>
                <p className="text-xs text-slate-500">시각화 대시보드</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                분석 도구
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`w-full block hover:bg-gradient-to-r hover:from-cyan-50 hover:to-indigo-50 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md' 
                            : 'text-slate-700'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3 w-full">
                          <item.icon className={`w-5 h-5 ${location.pathname === item.url ? 'text-white' : 'text-slate-500'}`} />
                          <span className={`font-medium ${location.pathname === item.url ? 'text-white' : 'text-slate-700'}`}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupContent>
                <div className="mx-3 px-4 py-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-900">연구 범위</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>북서: 36.673°N, 126.664°E</div>
                    <div>남동: 36.640°N, 126.688°E</div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden h-screen">
          <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                교통 데이터 대시보드
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}