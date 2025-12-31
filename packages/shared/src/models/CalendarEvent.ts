/**
 * 日历事件数据模型
 * @description 共享的日历事件类型定义，用于 rn-calendar 和其他应用
 */

export type CalendarEvent = {
    id: string;
    date: string; // yyyy-MM-dd
    title: string;
    startTime?: string; // HH:mm
    endTime?: string; // HH:mm
    notes?: string;
    reminderMinutes?: number;
    notificationId?: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
};

export type CreateCalendarEventInput = {
    date: string;
    title: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    reminderMinutes?: number;
};
