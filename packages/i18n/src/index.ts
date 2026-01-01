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

export const t = (key: string, defaultValueOrOptions?: string | any) => {
    // 如果第二个参数是字符串，当作默认值处理
    if (typeof defaultValueOrOptions === 'string') {
        const result = i18next.t(key);
        // 如果翻译结果等于key本身，说明没有找到翻译，返回默认值
        if (result === key) {
            return defaultValueOrOptions;
        }
        return result;
    }
    // 否则当作 i18next 的 options 参数（比如插值）
    return i18next.t(key, defaultValueOrOptions);
};

export const changeLanguage = (language: Language) => {
    return i18next.changeLanguage(language);
};

export const getCurrentLanguage = (): Language => {
    return i18next.language as Language;
};

export default i18next;
