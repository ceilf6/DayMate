import type { CalendarEvent } from '@daymate/shared';
import { getPriorityColors } from '@daymate/shared';

/**
 * 事件格式化器
 * 封装所有事件格式化逻辑，支持多语言
 */
export class EventFormatter {
    private locale: string;

    constructor(locale: string = 'zh-CN') {
        this.locale = locale;
    }

    /**
     * 设置语言环境
     */
    setLocale(locale: string): void {
        this.locale = locale;
    }

    /**
     * 格式化日期
     */
    formatDate(date: string): string {
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString(this.locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return date;
        }
    }

    /**
     * 格式化短日期
     */
    formatShortDate(date: string): string {
        try {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString(this.locale, {
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return date;
        }
    }

    /**
     * 格式化时间范围
     */
    formatTimeRange(event: CalendarEvent): string {
        if (event.allDay) {
            return this.locale === 'zh-CN' ? '全天' : 'All Day';
        }

        if (!event.startTime && !event.endTime) {
            return '';
        }

        if (event.startTime && event.endTime) {
            return `${event.startTime} - ${event.endTime}`;
        }

        if (event.startTime) {
            return event.startTime;
        }

        return '';
    }

    /**
     * 格式化完整事件信息
     */
    formatFull(event: CalendarEvent): string {
        const parts: string[] = [];

        // 日期
        parts.push(this.formatDate(event.date));

        // 时间
        const timeRange = this.formatTimeRange(event);
        if (timeRange) {
            parts.push(timeRange);
        }

        // 标题
        parts.push(event.title);

        // 地点
        if (event.location) {
            parts.push(`📍 ${event.location}`);
        }

        return parts.join('\n');
    }

    /**
     * 格式化优先级
     */
    formatPriority(priority?: number): string {
        if (!priority || priority === 0) {
            return this.locale === 'zh-CN' ? '无' : 'None';
        }

        if (priority <= 3) {
            return this.locale === 'zh-CN' ? '高' : 'High';
        }

        if (priority <= 6) {
            return this.locale === 'zh-CN' ? '中' : 'Medium';
        }

        return this.locale === 'zh-CN' ? '低' : 'Low';
    }

    /**
     * 格式化提醒时间
     */
    formatReminder(reminderMinutes?: number): string {
        if (!reminderMinutes || reminderMinutes <= 0) {
            return this.locale === 'zh-CN' ? '无提醒' : 'No Reminder';
        }

        if (reminderMinutes < 60) {
            return this.locale === 'zh-CN'
                ? `提前${reminderMinutes}分钟`
                : `${reminderMinutes} minutes before`;
        }

        const hours = Math.floor(reminderMinutes / 60);
        if (reminderMinutes % 60 === 0) {
            return this.locale === 'zh-CN'
                ? `提前${hours}小时`
                : `${hours} hour${hours > 1 ? 's' : ''} before`;
        }

        const minutes = reminderMinutes % 60;
        return this.locale === 'zh-CN'
            ? `提前${hours}小时${minutes}分钟`
            : `${hours}h ${minutes}m before`;
    }

    /**
     * 格式化事件状态
     */
    formatStatus(event: CalendarEvent): string {
        if (event.completed) {
            return this.locale === 'zh-CN' ? '已完成' : 'Completed';
        }

        // 检查是否过期
        const now = new Date();
        const eventDate = new Date(event.date);

        if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':').map(Number);
            eventDate.setHours(hours, minutes);
        } else {
            eventDate.setHours(23, 59);
        }

        if (eventDate < now) {
            return this.locale === 'zh-CN' ? '已过期' : 'Overdue';
        }

        return this.locale === 'zh-CN' ? '进行中' : 'Active';
    }

    /**
     * 格式化事件摘要（用于列表显示）
     */
    formatSummary(event: CalendarEvent): string {
        const time = this.formatTimeRange(event);
        const priority = event.priority ? `[${this.formatPriority(event.priority)}] ` : '';

        return `${priority}${time ? time + ' ' : ''}${event.title}`;
    }
}
