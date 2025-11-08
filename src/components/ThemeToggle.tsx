import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { Sun, Moon, Monitor } from 'lucide-react';
interface ThemeToggleProps {
  className?: string;
}
export function ThemeToggle({ className = "relative" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };
  return (
    <Button
      onClick={cycleTheme}
      variant="ghost"
      size="icon"
      className={className}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {theme === 'system' && (
        <Monitor className="absolute h-[1.2rem] w-[1.2rem] scale-100" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}