import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider";

import Dashboard from './pages/Dashboard';
import Layout from './Layout';
import RoutePlanning from './pages/RoutePlanning';
import Comparison from './pages/Comparison';
import CombinedHUD from './pages/hud/CombinedHUD';
import LeftMap from './pages/hud/LeftMap';
import RightCharts from './pages/hud/RightCharts';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            {/* 웹 브라우저용 (Layout 포함) */}
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/routeplanning" element={<Layout><RoutePlanning /></Layout>} />
            <Route path="/comparison" element={<Layout><Comparison /></Layout>} />

            {/* Unity HUD용 (전체화면, Layout 없음) */}
            <Route path="/hud" element={<CombinedHUD />} />
            <Route path="/hud/left" element={<LeftMap />} />
            <Route path="/hud/right" element={<RightCharts />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;