import type { CalendarEvent, CreateCalendarEventInput } from '@daymate/shared';

/**
 * 验证结果
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * 事件验证器
 * 封装所有事件验证逻辑，提供清晰的错误消息
 */
export class EventValidator {
    private errors: string[] = [];

    /**
     * 验证创建事件的输入
     */
    validateInput(input: CreateCalendarEventInput): ValidationResult {
        this.errors = [];

        this.validateTitle(input.title);
        this.validateDate(input.date);
        this.validateTimeRange(input.startTime, input.endTime, input.allDay);
        this.validateReminder(input.reminderMinutes);
        this.validatePriority(input.priority);

        return {
            isValid: this.errors.length === 0,
            errors: [...this.errors],
        };
    }

    /**
     * 验证完整的事件对象
     */
    validateEvent(event: CalendarEvent): ValidationResult {
        this.errors = [];

        this.validateTitle(event.title);
        this.validateDate(event.date);
        this.validateTimeRange(event.startTime, event.endTime, event.allDay);
        this.validateReminder(event.reminderMinutes);
        this.validatePriority(event.priority);

        return {
            isValid: this.errors.length === 0,
            errors: [...this.errors],
        };
    }

    /**
     * 获取所有错误消息
     */
    getErrors(): string[] {
        return [...this.errors];
    }

    /**
     * 获取第一个错误消息
     */
    getFirstError(): string | null {
        return this.errors[0] || null;
    }

    // ========== 私有验证方法 ==========

    private validateTitle(title?: string): void {
        if (!title || !title.trim()) {
            this.errors.push('标题不能为空');
            return;
        }

        if (title.trim().length > 100) {
            this.errors.push('标题不能超过100个字符');
        }
    }

    private validateDate(date?: string): void {
        if (!date) {
            this.errors.push('日期不能为空');
            return;
        }

        // 允许特殊日期键 'NO_DATE' 用于无日期的事项
        if (date === 'NO_DATE') {
            return;
        }

        // 验证日期格式 yyyy-MM-dd
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            this.errors.push('日期格式不正确，应为 yyyy-MM-dd');
            return;
        }

        // 验证日期是否有效
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        if (
            dateObj.getFullYear() !== year ||
            dateObj.getMonth() !== month - 1 ||
            dateObj.getDate() !== day
        ) {
            this.errors.push('日期无效');
        }
    }

    private validateTimeRange(
        startTime?: string,
        endTime?: string,
        allDay?: boolean
    ): void {
        // 全天事项不需要验证时间
        if (allDay) return;

        // 如果有开始时间或结束时间，验证格式
        if (startTime && !this.isValidTimeFormat(startTime)) {
            this.errors.push('开始时间格式不正确，应为 HH:mm');
        }

        if (endTime && !this.isValidTimeFormat(endTime)) {
            this.errors.push('结束时间格式不正确，应为 HH:mm');
        }

        // 如果同时有开始和结束时间，验证时间范围
        if (startTime && endTime && this.isValidTimeFormat(startTime) && this.isValidTimeFormat(endTime)) {
            if (startTime >= endTime) {
                this.errors.push('结束时间必须晚于开始时间');
            }
        }
    }

    private validateReminder(reminderMinutes?: number): void {
        if (reminderMinutes === undefined || reminderMinutes === null) {
            return;
        }

        if (!Number.isFinite(reminderMinutes)) {
            this.errors.push('提醒时间必须是数字');
            return;
        }

        if (reminderMinutes < 0) {
            this.errors.push('提醒时间不能为负数');
        }

        if (reminderMinutes > 10080) { // 7天
            this.errors.push('提醒时间不能超过7天');
        }
    }

    private validatePriority(priority?: number): void {
        if (priority === undefined || priority === null || priority === 0) {
            return;
        }

        if (!Number.isFinite(priority)) {
            this.errors.push('优先级必须是数字');
            return;
        }

        if (priority < 1 || priority > 9) {
            this.errors.push('优先级必须在1-9之间');
        }
    }

    private isValidTimeFormat(time: string): boolean {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        return timeRegex.test(time);
    }
}
