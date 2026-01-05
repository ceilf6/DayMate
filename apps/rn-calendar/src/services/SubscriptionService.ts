import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, importFromICalendar, generateId } from '@daymate/shared';

const SUBSCRIPTIONS_KEY = 'daymate.subscriptions.v1';

export interface CalendarSubscription {
    id: string;
    name: string;
    url: string;
    color?: string;
    lastSyncAt?: string;
    createdAt: string;
    enabled: boolean;
}

export interface SubscriptionSyncResult {
    subscription: CalendarSubscription;
    events: CalendarEvent[];
    success: boolean;
    error?: string;
}

export class SubscriptionService {
    /**
     * 获取所有订阅
     */
    static async getAllSubscriptions(): Promise<CalendarSubscription[]> {
        try {
            const raw = await AsyncStorage.getItem(SUBSCRIPTIONS_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    /**
     * 添加新订阅
     */
    static async addSubscription(name: string, url: string, color?: string): Promise<CalendarSubscription> {
        const subscriptions = await this.getAllSubscriptions();

        const newSubscription: CalendarSubscription = {
            id: generateId(),
            name: name.trim(),
            url: url.trim(),
            color,
            createdAt: new Date().toISOString(),
            enabled: true,
        };

        subscriptions.push(newSubscription);
        await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));

        return newSubscription;
    }

    /**
     * 更新订阅
     */
    static async updateSubscription(
        id: string,
        updates: Partial<Omit<CalendarSubscription, 'id' | 'createdAt'>>
    ): Promise<CalendarSubscription | null> {
        const subscriptions = await this.getAllSubscriptions();
        const index = subscriptions.findIndex(s => s.id === id);

        if (index === -1) return null;

        subscriptions[index] = {
            ...subscriptions[index],
            ...updates,
        };

        await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
        return subscriptions[index];
    }

    /**
     * 删除订阅
     */
    static async deleteSubscription(id: string): Promise<boolean> {
        const subscriptions = await this.getAllSubscriptions();
        const filtered = subscriptions.filter(s => s.id !== id);

        if (filtered.length === subscriptions.length) return false;

        await AsyncStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(filtered));
        return true;
    }

    /**
     * 从 URL 获取 iCalendar 数据
     */
    static async fetchICalendarFromUrl(url: string): Promise<string> {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/calendar, application/calendar+json, */*',
                'User-Agent': 'DayMate Calendar App',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();

        if (!text.includes('BEGIN:VCALENDAR')) {
            throw new Error('返回的数据不是有效的 iCalendar 格式');
        }

        return text;
    }

    /**
     * 同步单个订阅
     */
    static async syncSubscription(subscription: CalendarSubscription): Promise<SubscriptionSyncResult> {
        try {
            const icalContent = await this.fetchICalendarFromUrl(subscription.url);
            const events = importFromICalendar(icalContent);

            // 更新最后同步时间
            await this.updateSubscription(subscription.id, {
                lastSyncAt: new Date().toISOString(),
            });

            return {
                subscription,
                events,
                success: true,
            };
        } catch (error) {
            return {
                subscription,
                events: [],
                success: false,
                error: error instanceof Error ? error.message : '同步失败',
            };
        }
    }

    /**
     * 同步所有启用的订阅
     */
    static async syncAllSubscriptions(): Promise<SubscriptionSyncResult[]> {
        const subscriptions = await this.getAllSubscriptions();
        const enabledSubscriptions = subscriptions.filter(s => s.enabled);

        const results = await Promise.all(
            enabledSubscriptions.map(sub => this.syncSubscription(sub))
        );

        return results;
    }

    /**
     * 验证 URL 是否为有效的 iCalendar 订阅
     */
    static async validateSubscriptionUrl(url: string): Promise<{ valid: boolean; error?: string; eventCount?: number }> {
        try {
            // 基本 URL 格式验证
            if (!url.trim()) {
                return { valid: false, error: '请输入订阅地址' };
            }

            // 尝试解析 URL
            try {
                new URL(url);
            } catch {
                return { valid: false, error: '无效的 URL 格式' };
            }

            // 尝试获取内容
            const content = await this.fetchICalendarFromUrl(url);
            const events = importFromICalendar(content);

            return {
                valid: true,
                eventCount: events.length
            };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : '验证失败'
            };
        }
    }
}
