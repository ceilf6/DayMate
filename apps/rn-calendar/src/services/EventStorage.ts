import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, CreateCalendarEventInput } from '@daymate/shared';

const STORAGE_KEY = 'daymate.events.v1';

type EventsByDate = Record<string, CalendarEvent[]>;

const safeJsonParse = <T>(raw: string | null): T | null => {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

export class EventStorage {
    static async getAllEventsByDate(): Promise<EventsByDate> {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = safeJsonParse<EventsByDate>(raw);
        if (!parsed || typeof parsed !== 'object') return {};
        return parsed;
    }

    static async getEventsForDate(date: string): Promise<CalendarEvent[]> {
        const all = await EventStorage.getAllEventsByDate();
        return all[date] ?? [];
    }

    static async addEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
        const now = new Date().toISOString();
        const event: CalendarEvent = {
            id: generateId(),
            date: input.date,
            title: input.title.trim(),
            startTime: normalizeTime(input.startTime),
            endTime: normalizeTime(input.endTime),
            notes: normalizeTime(input.notes),
            reminderMinutes: normalizeReminderMinutes(input.reminderMinutes),
            createdAt: now,
            updatedAt: now,
        };

        const all = await EventStorage.getAllEventsByDate();
        const nextForDate = [...(all[input.date] ?? []), event];
        all[input.date] = nextForDate;

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
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

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
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

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return deleted;
    }
}

export type { EventsByDate };
