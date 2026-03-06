"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "our-memories-theme";

function applyThemeClass(t: Theme) {
    const root = document.documentElement;
    root.classList.toggle("light", t === "light");
    root.classList.toggle("dark", t === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");

    // Sync theme from localStorage after hydration
    // eslint-disable-next-line react-compiler/react-compiler
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
            setTheme(stored);
            applyThemeClass(stored);
        }
    }, []);

    useEffect(() => {
        applyThemeClass(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === "dark" ? "light" : "dark");
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
}
