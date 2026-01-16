import type { CalendarEvent, CreateCalendarEventInput } from '@daymate/shared';
import { generateId } from '@daymate/shared';

/**
 * 事件工厂
 * 使用工厂模式创建不同类型的事件对象
 */
export class EventFactory {
    /**
     * 创建标准事件
     */
    static createEvent(input: CreateCalendarEventInput): CalendarEvent {
        const now = new Date().toISOString();

        return {
            id: generateId(),
            title: input.title.trim(),
            date: input.date,
            description: input.description?.trim(),
            location: input.location?.trim(),
            startTime: input.startTime?.trim() || undefined,
            endTime: input.endTime?.trim() || undefined,
            allDay: input.allDay || false,
            reminderMinutes: input.reminderMinutes,
            category: input.category?.trim(),
            priority: input.priority,
            recurrenceRule: input.recurrenceRule,
            createdAt: now,
            updatedAt: now,
        };
    }

    /**
     * 创建全天事件
     */
    static createAllDayEvent(
        title: string,
        date: string,
        options?: Partial<CreateCalendarEventInput>
    ): CalendarEvent {
        return this.createEvent({
            title,
            date,
            allDay: true,
            ...options,
        });
    }

    /**
     * 创建定时事件
     */
    static createTimedEvent(
        title: string,
        date: string,
        startTime: string,
        endTime: string,
        options?: Partial<CreateCalendarEventInput>
    ): CalendarEvent {
        return this.createEvent({
            title,
            date,
            startTime,
            endTime,
            allDay: false,
            ...options,
        });
    }

    /**
     * 创建带提醒的事件
     */
    static createEventWithReminder(
        title: string,
        date: string,
        startTime: string,
        reminderMinutes: number,
        options?: Partial<CreateCalendarEventInput>
    ): CalendarEvent {
        return this.createEvent({
            title,
            date,
            startTime,
            reminderMinutes,
            ...options,
        });
    }

    /**
     * 创建高优先级事件
     */
    static createHighPriorityEvent(
        title: string,
        date: string,
        options?: Partial<CreateCalendarEventInput>
    ): CalendarEvent {
        return this.createEvent({
            title,
            date,
            priority: 1,
            ...options,
        });
    }

    /**
     * 从现有事件复制创建新事件
     */
    static copyEvent(
        event: CalendarEvent,
        newDate: string,
        options?: Partial<CreateCalendarEventInput>
    ): CalendarEvent {
        return this.createEvent({
            title: event.title,
            date: newDate,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            allDay: event.allDay,
            reminderMinutes: event.reminderMinutes,
            category: event.category,
            priority: event.priority,
            ...options,
        });
    }

    /**
     * 创建快速事件（只需标题和日期）
     */
    static createQuickEvent(title: string, date: string): CalendarEvent {
        return this.createEvent({
            title,
            date,
        });
    }
}
