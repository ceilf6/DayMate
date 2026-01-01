import { Share, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
    CalendarEvent,
    exportToICalendar,
    importFromICalendar,
} from '@daymate/shared';

export class ImportExportService {
    /**
     * 导出事件为 iCalendar 格式并分享
     * @param events 要导出的事件列表
     */
    static async shareEvents(events: CalendarEvent[]): Promise<boolean> {
        if (events.length === 0) {
            return false;
        }

        const iCalContent = exportToICalendar(events);

        try {
            const result = await Share.share({
                message: iCalContent,
                title: 'DayMate 日历导出',
            });

            return result.action === Share.sharedAction;
        } catch {
            return false;
        }
    }

    /**
     * 复制 iCalendar 内容到剪贴板
     * @param events 要导出的事件列表
     */
    static async copyToClipboard(events: CalendarEvent[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const iCalContent = exportToICalendar(events);
        Clipboard.setString(iCalContent);
    }

    /**
     * 从 iCalendar 内容字符串导入事件
     * @param content iCalendar 格式的字符串
     * @returns 导入的事件列表
     */
    static importFromContent(content: string): CalendarEvent[] {
        if (!content || !content.trim()) {
            return [];
        }
        return importFromICalendar(content);
    }

    /**
     * 从剪贴板导入事件
     * @returns 导入的事件列表
     */
    static async importFromClipboard(): Promise<CalendarEvent[]> {
        const content = await Clipboard.getString();
        if (!content || !content.includes('BEGIN:VCALENDAR')) {
            return [];
        }
        return importFromICalendar(content);
    }

    /**
     * 获取导出的 iCalendar 内容
     * @param events 要导出的事件列表
     * @returns iCalendar 格式的字符串
     */
    static getICalendarContent(events: CalendarEvent[]): string {
        return exportToICalendar(events);
    }
}
