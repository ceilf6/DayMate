/**
 * 日期工具函数
 * @description 共享的日期处理工具
 */

/**
 * 格式化日期为 yyyy-MM-dd 格式
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 解析 yyyy-MM-dd 格式的日期字符串
 */
export function parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * 获取今天的日期字符串
 */
export function getToday(): string {
    return formatDate(new Date());
}

/**
 * 判断是否为今天
 */
export function isToday(dateString: string): boolean {
    return dateString === getToday();
}

/**
 * 判断两个日期是否在同一周
 */
export function isSameWeek(date1: string, date2: string): boolean {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);

    // 获取周一
    const getMonday = (d: Date): Date => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const monday1 = getMonday(new Date(d1));
    const monday2 = getMonday(new Date(d2));

    return formatDate(monday1) === formatDate(monday2);
}

/**
 * 判断两个日期是否在同一个月
 */
export function isSameMonth(date1: string, date2: string): boolean {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

/**
 * 获取月视图的所有日期（包含前后补齐的日期）
 */
export function getDatesForMonthView(year: number, month: number): string[] {
    const dates: string[] = [];

    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // 获取第一天是周几（0=周日，1=周一...）
    let startWeekday = firstDay.getDay();
    // 转换为周一开始（0=周一，1=周二...6=周日）
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;

    // 添加上个月的补齐日期
    for (let i = startWeekday - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, -i);
        dates.push(formatDate(date));
    }

    // 添加当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
        dates.push(formatDate(new Date(year, month - 1, day)));
    }

    // 添加下个月的补齐日期（补齐到6行）
    const remainingDays = 42 - dates.length;
    for (let day = 1; day <= remainingDays; day++) {
        dates.push(formatDate(new Date(year, month, day)));
    }

    return dates;
}

/**
 * 获取周视图的所有日期
 */
export function getDatesForWeekView(dateString: string): string[] {
    const date = parseDate(dateString);
    const day = date.getDay();
    // 转换为周一开始
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(date);
        d.setDate(date.getDate() + mondayOffset + i);
        dates.push(formatDate(d));
    }

    return dates;
}

/**
 * 计算两个日期之间的天数
 */
export function daysBetween(date1: string, date2: string): number {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor((d2.getTime() - d1.getTime()) / oneDay);
}

/**
 * 获取日期的前/后N天
 */
export function addDays(dateString: string, days: number): string {
    const date = parseDate(dateString);
    date.setDate(date.getDate() + days);
    return formatDate(date);
}

/**
 * 获取日期的前/后N月
 */
export function addMonths(dateString: string, months: number): string {
    const date = parseDate(dateString);
    date.setMonth(date.getMonth() + months);
    return formatDate(date);
}

/**
 * 格式化时间为 HH:mm 格式
 */
export function formatTime(hours: number, minutes: number): string {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * 解析 HH:mm 格式的时间字符串
 */
export function parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
