/**
 * 事件优先级工具类
 * @description 共享的优先级处理逻辑，与 android-calendar PriorityColorUtils.kt 保持一致
 */

import type { PriorityLevel } from '../models/CalendarEvent';

/**
 * 优先级范围定义
 * 0 = 未设置
 * 1-3 = 高优先级
 * 4-6 = 中优先级
 * 7-9 = 低优先级
 */
export const PRIORITY_RANGES = {
    HIGH: { min: 1, max: 3 },
    MEDIUM: { min: 4, max: 6 },
    LOW: { min: 7, max: 9 },
} as const;

/**
 * 优先级颜色配置
 */
export const PRIORITY_COLORS = {
    high: {
        background: '#FF5252',
        border: '#D32F2F',
        text: '#FFFFFF',
    },
    medium: {
        background: '#FFB74D',
        border: '#F57C00',
        text: '#FFFFFF',
    },
    low: {
        background: '#E3F2FD',
        border: '#1976D2',
        text: '#1976D2',
    },
    none: {
        background: '#F5F5F5',
        border: '#9E9E9E',
        text: '#616161',
    },
} as const;

/**
 * 根据优先级数值获取优先级等级
 * @param priority 优先级数值 (0-9)
 * @returns 优先级等级
 */
export function getPriorityLevel(priority: number | undefined): PriorityLevel {
    if (!priority || priority === 0) return 'none';
    if (priority >= 1 && priority <= 3) return 'high';
    if (priority >= 4 && priority <= 6) return 'medium';
    if (priority >= 7 && priority <= 9) return 'low';
    return 'none';
}

/**
 * 根据优先级获取颜色配置
 * @param priority 优先级数值
 * @returns 颜色配置对象
 */
export function getPriorityColors(priority: number | undefined) {
    const level = getPriorityLevel(priority);
    return PRIORITY_COLORS[level];
}

/**
 * 根据优先级获取指示符
 * @param priority 优先级数值
 * @returns 优先级指示符字符串
 */
export function getPriorityIndicator(priority: number | undefined): string {
    const level = getPriorityLevel(priority);
    switch (level) {
        case 'high':
            return '!!!';
        case 'medium':
            return '!!';
        case 'low':
            return '!';
        default:
            return '';
    }
}

/**
 * 根据优先级获取文本描述
 * @param priority 优先级数值
 * @returns 优先级文本
 */
export function getPriorityText(priority: number | undefined): string {
    const level = getPriorityLevel(priority);
    switch (level) {
        case 'high':
            return '高';
        case 'medium':
            return '中';
        case 'low':
            return '低';
        default:
            return '未设置';
    }
}

/**
 * 判断是否为高优先级
 * @param priority 优先级数值
 */
export function isHighPriority(priority: number | undefined): boolean {
    return getPriorityLevel(priority) === 'high';
}

/**
 * 比较两个事件的优先级
 * @param a 第一个优先级
 * @param b 第二个优先级
 * @returns 负数表示a优先级更高，正数表示b优先级更高
 */
export function comparePriority(
    a: number | undefined,
    b: number | undefined
): number {
    const priorityA = a ?? 10; // 未设置的优先级最低
    const priorityB = b ?? 10;
    return priorityA - priorityB;
}
