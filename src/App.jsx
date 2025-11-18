import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 기존 페이지들
import Dashboard from './pages/Dashboard';
import Layout from './Layout';
import RoutePlanning from './pages/RoutePlanning';
import Comparison from './pages/Comparison';
import CombinedHUD from './pages/hud/CombinedHUD'; // 임포트 필수!
// ▼▼▼ [추가] HUD 전용 페이지 임포트 ▼▼▼
import LeftMap from './pages/hud/LeftMap';
import RightCharts from './pages/hud/RightCharts';
// ▲▲▲ [추가] ▲▲▲

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* 1. 웹 브라우저용 (사이드바 Layout 포함) */}
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/routeplanning" element={<Layout><RoutePlanning /></Layout>} />
          <Route path="/comparison" element={<Layout><Comparison /></Layout>} />

          {/* 2. Unity HUD용 (Layout 미포함 - 전체화면) */}
          {/* 유니티 웹뷰는 이 주소로 접속합니다. */}
          <Route path="/hud" element={<CombinedHUD />} />
          <Route path="/hud/left" element={<LeftMap />} />
          <Route path="/hud/right" element={<RightCharts />} />
          
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;