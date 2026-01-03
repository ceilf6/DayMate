"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLanguage = exports.changeLanguage = exports.t = exports.initI18n = exports.resources = void 0;
const i18next_1 = __importDefault(require("i18next"));
const zh_CN_json_1 = __importDefault(require("./locales/zh-CN.json"));
const zh_TW_json_1 = __importDefault(require("./locales/zh-TW.json"));
const en_json_1 = __importDefault(require("./locales/en.json"));
exports.resources = {
    'zh-CN': { translation: zh_CN_json_1.default },
    'zh-TW': { translation: zh_TW_json_1.default },
    'en': { translation: en_json_1.default },
};
const initI18n = (language = 'zh-CN') => {
    i18next_1.default.init({
        lng: language,
        fallbackLng: 'zh-CN',
        resources: exports.resources,
        interpolation: {
            escapeValue: false,
        },
    });
    return i18next_1.default;
};
exports.initI18n = initI18n;
const t = (key, defaultValueOrOptions) => {
    // 如果第二个参数是字符串，当作默认值处理
    if (typeof defaultValueOrOptions === 'string') {
        const result = i18next_1.default.t(key);
        // 如果翻译结果等于key本身，说明没有找到翻译，返回默认值
        if (result === key) {
            return defaultValueOrOptions;
        }
        return result;
    }
    // 否则当作 i18next 的 options 参数（比如插值）
    return i18next_1.default.t(key, defaultValueOrOptions);
};
exports.t = t;
const changeLanguage = (language) => {
    return i18next_1.default.changeLanguage(language);
};
exports.changeLanguage = changeLanguage;
const getCurrentLanguage = () => {
    return i18next_1.default.language;
};
exports.getCurrentLanguage = getCurrentLanguage;
exports.default = i18next_1.default;
