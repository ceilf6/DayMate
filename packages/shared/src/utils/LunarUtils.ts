/**
 * 农历工具类 - TypeScript 实现
 * 支持1900年到2100年的公历与农历互转
 */

// LRU 缓存实现，避免重复计算
const LUNAR_CACHE_SIZE = 500;
const lunarCache = new Map<string, LunarDate>();

function getCachedLunar(dateString: string): LunarDate | undefined {
    return lunarCache.get(dateString);
}

function setCachedLunar(dateString: string, lunar: LunarDate): void {
    if (lunarCache.size >= LUNAR_CACHE_SIZE) {
        const firstKey = lunarCache.keys().next().value;
        if (firstKey) lunarCache.delete(firstKey);
    }
    lunarCache.set(dateString, lunar);
}

export function clearLunarCache(): void {
    lunarCache.clear();
}

/**
 * 农历数据表（1900-2100年）
 * 每个整数包含的信息：
 * - 第1-12位：表示农历每月的大小（1为30天，0为29天）
 * - 第13-16位：表示闰月的月份（0表示无闰月）
 * - 第17-20位：表示闰月的天数（1为30天，0为29天）
 */
const LUNAR_INFO: number[] = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
    0x0d520  // 2100
];

/** 天干 */
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

/** 地支 */
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 生肖 */
const SHENG_XIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/** 农历月份名称 */
const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

/** 农历日期名称 */
const LUNAR_DAYS = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

/** 24节气名称 */
const SOLAR_TERMS = [
    '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
    '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
    '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
    '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
];

/** 农历节日（农历月份-日期 -> 节日名称） */
const LUNAR_HOLIDAYS: Record<string, string> = {
    '1-1': '春节',
    '1-15': '元宵',
    '2-2': '龙抬头',
    '5-5': '端午',
    '7-7': '七夕',
    '7-15': '中元',
    '8-15': '中秋',
    '9-9': '重阳',
    '12-8': '腊八',
    '12-23': '小年',
    '12-30': '除夕'
};

/** 公历节日（月-日 -> 节日名称） */
const SOLAR_HOLIDAYS: Record<string, string> = {
    '1-1': '元旦',
    '2-14': '情人节',
    '3-8': '妇女节',
    '3-12': '植树节',
    '4-1': '愚人节',
    '5-1': '劳动节',
    '5-4': '青年节',
    '6-1': '儿童节',
    '7-1': '建党节',
    '8-1': '建军节',
    '9-10': '教师节',
    '10-1': '国庆节',
    '12-25': '圣诞节'
};

/** 农历日期数据接口 */
export interface LunarDate {
    year: number;           // 农历年份
    month: number;          // 农历月份（1-12）
    day: number;            // 农历日期（1-30）
    isLeapMonth: boolean;   // 是否是闰月
    yearGanZhi: string;     // 天干地支年
    yearShengXiao: string;  // 生肖
    monthStr: string;       // 月份中文
    dayStr: string;         // 日期中文
    solarTerm: string | null; // 节气（如果当天是节气）
}

/**
 * 获取农历某年的总天数
 */
function getLunarYearDays(year: number): number {
    let sum = 348; // 12个月，每月29天 = 348天
    let i = 0x8000;
    const info = LUNAR_INFO[year - 1900];
    while (i > 0x8) {
        if ((info & i) !== 0) sum += 1;
        i = i >> 1;
    }
    return sum + getLeapMonthDays(year);
}

/**
 * 获取农历某年闰月的天数
 */
function getLeapMonthDays(year: number): number {
    if (getLeapMonth(year) === 0) return 0;
    return (LUNAR_INFO[year - 1900] & 0x10000) !== 0 ? 30 : 29;
}

/**
 * 获取农历某年的闰月月份（0表示无闰月）
 */
function getLeapMonth(year: number): number {
    return LUNAR_INFO[year - 1900] & 0xf;
}

/**
 * 获取农历某年某月的天数
 */
function getLunarMonthDays(year: number, month: number): number {
    const info = LUNAR_INFO[year - 1900];
    return (info & (0x10000 >> month)) !== 0 ? 30 : 29;
}

/**
 * 计算两个日期之间的天数差
 */
