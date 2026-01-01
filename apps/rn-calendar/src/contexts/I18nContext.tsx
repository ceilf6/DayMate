import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { initI18n, t as i18nT, changeLanguage as i18nChangeLanguage } from '@daymate/i18n';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCalendarLocale } from '../services/CalendarLocale';

export type Language = 'zh-CN' | 'zh-TW' | 'en';

const LANGUAGE_STORAGE_KEY = '@daymate/language';

interface I18nContextType {
    t: (key: string, defaultValueOrOptions?: string | any) => string;
    currentLanguage: Language;
    changeLanguage: (lang: Language) => Promise<void>;
    isReady: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * 获取系统默认语言
 */
function getDefaultLanguage(): Language {
    const locales = RNLocalize.getLocales();
    if (locales.length > 0) {
        const locale = locales[0].languageTag;
        if (locale.startsWith('zh')) {
            if (locale.includes('TW') || locale.includes('HK')) {
                return 'zh-TW';
            }
            return 'zh-CN';
        }
        return 'en';
    }
    return 'zh-CN';
}

/**
 * I18n Provider 组件
 * 包裹整个应用以提供全局国际化支持
 */
export function I18nProvider({ children }: { children: ReactNode }) {
    const [currentLang, setCurrentLang] = useState<Language>('zh-CN');
    const [isReady, setIsReady] = useState(false);
    // 强制重新渲染的计数器
    const [, setRenderKey] = useState(0);

    // 初始化
    useEffect(() => {
        (async () => {
            try {
                const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                const lang = (savedLang as Language) || getDefaultLanguage();
                initI18n(lang);
                setCalendarLocale(lang); // 同步设置日历语言
                setCurrentLang(lang);
                setIsReady(true);
            } catch (error) {
                console.error('Failed to initialize i18n:', error);
                initI18n('zh-CN');
                setCalendarLocale('zh-CN');
                setCurrentLang('zh-CN');
                setIsReady(true);
            }
        })();
    }, []);

    // 切换语言
    const changeLanguage = useCallback(async (lang: Language) => {
        try {
            await i18nChangeLanguage(lang);
            setCalendarLocale(lang); // 同步设置日历语言
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            setCurrentLang(lang);
            // 强制重新渲染所有使用 t 函数的组件
            setRenderKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to change language:', error);
        }
    }, []);

    // 翻译函数 - 支持默认值或插值参数
    const t = useCallback((key: string, defaultValueOrOptions?: string | any): string => {
        return String(i18nT(key, defaultValueOrOptions));
    }, [currentLang]); // eslint-disable-line react-hooks/exhaustive-deps

    const value: I18nContextType = {
        t,
        currentLanguage: currentLang,
        changeLanguage,
        isReady,
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * 使用 i18n 的 Hook
 */
export function useI18n(): I18nContextType {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}

export { t as translate } from '@daymate/i18n';
