/**
 * iCalendar 工具类
 * @description 共享的 iCalendar (RFC5545) 导入导出逻辑
 * @see 与 android-calendar ICalendarUtils.kt 保持一致
 */

import type { CalendarEvent, EventStatus, EventTransparency } from '../models/CalendarEvent';

/**
 * 将事件列表导出为 iCalendar 格式
 * @param events 事件列表
 * @returns iCalendar 格式字符串
 */
export function exportToICalendar(events: CalendarEvent[]): string {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//DayMate//DayMate Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
    ];

    for (const event of events) {
        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${event.id}@daymate.local`);
        lines.push(`DTSTAMP:${formatDateTime(new Date())}`);

        if (event.allDay) {
            lines.push(`DTSTART;VALUE=DATE:${formatDate(event.date)}`);
            if (event.endTime) {
                lines.push(`DTEND;VALUE=DATE:${formatDate(event.date)}`);
            }
        } else {
            const startDateTime = combineDateTime(event.date, event.startTime);
            lines.push(`DTSTART:${formatDateTime(startDateTime)}`);

            if (event.endTime) {
                const endDateTime = combineDateTime(event.date, event.endTime);
                lines.push(`DTEND:${formatDateTime(endDateTime)}`);
            }
        }

        lines.push(`SUMMARY:${escapeText(event.title)}`);

        if (event.description) {
            lines.push(`DESCRIPTION:${escapeText(event.description)}`);
        }

        if (event.location) {
            lines.push(`LOCATION:${escapeText(event.location)}`);
        }

        if (event.category) {
            lines.push(`CATEGORIES:${escapeText(event.category)}`);
        }

        // 状态
        const status = mapStatusToIcal(event.status);
        lines.push(`STATUS:${status}`);

        // 优先级
        if (event.priority && event.priority > 0) {
            lines.push(`PRIORITY:${event.priority}`);
        }

        // 透明度
        const transp = event.transparency === 'transparent' ? 'TRANSPARENT' : 'OPAQUE';
        lines.push(`TRANSP:${transp}`);

        // 提醒
        if (event.reminderMinutes && event.reminderMinutes > 0) {
            lines.push('BEGIN:VALARM');
            lines.push('ACTION:DISPLAY');
            lines.push(`DESCRIPTION:${escapeText(event.title)}`);
            lines.push(`TRIGGER:-PT${event.reminderMinutes}M`);
            lines.push('END:VALARM');
        }

        // 重复规则
        if (event.recurrenceRule) {
            lines.push(`RRULE:${event.recurrenceRule}`);
        }

        lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
}

/**
 * 从 iCalendar 格式导入事件
 * @param content iCalendar 格式字符串
 * @returns 事件列表
 */
export function importFromICalendar(content: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = content.split(/\r?\n/).map((line) => line.trim());

    let currentEvent: Record<string, string> | null = null;
    let inEvent = false;

    for (const line of lines) {
        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            currentEvent = {};
        } else if (line === 'END:VEVENT') {
            inEvent = false;
            if (currentEvent) {
                const event = parseEventFromMap(currentEvent);
                if (event) {
                    events.push(event);
                }
            }
            currentEvent = null;
        } else if (inEvent && currentEvent) {
            parseEventProperty(line, currentEvent);
        }
    }

    return events;
}

function parseEventProperty(line: string, eventData: Record<string, string>): void {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;

    const property = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    if (property.startsWith('SUMMARY')) {
        eventData['SUMMARY'] = unescapeText(value);
    } else if (property.startsWith('DESCRIPTION')) {
        eventData['DESCRIPTION'] = unescapeText(value);
    } else if (property.startsWith('LOCATION')) {
        eventData['LOCATION'] = unescapeText(value);
    } else if (property.startsWith('CATEGORIES')) {
        eventData['CATEGORIES'] = unescapeText(value);
    } else if (property.startsWith('DTSTART')) {
        if (property.includes('VALUE=DATE')) {
            eventData['DTSTART_DATE'] = value;
        } else {
            eventData['DTSTART'] = value;
        }
    } else if (property.startsWith('DTEND')) {
        if (property.includes('VALUE=DATE')) {
            eventData['DTEND_DATE'] = value;
        } else {
            eventData['DTEND'] = value;
        }
    } else if (property.startsWith('STATUS')) {
        eventData['STATUS'] = value;
    } else if (property.startsWith('PRIORITY')) {
        eventData['PRIORITY'] = value;
    } else if (property.startsWith('TRANSP')) {
        eventData['TRANSP'] = value;
    } else if (property.startsWith('RRULE')) {
        eventData['RRULE'] = value;
    } else if (property.startsWith('UID')) {
        eventData['UID'] = value;
    }
}

function parseEventFromMap(eventData: Record<string, string>): CalendarEvent | null {
    const title = eventData['SUMMARY'];
    if (!title) return null;

    // 解析日期时间
    let date: string;
    let startTime: string | undefined;
    let endTime: string | undefined;
    let allDay = false;

    if (eventData['DTSTART_DATE']) {
        date = parseDateFromIcal(eventData['DTSTART_DATE']);
        allDay = true;
    } else if (eventData['DTSTART']) {
        const parsed = parseDateTimeFromIcal(eventData['DTSTART']);
        date = parsed.date;
        startTime = parsed.time;
    } else {
        return null;
    }

    if (eventData['DTEND']) {
        const parsed = parseDateTimeFromIcal(eventData['DTEND']);
        endTime = parsed.time;
    }

    // 解析状态
    const status = mapIcalToStatus(eventData['STATUS']);

    // 解析优先级
    const priority = eventData['PRIORITY'] ? parseInt(eventData['PRIORITY'], 10) : undefined;

    // 解析透明度
    const transparency: EventTransparency =
        eventData['TRANSP'] === 'TRANSPARENT' ? 'transparent' : 'opaque';

    // 始终生成新 ID，避免重复导入时 key 冲突
    const id = generateId();

    const now = new Date().toISOString();

    return {
        id,
        title,
        description: eventData['DESCRIPTION'],
        location: eventData['LOCATION'],
        category: eventData['CATEGORIES'],
        date,
        startTime,
        endTime,
        allDay,
        priority,
        status,
        transparency,
        recurrenceRule: eventData['RRULE'],
        createdAt: now,
        updatedAt: now,
    };
}

// 辅助函数

function formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function formatDate(dateStr: string): string {
    return dateStr.replace(/-/g, '');
}

function combineDateTime(date: string, time?: string): Date {
    if (!time) {
        return new Date(`${date}T00:00:00`);
    }
    return new Date(`${date}T${time}:00`);
}

function parseDateFromIcal(icalDate: string): string {
    // yyyyMMdd -> yyyy-MM-dd
    const year = icalDate.substring(0, 4);
    const month = icalDate.substring(4, 6);
    const day = icalDate.substring(6, 8);
    return `${year}-${month}-${day}`;
}

function parseDateTimeFromIcal(icalDateTime: string): { date: string; time: string } {
    // yyyyMMddTHHmmss -> { date: yyyy-MM-dd, time: HH:mm }
    const datePart = icalDateTime.substring(0, 8);
    const timePart = icalDateTime.substring(9, 13);

    const year = datePart.substring(0, 4);
    const month = datePart.substring(4, 6);
    const day = datePart.substring(6, 8);

    const hours = timePart.substring(0, 2);
    const minutes = timePart.substring(2, 4);

    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
    };
}

function escapeText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

function unescapeText(text: string): string {
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\');
}

function mapStatusToIcal(status?: EventStatus): string {
    switch (status) {
        case 'confirmed':
            return 'CONFIRMED';
        case 'tentative':
            return 'TENTATIVE';
        case 'cancelled':
            return 'CANCELLED';
        default:
            return 'CONFIRMED';
    }
}

function mapIcalToStatus(icalStatus?: string): EventStatus {
    switch (icalStatus) {
        case 'CONFIRMED':
            return 'confirmed';
        case 'TENTATIVE':
            return 'tentative';
        case 'CANCELLED':
            return 'cancelled';
        default:
            return 'confirmed';
    }
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
