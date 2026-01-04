import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, CreateCalendarEventInput, generateId } from '@daymate/shared';

const STORAGE_KEY = 'daymate.events.v1';

// 用于表示无日期的事项的特殊日期键
export const NO_DATE_KEY = 'NO_DATE';

type EventsByDate = Record<string, CalendarEvent[]>;

// 内存缓存，避免重复读取 AsyncStorage
let memoryCache: EventsByDate | null = null;
let cacheInitialized = false;

const safeJsonParse = <T>(raw: string | null): T | null => {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

const normalizeTime = (value?: string): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
};

const normalizeReminderMinutes = (value?: number): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (!Number.isFinite(value)) return undefined;
    if (value <= 0) return undefined;
    return Math.floor(value);
};

const normalizePriority = (value?: number): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (!Number.isFinite(value)) return undefined;
    if (value < 1 || value > 9) return undefined;
    return Math.floor(value);
};

export class EventStorage {
    static async getAllEventsByDate(): Promise<EventsByDate> {
        // 使用内存缓存
        if (cacheInitialized && memoryCache) {
            return memoryCache;
        }

        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = safeJsonParse<EventsByDate>(raw);
        const result = (!parsed || typeof parsed !== 'object') ? {} : parsed;

        // 初始化缓存
        memoryCache = result;
        cacheInitialized = true;

        return result;
    }

    static async getEventsForDate(date: string): Promise<CalendarEvent[]> {
        const all = await EventStorage.getAllEventsByDate();
        return all[date] ?? [];
    }

    private static async persistAndUpdateCache(data: EventsByDate): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        memoryCache = data;
    }

    /**
     * 检查事项 ID 是否已存在（跨所有日期）
     */
    private static eventIdExists(all: EventsByDate, eventId: string): boolean {
        for (const dateEvents of Object.values(all)) {
            if (dateEvents.some(e => e.id === eventId)) {
                return true;
            }
        }
        return false;
    }

    static async addEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
        const now = new Date().toISOString();
        let eventId = generateId();

        const all = await EventStorage.getAllEventsByDate();

        // 确保生成唯一的 ID（理论上 generateId 应该已经唯一，但做双重保险）
        let attempts = 0;
        while (EventStorage.eventIdExists(all, eventId) && attempts < 10) {
            eventId = generateId();
            attempts++;
        }

        if (attempts >= 10) {
            console.warn('EventStorage: 多次尝试生成唯一 ID 失败');
        }

        const event: CalendarEvent = {
            id: eventId,
            date: input.date,
            title: input.title.trim(),
            description: input.description?.trim(),
            location: input.location?.trim(),
            startTime: normalizeTime(input.startTime),
            endTime: normalizeTime(input.endTime),
            allDay: input.allDay,
            reminderMinutes: normalizeReminderMinutes(input.reminderMinutes),
            category: input.category?.trim(),
            priority: normalizePriority(input.priority),
            createdAt: now,
            updatedAt: now,
        };

        // 检查同一日期下是否已存在相同 ID（防御性编程）
        const dateList = all[input.date] ?? [];
        if (dateList.some(e => e.id === event.id)) {
            console.warn(`EventStorage: 事项 ID ${event.id} 已存在于日期 ${input.date}，跳过添加`);
            return dateList.find(e => e.id === event.id)!;
        }

        const nextForDate = [...dateList, event];
        all[input.date] = nextForDate;

        await EventStorage.persistAndUpdateCache(all);
        return event;
    }

    static async updateEvent(date: string, eventId: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
        const all = await EventStorage.getAllEventsByDate();
        const list = all[date] ?? [];
        const index = list.findIndex(e => e.id === eventId);
        if (index === -1) return null;

        const now = new Date().toISOString();
        const updated: CalendarEvent = {
            ...list[index],
            ...patch,
            updatedAt: now,
        };

        const next = [...list];
        next[index] = updated;
        all[date] = next;

        await EventStorage.persistAndUpdateCache(all);
        return updated;
    }

    static async deleteEvent(date: string, eventId: string): Promise<CalendarEvent | null> {
        const all = await EventStorage.getAllEventsByDate();
        const list = all[date] ?? [];
        const index = list.findIndex(e => e.id === eventId);
        if (index === -1) return null;

        const deleted = list[index];
        const next = list.filter(e => e.id !== eventId);

        if (next.length === 0) {
            delete all[date];
        } else {
            all[date] = next;
        }

        await EventStorage.persistAndUpdateCache(all);
        return deleted;
    }

    /**
     * 清除内存缓存（用于测试或强制刷新）
     */
    static clearCache(): void {
        memoryCache = null;
        cacheInitialized = false;
    }

    /**
     * 获取所有未完成的事项（跨所有日期）
     */
    static async getIncompleteEvents(): Promise<CalendarEvent[]> {
        const all = await EventStorage.getAllEventsByDate();
        const incompleteEvents: CalendarEvent[] = [];

        for (const dateEvents of Object.values(all)) {
            for (const event of dateEvents) {
                if (!event.completed) {
                    incompleteEvents.push(event);
                }
            }
        }

        // 按日期排序，最近的在前
        return incompleteEvents.sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * 切换事项的完成状态
     */
    static async toggleEventComplete(date: string, eventId: string): Promise<CalendarEvent | null> {
        const all = await EventStorage.getAllEventsByDate();
        const list = all[date] ?? [];
        const event = list.find(e => e.id === eventId);
        if (!event) return null;

        return EventStorage.updateEvent(date, eventId, {
            completed: !event.completed,
        });
    }
}

export type { EventsByDate };
