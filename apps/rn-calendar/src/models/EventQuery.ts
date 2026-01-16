import type { CalendarEvent } from '@daymate/shared';

/**
 * 事件查询器
 * 提供流畅的链式API进行事件查询和过滤
 */
export class EventQuery {
    private events: CalendarEvent[];

    constructor(events: CalendarEvent[]) {
        // 创建副本，避免修改原数组
        this.events = [...events];
    }

    /**
     * 按日期过滤
     */
    byDate(date: string): EventQuery {
        this.events = this.events.filter(e => e.date === date);
        return this;
    }

    /**
     * 按日期范围过滤
     */
    byDateRange(startDate: string, endDate: string): EventQuery {
        this.events = this.events.filter(
            e => e.date >= startDate && e.date <= endDate
        );
        return this;
    }

    /**
     * 按分类过滤
     */
    byCategory(category: string): EventQuery {
        this.events = this.events.filter(e => e.category === category);
        return this;
    }

    /**
     * 按优先级过滤
     */
    byPriority(priority: number): EventQuery {
        this.events = this.events.filter(e => e.priority === priority);
        return this;
    }

    /**
     * 按优先级范围过滤
     */
    byPriorityRange(min: number, max: number): EventQuery {
        this.events = this.events.filter(
            e => e.priority && e.priority >= min && e.priority <= max
        );
        return this;
    }

    /**
     * 只返回未完成的事件
     */
    incomplete(): EventQuery {
        this.events = this.events.filter(e => !e.completed);
        return this;
    }

    /**
     * 只返回已完成的事件
     */
    completed(): EventQuery {
        this.events = this.events.filter(e => e.completed);
        return this;
    }

    /**
     * 只返回有提醒的事件
     */
    withReminder(): EventQuery {
        this.events = this.events.filter(
            e => e.reminderMinutes && e.reminderMinutes > 0
        );
        return this;
    }

    /**
     * 只返回全天事件
     */
    allDay(): EventQuery {
        this.events = this.events.filter(e => e.allDay);
        return this;
    }

    /**
     * 只返回定时事件
     */
    timed(): EventQuery {
        this.events = this.events.filter(e => !e.allDay && e.startTime);
        return this;
    }

    /**
     * 按标题搜索（模糊匹配）
     */
    search(keyword: string): EventQuery {
        const lowerKeyword = keyword.toLowerCase();
        this.events = this.events.filter(
            e =>
                e.title.toLowerCase().includes(lowerKeyword) ||
                e.description?.toLowerCase().includes(lowerKeyword) ||
                e.location?.toLowerCase().includes(lowerKeyword)
        );
        return this;
    }

    /**
     * 按日期排序
     */
    sortByDate(order: 'asc' | 'desc' = 'asc'): EventQuery {
        this.events = this.events.sort((a, b) => {
            const comparison = a.date.localeCompare(b.date);
            return order === 'asc' ? comparison : -comparison;
        });
        return this;
    }

    /**
     * 按优先级排序
     */
    sortByPriority(order: 'asc' | 'desc' = 'asc'): EventQuery {
        this.events = this.events.sort((a, b) => {
            const aPriority = a.priority || 9;
            const bPriority = b.priority || 9;
            const comparison = aPriority - bPriority;
            return order === 'asc' ? comparison : -comparison;
        });
        return this;
    }

    /**
     * 按创建时间排序
     */
    sortByCreatedAt(order: 'asc' | 'desc' = 'desc'): EventQuery {
        this.events = this.events.sort((a, b) => {
            const comparison = a.createdAt.localeCompare(b.createdAt);
            return order === 'asc' ? comparison : -comparison;
        });
        return this;
    }

    /**
     * 限制返回数量
     */
    limit(count: number): EventQuery {
        this.events = this.events.slice(0, count);
        return this;
    }

    /**
     * 跳过指定数量
     */
    skip(count: number): EventQuery {
        this.events = this.events.slice(count);
        return this;
    }

    /**
     * 获取所有结果
     */
    get(): CalendarEvent[] {
        return this.events;
    }

    /**
     * 获取第一个结果
     */
    first(): CalendarEvent | undefined {
        return this.events[0];
    }

    /**
     * 获取最后一个结果
     */
    last(): CalendarEvent | undefined {
        return this.events[this.events.length - 1];
    }

    /**
     * 获取结果数量
     */
    count(): number {
        return this.events.length;
    }

    /**
     * 检查是否有结果
     */
    exists(): boolean {
        return this.events.length > 0;
    }
}
