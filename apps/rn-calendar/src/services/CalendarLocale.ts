import { LocaleConfig } from 'react-native-calendars';
import type { Language } from '../contexts/I18nContext';

/**
 * 日历本地化配置
 * react-native-calendars 使用自己的本地化系统
 */

// 简体中文
const zhCN = {
    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
    today: '今天',
};

// 繁体中文
const zhTW = {
    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
    today: '今天',
};

// 英文
const en = {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'Today',
};

// 注册所有语言
LocaleConfig.locales['zh-CN'] = zhCN;
LocaleConfig.locales['zh-TW'] = zhTW;
LocaleConfig.locales['en'] = en;

// 默认使用简体中文
LocaleConfig.defaultLocale = 'zh-CN';

/**
 * 设置日历语言
 */
export function setCalendarLocale(language: Language) {
    LocaleConfig.defaultLocale = language;
}

/**
 * 获取当前日历语言
 */
export function getCalendarLocale(): string {
    return LocaleConfig.defaultLocale;
}
