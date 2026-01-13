import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent } from '@daymate/shared';

const TRASH_STORAGE_KEY = 'daymate.trash.v1';

export type TrashItemType = 'deleted' | 'completed';

export interface TrashedEvent extends CalendarEvent {
    deletedAt: string; // ISO 日期字符串
    originalDate: string; // 原始日期
    itemType: TrashItemType; // 事项类型：已删除或已完成
}

// 内存缓存
let trashCache: TrashedEvent[] | null = null;
let cacheInitialized = false;

/**
 * 垃圾桶服务 - 管理已删除的事项
 * 支持软删除、恢复、永久删除和自动清理
 */
export class TrashService {
    // 自动清理天数（30天后自动永久删除）
    static AUTO_DELETE_DAYS = 30;

    /**
     * 获取垃圾桶中的所有事项
     */
    static async getTrashItems(): Promise<TrashedEvent[]> {
        if (cacheInitialized && trashCache) {
            return trashCache;
        }

        try {
            const raw = await AsyncStorage.getItem(TRASH_STORAGE_KEY);
            if (!raw) {
                trashCache = [];
                cacheInitialized = true;
                return [];
            }
            const parsed = JSON.parse(raw) as TrashedEvent[];
            // 兼容旧数据：为没有 itemType 的旧数据添加默认值 'deleted'
            const items = Array.isArray(parsed) ? parsed.map(item => ({
                ...item,
                itemType: item.itemType || 'deleted' as TrashItemType,
            })) : [];
            trashCache = items;
            cacheInitialized = true;
            return items;
        } catch (error) {
            console.error('TrashService: 读取垃圾桶失败', error);
            trashCache = [];
            cacheInitialized = true;
            return [];
        }
    }

    /**
     * 将事项移动到垃圾桶
     */
    static async moveToTrash(event: CalendarEvent, itemType: TrashItemType = 'deleted'): Promise<void> {
        const items = await TrashService.getTrashItems();

        const trashedEvent: TrashedEvent = {
            ...event,
            deletedAt: new Date().toISOString(),
            originalDate: event.date,
            itemType,
        };

        items.unshift(trashedEvent); // 新删除的放在最前面
        await TrashService.persistTrash(items);
    }

    /**
     * 获取已删除的事项
     */
    static async getDeletedItems(): Promise<TrashedEvent[]> {
        const items = await TrashService.getTrashItems();
        return items.filter(item => item.itemType === 'deleted');
    }

    /**
     * 获取已完成的事项
     */
    static async getCompletedItems(): Promise<TrashedEvent[]> {
        const items = await TrashService.getTrashItems();
        return items.filter(item => item.itemType === 'completed');
    }

    /**
     * 从垃圾桶恢复事项（返回原始事项）
     */
    static async restoreFromTrash(eventId: string): Promise<CalendarEvent | null> {
        const items = await TrashService.getTrashItems();
        const index = items.findIndex(e => e.id === eventId);

        if (index === -1) return null;

        const trashedEvent = items[index];
        items.splice(index, 1);
        await TrashService.persistTrash(items);

        // 返回不含垃圾桶属性的原始事项
        const { deletedAt, originalDate, ...originalEvent } = trashedEvent;
        return {
            ...originalEvent,
            date: originalDate, // 恢复到原始日期
        };
    }

    /**
     * 永久删除事项
     */
    static async permanentlyDelete(eventId: string): Promise<boolean> {
        const items = await TrashService.getTrashItems();
        const index = items.findIndex(e => e.id === eventId);

        if (index === -1) return false;

        items.splice(index, 1);
        await TrashService.persistTrash(items);
        return true;
    }

    /**
     * 清空垃圾桶
     */
    static async emptyTrash(): Promise<void> {
        await TrashService.persistTrash([]);
    }

    /**
     * 清理过期事项（超过30天的自动删除）
     */
    static async cleanupExpiredItems(): Promise<number> {
        const items = await TrashService.getTrashItems();
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - TrashService.AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000);

        const validItems = items.filter(item => {
            const deletedAt = new Date(item.deletedAt);
            return deletedAt > cutoffDate;
        });

        const deletedCount = items.length - validItems.length;

        if (deletedCount > 0) {
            await TrashService.persistTrash(validItems);
        }

        return deletedCount;
    }

    /**
     * 获取垃圾桶中的事项数量
     */
    static async getTrashCount(): Promise<number> {
        const items = await TrashService.getTrashItems();
        return items.length;
    }

    /**
     * 计算事项距离永久删除的剩余天数
     */
    static getDaysUntilPermanentDelete(trashedEvent: TrashedEvent): number {
        const deletedAt = new Date(trashedEvent.deletedAt);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - deletedAt.getTime()) / (24 * 60 * 60 * 1000));
        return Math.max(0, TrashService.AUTO_DELETE_DAYS - daysPassed);
    }

    /**
     * 持久化垃圾桶数据
     */
    private static async persistTrash(items: TrashedEvent[]): Promise<void> {
        try {
            await AsyncStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
            trashCache = items;
        } catch (error) {
            console.error('TrashService: 保存垃圾桶失败', error);
            throw error;
        }
    }

    /**
     * 清除缓存
     */
    static clearCache(): void {
        trashCache = null;
        cacheInitialized = false;
    }
}
