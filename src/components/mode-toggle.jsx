import React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      className="rounded-full hover:bg-slate-100 dark:hover:bg-dashdark-hover"
    >
      {theme === 'dark' ? (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all text-violet-400" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all text-orange-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}