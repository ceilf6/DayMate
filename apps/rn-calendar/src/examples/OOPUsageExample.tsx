/**
 * OOP 在 React 组件中的应用示例
 * 展示如何在 HomeScreen 等组件中使用 EventQuery、EventFormatter 等类
 */

import { useMemo } from 'react';
import { EventQuery, EventFormatter } from '../models';
import type { CalendarEvent } from '@daymate/shared';

// ========== 示例 1: 使用 EventQuery 进行事件查询 ==========

export function useEventQuery(events: CalendarEvent[], selectedDate: string) {
    // 获取选定日期的未完成事件，按优先级排序
    const todayEvents = useMemo(() => {
        return new EventQuery(events)
            .byDate(selectedDate)
            .incomplete()
            .sortByPriority('asc')
            .get();
    }, [events, selectedDate]);

    // 获取高优先级的未完成事件
    const highPriorityEvents = useMemo(() => {
        return new EventQuery(events)
            .incomplete()
            .byPriorityRange(1, 3)
            .sortByDate('asc')
            .get();
    }, [events]);

    // 获取即将到来的有提醒的事件
    const upcomingReminders = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return new EventQuery(events)
            .byDateRange(today, '9999-12-31')
            .incomplete()
            .withReminder()
            .sortByDate('asc')
            .limit(5)
            .get();
    }, [events]);

    return {
        todayEvents,
        highPriorityEvents,
        upcomingReminders,
    };
}

// ========== 示例 2: 使用 EventFormatter 格式化显示 ==========

export function useEventFormatter(locale: string) {
    const formatter = useMemo(() => new EventFormatter(locale), [locale]);

    // 格式化事件摘要
    const formatEventSummary = (event: CalendarEvent) => {
        return formatter.formatSummary(event);
    };

    // 格式化事件时间
    const formatEventTime = (event: CalendarEvent) => {
        return formatter.formatTimeRange(event);
    };

    // 格式化提醒信息
    const formatReminder = (reminderMinutes?: number) => {
        return formatter.formatReminder(reminderMinutes);
    };

    return {
        formatter,
        formatEventSummary,
        formatEventTime,
        formatReminder,
    };
}

// ========== 示例 3: 在组件中使用 ==========

/*
// 在 HomeScreen 中使用：

const HomeScreen = () => {
    const { currentLanguage } = useI18n();
    const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
    const [selectedDate, setSelectedDate] = useState(getToday());

    // 获取所有事件的扁平数组
    const allEvents = useMemo(() => {
        return Object.values(eventsByDate).flat();
    }, [eventsByDate]);

    // 使用 EventQuery 查询
    const { todayEvents, highPriorityEvents, upcomingReminders } = useEventQuery(
        allEvents,
        selectedDate
    );

    // 使用 EventFormatter 格式化
    const { formatEventSummary, formatEventTime } = useEventFormatter(currentLanguage);

    return (
        <View>
            <Text>今日事项 ({todayEvents.length})</Text>
            {todayEvents.map(event => (
                <View key={event.id}>
                    <Text>{formatEventSummary(event)}</Text>
                    <Text>{formatEventTime(event)}</Text>
                </View>
            ))}

            <Text>高优先级事项 ({highPriorityEvents.length})</Text>
            {highPriorityEvents.map(event => (
                <View key={event.id}>
                    <Text>{formatEventSummary(event)}</Text>
                </View>
            ))}
        </View>
    );
};
*/
