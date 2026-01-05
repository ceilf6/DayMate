import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarEvent, importFromICalendar, generateId } from '@daymate/shared';

const SUBSCRIPTIONS_KEY = 'daymate.subscriptions.v1';
const SUBSCRIPTION_EVENTS_KEY = 'daymate.subscription_events.v1';

export interface CalendarSubscription {
    id: string;
    name: string;
    url: string;
    color?: string;
    lastSyncAt?: string;
    createdAt: string;
    enabled: boolean;
}

export interface SubscriptionEvent {
    id: string;
    subscriptionId: string;
    subscriptionName: string;
    date: string;
    title: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    location?: string;
    allDay?: boolean;
}

export interface SubscriptionSyncResult {
    subscription: CalendarSubscription;
    events: SubscriptionEvent[];
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
     * 将 webcal:// 协议转换为 https://
     */
    static normalizeUrl(url: string): string {
        let normalized = url.trim();
        if (normalized.startsWith('webcal://')) {
            normalized = normalized.replace('webcal://', 'https://');
        } else if (normalized.startsWith('webcals://')) {
            normalized = normalized.replace('webcals://', 'https://');
        }
        return normalized;
    }

    /**
     * 从 URL 获取 iCalendar 数据
     */
    static async fetchICalendarFromUrl(url: string): Promise<string> {
        const normalizedUrl = this.normalizeUrl(url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

        try {
            const response = await fetch(normalizedUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/calendar, application/calendar+json, */*',
                    'User-Agent': 'DayMate Calendar App',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const text = await response.text();

            if (!text.includes('BEGIN:VCALENDAR')) {
                throw new Error('返回的数据不是有效的 iCalendar 格式');
            }

            return text;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('请求超时，请检查网络连接');
            }
            throw error;
        }
    }

    /**
     * 同步单个订阅
     */
    static async syncSubscription(subscription: CalendarSubscription): Promise<SubscriptionSyncResult> {
        try {
            const icalContent = await this.fetchICalendarFromUrl(subscription.url);
            const rawEvents = importFromICalendar(icalContent);

            // 转换为订阅事件格式
            const events: SubscriptionEvent[] = rawEvents.map(event => ({
                id: event.id,
                subscriptionId: subscription.id,
                subscriptionName: subscription.name,
                date: event.date,
                title: event.title,
                startTime: event.startTime,
                endTime: event.endTime,
                description: event.description,
                location: event.location,
                allDay: event.allDay,
            }));

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

            // 规范化 URL 后再验证
            const normalizedUrl = this.normalizeUrl(url);

            // 尝试解析 URL
            try {
                new URL(normalizedUrl);
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

    /**
     * 保存订阅事件到本地存储
     */
    static async saveSubscriptionEvents(events: SubscriptionEvent[]): Promise<void> {
        // 获取现有的订阅事件
        const existing = await this.getAllSubscriptionEvents();

        // 获取新事件涉及的订阅ID
        const newSubscriptionIds = new Set(events.map(e => e.subscriptionId));

        // 过滤掉这些订阅的旧事件，保留其他订阅的事件
        const filtered = existing.filter(e => !newSubscriptionIds.has(e.subscriptionId));

        // 合并新事件
        const merged = [...filtered, ...events];

        await AsyncStorage.setItem(SUBSCRIPTION_EVENTS_KEY, JSON.stringify(merged));
    }

    /**
     * 获取所有订阅事件
     */
    static async getAllSubscriptionEvents(): Promise<SubscriptionEvent[]> {
        try {
            const raw = await AsyncStorage.getItem(SUBSCRIPTION_EVENTS_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    /**
     * 获取指定日期的订阅事件
     */
    static async getSubscriptionEventsForDate(date: string): Promise<SubscriptionEvent[]> {
        const all = await this.getAllSubscriptionEvents();
        return all.filter(e => e.date === date);
    }

    /**
     * 按日期分组获取订阅事件
     */
    static async getSubscriptionEventsByDate(): Promise<Record<string, SubscriptionEvent[]>> {
        const all = await this.getAllSubscriptionEvents();
        const byDate: Record<string, SubscriptionEvent[]> = {};

        for (const event of all) {
            if (!byDate[event.date]) {
                byDate[event.date] = [];
            }
            byDate[event.date].push(event);
        }

        return byDate;
    }

    /**
     * 删除指定订阅的所有事件
     */
    static async deleteSubscriptionEvents(subscriptionId: string): Promise<void> {
        const all = await this.getAllSubscriptionEvents();
        const filtered = all.filter(e => e.subscriptionId !== subscriptionId);
        await AsyncStorage.setItem(SUBSCRIPTION_EVENTS_KEY, JSON.stringify(filtered));
    }

    /**
     * 清空所有订阅事件
     */
    static async clearAllSubscriptionEvents(): Promise<void> {
        await AsyncStorage.removeItem(SUBSCRIPTION_EVENTS_KEY);
    }
}
