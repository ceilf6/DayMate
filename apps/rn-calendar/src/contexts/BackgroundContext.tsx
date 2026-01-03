import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_STORAGE_KEY = '@daymate/background';

export interface BackgroundImage {
    uri: string;
    opacity: number; // 0-1 背景图片透明度
}

interface BackgroundContextType {
    backgroundImage: BackgroundImage | null;
    setBackgroundImage: (image: BackgroundImage | null) => Promise<void>;
    setBackgroundOpacity: (opacity: number) => Promise<void>;
    clearBackground: () => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextType | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
    const [backgroundImage, setBackgroundState] = useState<BackgroundImage | null>(null);

    // 初始化加载背景设置
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(BACKGROUND_STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved) as BackgroundImage;
                    setBackgroundState(parsed);
                }
            } catch (error) {
                console.error('Failed to load background:', error);
            }
        })();
    }, []);

    // 设置背景图片
    const setBackgroundImage = useCallback(async (image: BackgroundImage | null) => {
        try {
            setBackgroundState(image);
            if (image) {
                await AsyncStorage.setItem(BACKGROUND_STORAGE_KEY, JSON.stringify(image));
            } else {
                await AsyncStorage.removeItem(BACKGROUND_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to save background:', error);
        }
    }, []);

    // 设置背景透明度
    const setBackgroundOpacity = useCallback(async (opacity: number) => {
        if (!backgroundImage) return;
        const newImage = { ...backgroundImage, opacity };
        await setBackgroundImage(newImage);
    }, [backgroundImage, setBackgroundImage]);

    // 清除背景
    const clearBackground = useCallback(async () => {
        await setBackgroundImage(null);
    }, [setBackgroundImage]);

    const value: BackgroundContextType = {
        backgroundImage,
        setBackgroundImage,
        setBackgroundOpacity,
        clearBackground,
    };

    return <BackgroundContext.Provider value={value}>{children}</BackgroundContext.Provider>;
}

export function useBackground(): BackgroundContextType {
    const context = useContext(BackgroundContext);
    if (!context) {
        throw new Error('useBackground must be used within a BackgroundProvider');
    }
    return context;
}
