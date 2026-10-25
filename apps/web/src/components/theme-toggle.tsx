'use client';

import { Moon, Sun } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export const THEME_STORAGE_KEY = 'theme';

const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_MS = 300;

/**
 * Swaps the `dark` class on <html>. A short-lived `theme-transition` class is
 * added so every themed surface cross-fades instead of snapping.
 */
export function toggleTheme() {
  const root = document.documentElement;
  const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';

  root.classList.add(TRANSITION_CLASS);
  root.classList.toggle('dark', nextTheme === 'dark');
  root.style.colorScheme = nextTheme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // storage can be unavailable (private mode) — the class change still applies
  }

  window.setTimeout(() => {
    root.classList.remove(TRANSITION_CLASS);
  }, TRANSITION_MS);
}

function ThemeIcons() {
  return (
    <span className="relative flex size-4 items-center justify-center">
      <Sun className="size-4 rotate-0 scale-100 transition-transform duration-300 ease-out dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-300 ease-out dark:rotate-0 dark:scale-100" />
    </span>
  );
}

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200',
        'hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      <ThemeIcons />
    </button>
  );
}

export function SidebarThemeToggle() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={toggleTheme} tooltip="Toggle theme">
        <ThemeIcons />
        <span>Theme</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
