/**
 * 日历事件数据模型
 * @description 共享的日历事件类型定义，用于 rn-calendar 和 android-calendar
 * @see 基于 RFC5545 iCalendar 标准设计
 */

/** 事件状态 */
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

/** 事件透明度 */
export type EventTransparency = 'opaque' | 'transparent';

/** 优先级等级 */
export type PriorityLevel = 'high' | 'medium' | 'low' | 'none';

/**
 * 日历事件完整模型
 * 与 android-calendar Event.kt 保持一致
 */
export type CalendarEvent = {
    id: string;

    // 基本信息
    title: string;
    description?: string;
    location?: string;

    // 时间信息
    date: string;           // yyyy-MM-dd (主日期)
    startTime?: string;     // HH:mm
    endTime?: string;       // HH:mm
    allDay?: boolean;

    // 重复规则 (RRULE)
    recurrenceRule?: string;
    recurrenceId?: string;

    // 提醒设置
    reminderMinutes?: number;
    notificationId?: string;

    // 分类和优先级
    category?: string;
    priority?: number;      // 0-9, 0为未设置，1最高，9最低

    // 状态
    status?: EventStatus;
    transparency?: EventTransparency;
    completed?: boolean;    // 事项完成状态

    // 创建和更新时间
    createdAt: string;      // ISO string
    updatedAt: string;      // ISO string

    // 外部日历支持
    calendarId?: string;
    externalId?: string;

    // 农历相关
    lunarDate?: string;
    isLunarEvent?: boolean;
};

/**
 * 创建事件输入类型
 */
export type CreateCalendarEventInput = {
    title: string;
    date: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    allDay?: boolean;
    reminderMinutes?: number;
    category?: string;
    priority?: number;
    recurrenceRule?: string;
};

/**
 * 更新事件输入类型
 */
export type UpdateCalendarEventInput = Partial<CreateCalendarEventInput>;

/**
 * 简化的事件模型 (向后兼容)
 * @deprecated 使用 CalendarEvent 代替
 */
export type SimpleCalendarEvent = {
    id: string;
    date: string;
    title: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    reminderMinutes?: number;
    notificationId?: string;
    createdAt: string;
    updatedAt: string;
};
