/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 다크 모드 활성화
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dashdark 테마 색상 팔레트
        dashdark: {
          bg: '#0B0E14',       // 메인 배경 (아주 어두운 네이비)
          sidebar: '#151923',  // 사이드바/헤더 배경
          card: '#1E2330',     // 카드 배경
          border: '#2A303F',   // 테두리 선 색상
          hover: '#252A38',    // 호버 상태 배경
          text: '#E2E8F0',     // 기본 텍스트 (밝은 회색)
          muted: '#94A3B8',    // 보조 텍스트
          accent: '#8B5CF6',   // 포인트 컬러 (보라색)
        },
        // 기존 Shadcn UI 색상 변수 연결
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}