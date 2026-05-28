"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-7 w-20 rounded-md border border-foreground/15 bg-foreground/[0.03]"
        aria-hidden
      />
    );
  }

  return (
    <label className="text-xs text-foreground/60">
      <span className="sr-only">Theme</span>
      <select
        value={theme ?? "system"}
        onChange={(e) => setTheme(e.target.value)}
        className="rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-xs hover:bg-foreground/5 focus:border-foreground/40 focus:outline-none"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
