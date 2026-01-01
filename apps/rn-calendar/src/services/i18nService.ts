import { useEffect, useState, useCallback } from 'react';
import { initI18n, t as i18nT, changeLanguage as i18nChangeLanguage, getCurrentLanguage, type Language } from '@daymate/i18n';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@daymate/language';

/**
 * 获取系统默认语言
 */
function getDefaultLanguage(): Language {
    const locales = RNLocalize.getLocales();
    if (locales.length > 0) {
        const locale = locales[0].languageTag;
        // 转换为支持的语言代码
        if (locale.startsWith('zh')) {
            // 区分简繁体
            if (locale.includes('TW') || locale.includes('HK')) {
                return 'zh-TW';
            }
            return 'zh-CN';
        }
        // 默认返回英文
        return 'en';
    }
    return 'zh-CN';
}

/**
 * i18n Hook
 * 提供翻译功能和语言切换
 */
export function useI18n() {
    const [currentLang, setCurrentLang] = useState<Language>('zh-CN');
    const [isReady, setIsReady] = useState(false);

    // 初始化
    useEffect(() => {
        (async () => {
            try {
                // 尝试从存储读取用户选择的语言
                const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
                const lang = (savedLang as Language) || getDefaultLanguage();

                // 初始化 i18n
                initI18n(lang);
                setCurrentLang(lang);
                setIsReady(true);
            } catch (error) {
                console.error('Failed to initialize i18n:', error);
                // 回退到默认语言
                initI18n('zh-CN');
                setCurrentLang('zh-CN');
                setIsReady(true);
            }
        })();
    }, []);

    // 切换语言
    const changeLanguage = useCallback(async (lang: Language) => {
        try {
            await i18nChangeLanguage(lang);
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            setCurrentLang(lang);
        } catch (error) {
            console.error('Failed to change language:', error);
        }
    }, []);

    // 翻译函数
    const t = useCallback((key: string, options?: any) => {
        return i18nT(key, options);
    }, []);

    return {
        t,
        currentLanguage: currentLang,
        changeLanguage,
        isReady,
    };
}

// 导出单独的 t 函数供非 hook 场景使用
export { t as translate } from '@daymate/i18n';
export type { Language };
