import { Platform, Share } from 'react-native';
import RNFS from 'react-native-fs';
import { pick, types } from '@react-native-documents/picker';
import {
    CalendarEvent,
    exportToICalendar,
    importFromICalendar,
} from '@daymate/shared';

const getExportPath = (fileName: string): string => {
    const baseDir = Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.DownloadDirectoryPath;
    return `${baseDir}/${fileName}`;
};

export class ImportExportService {
    /**
     * 导出事件到 iCalendar 文件
     * @param events 要导出的事件列表
     * @param fileName 文件名（可选，默认为 daymate-export.ics）
     * @returns 导出文件的路径
     */
    static async exportEvents(
        events: CalendarEvent[],
        fileName: string = 'daymate-export.ics'
    ): Promise<string> {
        const iCalContent = exportToICalendar(events);
        const filePath = getExportPath(fileName);

        await RNFS.writeFile(filePath, iCalContent, 'utf8');

        return filePath;
    }

    /**
     * 分享导出的 iCalendar 文件
     * @param events 要导出的事件列表
     */
    static async shareEvents(events: CalendarEvent[]): Promise<void> {
        const iCalContent = exportToICalendar(events);
        const fileName = `daymate-${Date.now()}.ics`;
        const filePath = getExportPath(fileName);

        await RNFS.writeFile(filePath, iCalContent, 'utf8');

        if (Platform.OS === 'ios') {
            await Share.share({
                url: `file://${filePath}`,
            });
        } else {
            await Share.share({
                message: iCalContent,
                title: fileName,
            });
        }
    }

    /**
     * 从文件选择器导入 iCalendar 文件
     * @returns 导入的事件列表
     */
    static async importFromPicker(): Promise<CalendarEvent[]> {
        const [result] = await pick({
            type: [types.plainText, types.allFiles],
        });

        if (!result || !result.uri) {
            return [];
        }

        const content = await RNFS.readFile(result.uri, 'utf8');
        return importFromICalendar(content);
    }

    /**
     * 从 iCalendar 内容字符串导入事件
     * @param content iCalendar 格式的字符串
     * @returns 导入的事件列表
     */
    static importFromContent(content: string): CalendarEvent[] {
        return importFromICalendar(content);
    }
}
