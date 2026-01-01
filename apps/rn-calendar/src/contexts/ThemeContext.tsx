import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, getThemeById, darkModeColors, type ThemeId, type Theme, type ThemeColors } from '../theme/themes';

const THEME_STORAGE_KEY = '@daymate/theme';

interface ThemeContextType {
    theme: Theme;
    themeId: ThemeId;
    isDarkMode: boolean;
    colors: ThemeColors;
    setTheme: (themeId: ThemeId) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useColorScheme();
    const isDarkMode = systemColorScheme === 'dark';

    const [themeId, setThemeId] = useState<ThemeId>('blue');
    const [theme, setThemeState] = useState<Theme>(getThemeById('blue'));

    // 初始化主题
    useEffect(() => {
        (async () => {
            try {
                const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedThemeId) {
                    const loadedTheme = getThemeById(savedThemeId);
                    setThemeId(savedThemeId as ThemeId);
                    setThemeState(loadedTheme);
                }
            } catch (error) {
                console.error('Failed to load theme:', error);
            }
        })();
    }, []);

    // 切换主题
    const setTheme = useCallback(async (newThemeId: ThemeId) => {
        try {
            const newTheme = getThemeById(newThemeId);
            setThemeId(newThemeId);
            setThemeState(newTheme);
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeId);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }, []);

    // 根据深色模式调整颜色
    const colors: ThemeColors = isDarkMode
        ? {
            ...theme.colors,
            ...darkModeColors,
        }
        : theme.colors;

    const value: ThemeContextType = {
        theme,
        themeId,
        isDarkMode,
        colors,
        setTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