function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor((date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * 计算天干地支年
 */
function getGanZhiYear(year: number): string {
    const gan = TIAN_GAN[(year - 4) % 10];
    const zhi = DI_ZHI[(year - 4) % 12];
    return `${gan}${zhi}`;
}

/**
 * 获取节气日期（简化算法）
 */
function getSolarTermDay(year: number, termIndex: number): number {
    const baseDay = [
        6, 20,   // 小寒, 大寒
        4, 19,   // 立春, 雨水
        6, 21,   // 惊蛰, 春分
        5, 20,   // 清明, 谷雨
        6, 21,   // 立夏, 小满
        6, 21,   // 芒种, 夏至
        7, 23,   // 小暑, 大暑
        7, 23,   // 立秋, 处暑
        8, 23,   // 白露, 秋分
        8, 23,   // 寒露, 霜降
        7, 22,   // 立冬, 小雪
        7, 22    // 大雪, 冬至
    ][termIndex] || 1;

    // 根据年份微调
    const adjustment = Math.floor((year - 2000) * 0.2468) % 2;
    return baseDay + adjustment;
}

/**
 * 获取节气
 */
export function getSolarTerm(year: number, month: number, day: number): string | null {
    // 每个月有两个节气
    const termIndex1 = (month - 1) * 2;
    const termIndex2 = termIndex1 + 1;

    const term1Day = getSolarTermDay(year, termIndex1);
    const term2Day = getSolarTermDay(year, termIndex2);

    if (day === term1Day) return SOLAR_TERMS[termIndex1];
    if (day === term2Day) return SOLAR_TERMS[termIndex2];
    return null;
}

/**
 * 公历转农历
 * @param dateString 日期字符串，格式：yyyy-MM-dd
 */
export function solarToLunar(dateString: string): LunarDate {
    // 检查缓存
    const cached = getCachedLunar(dateString);
    if (cached) return cached;

    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // 验证范围
    if (year < 1900 || year > 2100) {
        const result = createDefaultLunarDate(year, month, day);
        setCachedLunar(dateString, result);
        return result;
    }

    // 计算距离1900年1月31日（农历1900年正月初一）的天数
    const baseDate = new Date(1900, 0, 31); // 月份从0开始
    const solarDate = new Date(year, month - 1, day);
    let offset = daysBetween(baseDate, solarDate);

    if (offset < 0) {
        const result = createDefaultLunarDate(year, month, day);
        setCachedLunar(dateString, result);
        return result;
    }

    // 计算农历年份
    let lunarYear = 1900;
    let daysInYear: number;
    while (lunarYear < 2101) {
        daysInYear = getLunarYearDays(lunarYear);
        if (offset < daysInYear) break;
        offset -= daysInYear;
        lunarYear++;
    }

    // 计算农历月份
    const leapMonth = getLeapMonth(lunarYear);
    let isLeapMonth = false;
    let lunarMonth = 1;
    let daysInMonth: number;

    while (lunarMonth <= 12) {
        // 判断是否是闰月
        if (leapMonth > 0 && lunarMonth === leapMonth + 1 && !isLeapMonth) {
            isLeapMonth = true;
            lunarMonth--;
            daysInMonth = getLeapMonthDays(lunarYear);
        } else {
            daysInMonth = getLunarMonthDays(lunarYear, lunarMonth);
        }

        if (offset < daysInMonth) break;

        offset -= daysInMonth;

        if (isLeapMonth) {
            isLeapMonth = false;
        }
        lunarMonth++;
    }

    // 农历日期
    const lunarDay = offset + 1;

    // 计算天干地支年
    const ganZhiYear = getGanZhiYear(lunarYear);

    // 计算生肖
    const shengXiao = SHENG_XIAO[(lunarYear - 4) % 12];

    // 月份中文
    const monthStr = LUNAR_MONTHS[(lunarMonth - 1) % 12];

    // 日期中文
    const dayStr = LUNAR_DAYS[(lunarDay - 1) % 30];

    // 节气
    const solarTerm = getSolarTerm(year, month, day);

    const result: LunarDate = {
        year: lunarYear,
        month: lunarMonth,
        day: lunarDay,
        isLeapMonth,
        yearGanZhi: ganZhiYear,
        yearShengXiao: shengXiao,
        monthStr,
        dayStr,
        solarTerm
    };

    // 存入缓存
    setCachedLunar(dateString, result);

    return result;
}

/**
 * 创建默认的农历日期（用于超出范围的情况）
 */
function createDefaultLunarDate(year: number, month: number, day: number): LunarDate {
    return {
        year,
        month,
        day,
        isLeapMonth: false,
        yearGanZhi: '未知',
        yearShengXiao: '未知',
        monthStr: LUNAR_MONTHS[(month - 1) % 12],
        dayStr: LUNAR_DAYS[(day - 1) % 30],
        solarTerm: null
    };
}

/**
 * 获取农历日期字符串（简化版本，用于日历显示）
 */
export function getLunarDateString(dateString: string): string {
    const lunar = solarToLunar(dateString);
    return getLunarShortString(lunar);
}

/**
 * 获取简短的农历日期字符串
 */
export function getLunarShortString(lunar: LunarDate): string {
    // 优先显示节气
    if (lunar.solarTerm) return lunar.solarTerm;
    // 初一显示月份
    if (lunar.day === 1) {
        const leap = lunar.isLeapMonth ? '闰' : '';
        return `${leap}${lunar.monthStr}月`;
    }
    return lunar.dayStr;
}

/**
 * 获取完整的农历日期字符串
 */
export function getFullLunarDateString(dateString: string): string {
    const lunar = solarToLunar(dateString);
    const leap = lunar.isLeapMonth ? '闰' : '';
    return `${lunar.yearGanZhi}年${lunar.yearShengXiao}年 ${leap}${lunar.monthStr}月${lunar.dayStr}`;
}

/**
 * 判断是否为农历节日，返回节日名称
 */
export function getLunarHoliday(dateString: string): string | null {
    const lunar = solarToLunar(dateString);
    const key = `${lunar.month}-${lunar.day}`;

    // 特殊处理除夕（腊月最后一天）
    if (lunar.month === 12) {
        const daysInMonth = lunar.isLeapMonth
            ? getLeapMonthDays(lunar.year)
            : getLunarMonthDays(lunar.year, 12);
        if (lunar.day === daysInMonth) {
            return '除夕';
        }
    }

    return LUNAR_HOLIDAYS[key] || null;
}

/**
 * 判断是否为公历节日，返回节日名称
 */
export function getSolarHoliday(dateString: string): string | null {
    const parts = dateString.split('-');
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const key = `${month}-${day}`;
    return SOLAR_HOLIDAYS[key] || null;
}

/**
 * 获取所有节日（包括农历节日、公历节日和节气）
 */
export function getAllHolidays(dateString: string): string[] {
    const holidays: string[] = [];

    // 公历节日
    const solarHoliday = getSolarHoliday(dateString);
    if (solarHoliday) holidays.push(solarHoliday);

    // 农历节日
    const lunarHoliday = getLunarHoliday(dateString);
    if (lunarHoliday) holidays.push(lunarHoliday);

    // 节气
    const lunar = solarToLunar(dateString);
    if (lunar.solarTerm) holidays.push(lunar.solarTerm);

    return holidays;
}

/**
 * 获取农历年份信息
 */
export function getLunarYear(dateString: string): string {
    const lunar = solarToLunar(dateString);
    return `${lunar.year}年(${lunar.yearGanZhi}${lunar.yearShengXiao}年)`;
}

/**
 * 获取农历月份信息
 */
export function getLunarMonthInfo(dateString: string): string {
    const lunar = solarToLunar(dateString);
    const leap = lunar.isLeapMonth ? '闰' : '';
    return `${leap}${lunar.monthStr}月`;
}

/**
 * 获取生肖
 */
export function getShengXiao(year: number): string {
    return SHENG_XIAO[(year - 4) % 12];
}

/**
 * 获取天干地支
 */
export function getGanZhi(year: number): string {
    return getGanZhiYear(year);
}

/**
 * 清除农历缓存（用于测试或内存管理）
 */
export function clearLunarCache(): void {
    lunarCache.clear();
}

export default {
    solarToLunar,
    getLunarDateString,
    getFullLunarDateString,
    getLunarHoliday,
    getSolarHoliday,
    getSolarTerm,
    getAllHolidays,
    getLunarYear,
    getLunarMonthInfo,
    getShengXiao,
    getGanZhi,
    getLunarShortString
};
