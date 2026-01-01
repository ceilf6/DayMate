import i18next from 'i18next';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

export type Language = 'zh-CN' | 'zh-TW' | 'en';

export const resources = {
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    'en': { translation: en },
};

export const initI18n = (language: Language = 'zh-CN') => {
    i18next.init({
        lng: language,
        fallbackLng: 'zh-CN',
        resources,
        interpolation: {
            escapeValue: false,
        },
    });
    return i18next;
};

export const t = (key: string, options?: any) => {
    return i18next.t(key, options);
};

export const changeLanguage = (language: Language) => {
    return i18next.changeLanguage(language);
};

export const getCurrentLanguage = (): Language => {
    return i18next.language as Language;
};

export default i18next;
