"use client";

import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="theme-switcher">
      {themeOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          className={`theme-option ${theme === value ? "active" : ""}`}
          onClick={() => setTheme(value)}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
