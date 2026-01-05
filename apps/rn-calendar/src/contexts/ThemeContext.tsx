import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, getThemeById, darkModeColors, type ThemeId, type Theme, type ThemeColors } from '../theme/themes';

const THEME_STORAGE_KEY = '@daymate/theme';
const COLOR_MODE_STORAGE_KEY = '@daymate/colorMode';

// 颜色模式类型：跟随系统、浅色、深色
export type ColorMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    themeId: ThemeId;
    isDarkMode: boolean;
    colors: ThemeColors;
    colorMode: ColorMode;
    setTheme: (themeId: ThemeId) => Promise<void>;
    setColorMode: (mode: ColorMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useColorScheme();

    const [themeId, setThemeId] = useState<ThemeId>('blue');
    const [theme, setThemeState] = useState<Theme>(getThemeById('blue'));
    const [colorMode, setColorModeState] = useState<ColorMode>('system');

    // 根据颜色模式确定是否为深色模式
    const isDarkMode = colorMode === 'system'
        ? systemColorScheme === 'dark'
        : colorMode === 'dark';

    // 初始化主题和颜色模式
    useEffect(() => {
        (async () => {
            try {
                const [savedThemeId, savedColorMode] = await Promise.all([
                    AsyncStorage.getItem(THEME_STORAGE_KEY),
                    AsyncStorage.getItem(COLOR_MODE_STORAGE_KEY),
                ]);
                if (savedThemeId) {
                    const loadedTheme = getThemeById(savedThemeId);
                    setThemeId(savedThemeId as ThemeId);
                    setThemeState(loadedTheme);
                }
                if (savedColorMode) {
                    setColorModeState(savedColorMode as ColorMode);
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

    // 切换颜色模式
    const setColorMode = useCallback(async (mode: ColorMode) => {
        try {
            setColorModeState(mode);
            await AsyncStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
        } catch (error) {
            console.error('Failed to save color mode:', error);
        }
    }, []);

    // 根据深色模式调整颜色
    const colors: ThemeColors = isDarkMode
        ? {
            ...theme.colors,
            ...darkModeColors,
            // 深色模式下应用主题专属的深色主题色
            ...theme.darkModeOverrides,
        }
        : theme.colors;

    const value: ThemeContextType = {
        theme,
        themeId,
        isDarkMode,
        colors,
        colorMode,
        setTheme,
        setColorMode,
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
