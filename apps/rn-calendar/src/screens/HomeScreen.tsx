import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ImageBackground,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { Theme } from 'react-native-calendars/src/types';

import type { CalendarEvent } from '@daymate/shared';
import {
    // Lunar Utils
    solarToLunar,
    getLunarShortString,
    getLunarHoliday,
    getSolarHoliday,
    getAllHolidays,
    // Date Utils
    getToday,
    addDays,
    // Priority Utils
    getPriorityColors,
    getPriorityIndicator,
    isHighPriority,
    comparePriority,
} from '@daymate/shared';
import { EventStorage } from '../services/EventStorage';
import { ReminderService } from '../services/ReminderService';
import { ImportExportService } from '../services/ImportExportService';
import { SubscriptionService, SubscriptionEvent } from '../services/SubscriptionService';
import { TrashService } from '../services/TrashService';
// 导入日历本地化配置（必须在使用 Calendar 组件之前）
import '../services/CalendarLocale';
import AddEventModal from '../components/AddEventModal';
import EventDetailModal from '../components/EventDetailModal';
import ImportExportModal from '../components/ImportExportModal';
import SubscriptionModal from '../components/SubscriptionModal';
import SettingsModal from '../components/SettingsModal';
import SwipeableEventItem from '../components/SwipeableEventItem';
import QuickAddTaskModal from '../components/QuickAddTaskModal';
import TrashModal from '../components/TrashModal';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBackground } from '../contexts/BackgroundContext';

const HomeScreen = () => {
    const { t, currentLanguage } = useI18n();
    const { colors, isDarkMode } = useTheme();
    const { backgroundImage } = useBackground();

    type ViewMode = 'month' | 'week' | 'day';
    const today = useMemo(() => getToday(), []);

    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [viewHistory, setViewHistory] = useState<ViewMode[]>([]);
    const [selectedDate, setSelectedDate] = useState(today);

    // 进入下一层视图（月->周->日）
    const drillDown = useCallback((targetDate?: string) => {
        if (targetDate) {
            setSelectedDate(targetDate);
        }
        if (viewMode === 'month') {
            setViewHistory(prev => [...prev, 'month']);
            setViewMode('week');
        } else if (viewMode === 'week') {
            setViewHistory(prev => [...prev, 'week']);
            setViewMode('day');
        }
    }, [viewMode]);

    // 返回上一层视图
    const goBack = useCallback(() => {
        if (viewHistory.length > 0) {
            const newHistory = [...viewHistory];
            const previousView = newHistory.pop();
            setViewHistory(newHistory);
            if (previousView) {
                setViewMode(previousView);
            }
        }
    }, [viewHistory]);

    // 是否可以返回
    const canGoBack = viewHistory.length > 0;
    const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});
    const [incompleteEvents, setIncompleteEvents] = useState<CalendarEvent[]>([]);
    const [subscriptionEventsByDate, setSubscriptionEventsByDate] = useState<Record<string, SubscriptionEvent[]>>({});

    // Modal visibility states
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
    const [isImportExportModalVisible, setIsImportExportModalVisible] = useState(false);
    const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState(false);
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
    const [isQuickAddVisible, setIsQuickAddVisible] = useState(false);
    const [isTrashModalVisible, setIsTrashModalVisible] = useState(false);

    // 展开/收起状态
    const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);
    const [isIncompleteExpanded, setIsIncompleteExpanded] = useState(true);

    // 刷新未完成事项列表
    const refreshIncompleteEvents = useCallback(async () => {
        const incomplete = await EventStorage.getIncompleteEvents();
        setIncompleteEvents(incomplete);
    }, []);

    // 刷新订阅事件
    const refreshSubscriptionEvents = useCallback(async () => {
        const subEvents = await SubscriptionService.getSubscriptionEventsByDate();
        setSubscriptionEventsByDate(subEvents);
    }, []);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            const all = await EventStorage.getAllEventsByDate();
            if (isMounted) {
                setEventsByDate(all);
            }
            // 加载未完成事项
            const incomplete = await EventStorage.getIncompleteEvents();
            if (isMounted) {
                setIncompleteEvents(incomplete);
            }
            // 加载订阅事件
            const subEvents = await SubscriptionService.getSubscriptionEventsByDate();
            if (isMounted) {
                setSubscriptionEventsByDate(subEvents);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    const onDayPress = useCallback((day: any) => {
        const dateString = day.dateString;
        setSelectedDate(dateString);
        // 在月视图中点击日期，进入周视图
        if (viewMode === 'month') {
            drillDown(dateString);
        } else if (viewMode === 'week') {
            // 在周视图中点击日期，进入日视图
            drillDown(dateString);
        }
    }, [viewMode, drillDown]);

    const onMonthChange = useCallback((month: any) => {
        const newDate = month.dateString;
        setSelectedDate(newDate);
    }, []);

    const shiftSelectedDate = (deltaDays: number) => {
        try {
            const base = selectedDate || today;
            const next = addDays(base, deltaDays);
            setSelectedDate(next);
        } catch {
            setSelectedDate(today);
        }
    };

    // 获取当前选中日期所在周的所有日期
    const getWeekDates = useCallback((dateString: string) => {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0 (周日) 到 6 (周六)
        const dates: string[] = [];

        // 从周日开始
        for (let i = 0; i < 7; i++) {
            const offset = i - dayOfWeek;
            dates.push(addDays(dateString, offset));
        }

        return dates;
    }, []);

    // 切换到上一周或下一周
    const shiftWeek = useCallback((direction: 'prev' | 'next') => {
        const offset = direction === 'prev' ? -7 : 7;
        shiftSelectedDate(offset);
    }, [selectedDate, today]);

    const selectedEvents = useMemo(() => {
        const list = eventsByDate[selectedDate] ?? [];
        return [...list].sort((a, b) => {
            // 先按优先级排序（高优先级在前）
            const priorityDiff = comparePriority(a.priority, b.priority);
            if (priorityDiff !== 0) return priorityDiff;
            // 再按开始时间排序
            return (a.startTime ?? '').localeCompare(b.startTime ?? '');
        });
    }, [eventsByDate, selectedDate]);

    // 当前选中日期的订阅事件
    const selectedSubscriptionEvents = useMemo(() => {
        return subscriptionEventsByDate[selectedDate] ?? [];
    }, [subscriptionEventsByDate, selectedDate]);

    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};

        // 标记普通事件日期（蓝色点）
        for (const date of Object.keys(eventsByDate)) {
            if ((eventsByDate[date] ?? []).length > 0) {
                marks[date] = {
                    marked: true,
                    dotColor: '#2196F3',
                };
            }
        }

        // 标记订阅事件日期（橙色点）- 如果没有普通事件则显示橙色点
        for (const date of Object.keys(subscriptionEventsByDate)) {
            if ((subscriptionEventsByDate[date] ?? []).length > 0) {
                if (!marks[date]) {
                    marks[date] = {
                        marked: true,
                        dotColor: '#F59E0B', // 橙色，表示订阅事件
                    };
                }
            }
        }

        if (selectedDate) {
            marks[selectedDate] = {
                ...(marks[selectedDate] ?? {}),
                selected: true,
                selectedColor: '#2196F3',
            };
        }

        return marks;
    }, [eventsByDate, subscriptionEventsByDate, selectedDate]);

    // Modal handlers
    const openAddModal = useCallback(() => {
        if (!selectedDate) return;
        setIsAddModalVisible(true);
    }, [selectedDate]);

    const closeAddModal = useCallback(() => {
        setIsAddModalVisible(false);
    }, []);

    const openDetailModal = (event: CalendarEvent) => {
        setDetailEvent(event);
        setIsDetailModalVisible(true);
    };

    const closeDetailModal = useCallback(() => {
        setIsDetailModalVisible(false);
        setDetailEvent(null);
    }, []);

    const openImportExportModal = useCallback(() => {
        setIsImportExportModalVisible(true);
    }, []);

    const closeImportExportModal = useCallback(() => {
        setIsImportExportModalVisible(false);
    }, []);

    const openSubscriptionModal = useCallback(() => {
        setIsSubscriptionModalVisible(true);
    }, []);

    const closeSubscriptionModal = useCallback(() => {
        setIsSubscriptionModalVisible(false);
    }, []);

    // 处理订阅同步的事件 - 保存到单独的存储，不添加到普通事件中
    const handleSubscriptionSync = useCallback(async (events: SubscriptionEvent[]) => {
        // 如果有新事件，保存到存储
        if (events.length > 0) {
            await SubscriptionService.saveSubscriptionEvents(events);
        }

        // 刷新订阅事件显示（无论是添加还是删除都需要刷新）
        const subEvents = await SubscriptionService.getSubscriptionEventsByDate();
        setSubscriptionEventsByDate(subEvents);
    }, []);

    // Event handlers for modals
    const getAllEvents = useCallback((): CalendarEvent[] => {
        const allEvents: CalendarEvent[] = [];
        for (const dateEvents of Object.values(eventsByDate)) {
            allEvents.push(...dateEvents);
        }
        return allEvents;
    }, [eventsByDate]);

    const isValidTime = (value: string): boolean => {
        const trimmed = value.trim();
        if (!trimmed) return true;
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed);
    };

    const handleSaveEvent = useCallback(async (data: {
        title: string;
        startTime: string;
        endTime: string;
        notes: string;
        reminderMinutes: string;
        priority: number;
    }): Promise<string | null> => {
        if (!selectedDate) return '未选择日期';

        const title = data.title.trim();
        if (!title) return '请输入标题';

        if (!isValidTime(data.startTime) || !isValidTime(data.endTime)) {
            return '时间格式应为 HH:mm';
        }

        const start = data.startTime.trim();
        const end = data.endTime.trim();
        if (start && end && end < start) {
            return '结束时间不能早于开始时间';
        }

        const reminderRaw = data.reminderMinutes.trim();
        let reminderMinutes: number | undefined;
        if (reminderRaw) {
            const parsed = Number(reminderRaw);
            if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
                return '提醒分钟应为非负整数';
            }
            if (parsed > 0 && !start) {
                return '设置提醒需要填写开始时间';
            }
            reminderMinutes = parsed;
        }

        try {
            const created = await EventStorage.addEvent({
                date: selectedDate,
                title,
                startTime: start,
                endTime: end,
                description: data.notes.trim(),
                reminderMinutes,
                priority: data.priority > 0 ? data.priority : undefined,
            });

            let finalEvent = created;
            if (created.reminderMinutes && created.reminderMinutes > 0) {
                const notificationId = await ReminderService.scheduleReminder(created);
                if (!notificationId) {
                    return '提醒创建失败（可能未授权或提醒时间已过）';
                }

                const updated = await EventStorage.updateEvent(created.date, created.id, {
                    notificationId,
                    reminderMinutes: created.reminderMinutes,
                });
                if (updated) finalEvent = updated;
            }

            setEventsByDate(prev => {
                const next = { ...prev };
                const existingEvents = next[selectedDate] ?? [];
                // 检查 ID 是否已存在，避免重复添加
                const isDuplicate = existingEvents.some(e => e.id === finalEvent.id);
                if (!isDuplicate) {
                    next[selectedDate] = [...existingEvents, finalEvent];
                }
                return next;
            });

            // 刷新未完成事项列表
            await refreshIncompleteEvents();

            return null; // Success
        } catch {
            return '保存失败，请重试';
        }
    }, [selectedDate, refreshIncompleteEvents]);

    // 验证日期格式 YYYY-MM-DD
    const isValidDate = (dateStr: string): boolean => {
        if (!dateStr) return false;
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateStr)) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    };

    const handleUpdateEvent = useCallback(async (
        event: CalendarEvent,
        data: {
            title: string;
            date: string;
            startTime: string;
            endTime: string;
            notes: string;
            reminderMinutes: string;
            priority: number;
        }
    ): Promise<string | null> => {
        const title = data.title.trim();
        if (!title) return '请输入标题';

        // 如果日期为空，使用 NO_DATE；否则验证日期格式
        const inputDate = data.date.trim();
        const newDate = inputDate === '' ? 'NO_DATE' : inputDate;
        if (newDate !== 'NO_DATE' && !isValidDate(newDate)) {
            return '日期格式应为 YYYY-MM-DD';
        }

        if (!isValidTime(data.startTime) || !isValidTime(data.endTime)) {
            return '时间格式应为 HH:mm';
        }

        const start = data.startTime.trim();
        const end = data.endTime.trim();
        if (start && end && end < start) {
            return '结束时间不能早于开始时间';
        }

        const reminderRaw = data.reminderMinutes.trim();
        let reminderMinutes: number | undefined;
        if (reminderRaw) {
            const parsed = Number(reminderRaw);
            if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
                return '提醒分钟应为非负整数';
            }
            if (parsed > 0 && !start) {
                return '设置提醒需要填写开始时间';
            }
            reminderMinutes = parsed;
        }

        const dateChanged = newDate !== event.date;

        try {
            // 如果之前有提醒，先取消旧的提醒
            if (event.notificationId) {
                await ReminderService.cancelReminder(event.notificationId);
            }

            let finalEvent: CalendarEvent;

            if (dateChanged) {
                // 日期变更：删除旧事项，在新日期创建新事项
                await EventStorage.deleteEvent(event.date, event.id);

                const created = await EventStorage.addEvent({
                    date: newDate,
                    title,
                    startTime: start,
                    endTime: end,
                    description: data.notes.trim(),
                    reminderMinutes,
                    priority: data.priority > 0 ? data.priority : undefined,
                    completed: event.completed, // 保持完成状态
                });

                finalEvent = created;

                // 如果设置了新的提醒，创建新的提醒
                if (finalEvent.reminderMinutes && finalEvent.reminderMinutes > 0) {
                    const notificationId = await ReminderService.scheduleReminder(finalEvent);
                    if (notificationId) {
                        const updatedWithNotification = await EventStorage.updateEvent(finalEvent.date, finalEvent.id, {
                            notificationId,
                        });
                        if (updatedWithNotification) finalEvent = updatedWithNotification;
                    }
                }

                // 更新本地状态：从旧日期移除，添加到新日期
                setEventsByDate(prev => {
                    const next = { ...prev };
                    // 从旧日期移除
                    const oldList = next[event.date] ?? [];
                    const filteredOldList = oldList.filter(e => e.id !== event.id);
                    if (filteredOldList.length === 0) {
                        delete next[event.date];
                    } else {
                        next[event.date] = filteredOldList;
                    }
                    // 添加到新日期（检查是否已存在，避免重复）
                    const newList = next[newDate] ?? [];
                    const existsInNewDate = newList.some(e => e.id === finalEvent.id);
                    if (!existsInNewDate) {
                        next[newDate] = [...newList, finalEvent];
                    } else {
                        // 如果已存在，更新它
                        next[newDate] = newList.map(e => e.id === finalEvent.id ? finalEvent : e);
                    }
                    return next;
                });
            } else {
                // 日期未变更：直接更新
                const updated = await EventStorage.updateEvent(event.date, event.id, {
                    title,
                    startTime: start,
                    endTime: end,
                    description: data.notes.trim(),
                    reminderMinutes,
                    priority: data.priority > 0 ? data.priority : undefined,
                });

                if (!updated) return '更新失败';

                finalEvent = updated;

                // 如果设置了新的提醒，创建新的提醒
                if (finalEvent.reminderMinutes && finalEvent.reminderMinutes > 0) {
                    const notificationId = await ReminderService.scheduleReminder(finalEvent);
                    if (!notificationId) {
                        return '提醒创建失败（可能未授权或提醒时间已过）';
                    }

                    const updatedWithNotification = await EventStorage.updateEvent(finalEvent.date, finalEvent.id, {
                        notificationId,
                        reminderMinutes: finalEvent.reminderMinutes,
                    });
                    if (updatedWithNotification) finalEvent = updatedWithNotification;
                }

                // 更新本地状态
                setEventsByDate(prev => {
                    const next = { ...prev };
                    const list = next[finalEvent.date] ?? [];
                    const index = list.findIndex(e => e.id === finalEvent.id);
                    if (index !== -1) {
                        const newList = [...list];
                        newList[index] = finalEvent;
                        next[finalEvent.date] = newList;
                    }
                    return next;
                });
            }

            // 刷新未完成事项列表
            await refreshIncompleteEvents();

            return null; // 成功
        } catch (error) {
            console.error('更新事项失败:', error);
            return '更新失败，请重试';
        }
    }, [refreshIncompleteEvents]);

    const handleDeleteEvent = useCallback(async (event: CalendarEvent): Promise<boolean> => {
        try {
            if (event.notificationId) {
                await ReminderService.cancelReminder(event.notificationId);
            }

            // 移动到垃圾桶而不是直接删除
            await TrashService.moveToTrash(event);

            const deleted = await EventStorage.deleteEvent(event.date, event.id);
            if (!deleted) return false;

            setEventsByDate(prev => {
                const next = { ...prev };
                const list = next[deleted.date] ?? [];
                const filtered = list.filter(e => e.id !== deleted.id);
                if (filtered.length === 0) delete next[deleted.date];
                else next[deleted.date] = filtered;
                return next;
            });

            // 刷新未完成事项列表
            await refreshIncompleteEvents();

            return true;
        } catch {
            return false;
        }
    }, [refreshIncompleteEvents]);

    // 从垃圾桶恢复事项
    const handleRestoreFromTrash = useCallback(async (event: CalendarEvent): Promise<void> => {
        try {
            // 重新添加事项（已完成状态设为 false，相当于取消完成）
            const restored = await EventStorage.addEvent({
                date: event.date,
                title: event.title,
                description: event.description,
                location: event.location,
                startTime: event.startTime,
                endTime: event.endTime,
                allDay: event.allDay,
                reminderMinutes: event.reminderMinutes,
                category: event.category,
                priority: event.priority,
                completed: false, // 恢复时重置为未完成状态
            });

            // 更新状态
            setEventsByDate(prev => {
                const next = { ...prev };
                const list = next[restored.date] ?? [];
                next[restored.date] = [...list, restored];
                return next;
            });

            // 刷新未完成事项列表
            await refreshIncompleteEvents();
        } catch (error) {
            console.error('恢复事项失败:', error);
            throw error;
        }
    }, [refreshIncompleteEvents]);

    // 切换事项完成状态
    const handleToggleComplete = useCallback(async (event: CalendarEvent): Promise<boolean> => {
        try {
            const updated = await EventStorage.toggleEventComplete(event.date, event.id);
            if (!updated) return false;

            // 处理提醒：完成时取消，未完成时重新设置
            if (updated.completed) {
                // 已完成，取消提醒
                if (updated.notificationId) {
                    await ReminderService.cancelReminder(updated.notificationId);
                }
                // 将已完成的事项保存到垃圾桶
                await TrashService.moveToTrash(updated, 'completed');
            } else {
                // 未完成，重新设置提醒
                if (updated.reminderMinutes && updated.reminderMinutes > 0) {
                    const notificationId = await ReminderService.scheduleReminder(updated);
                    if (notificationId && notificationId !== updated.notificationId) {
                        await EventStorage.updateEvent(updated.date, updated.id, { notificationId });
                    }
                }
            }

            // 更新本地状态（日程区域）
            setEventsByDate(prev => {
                const next = { ...prev };
                const list = next[updated.date] ?? [];
                const index = list.findIndex(e => e.id === updated.id);
                if (index !== -1) {
                    const newList = [...list];
                    newList[index] = updated;
                    next[updated.date] = newList;
                }
                return next;
            });

            // 刷新未完成事项列表
            if (!updated.completed) {
                // 取消完成时立即刷新
                await refreshIncompleteEvents();
            }
            // 完成时的刷新由 onLocalAnimationComplete 回调处理

            return true;
        } catch {
            return false;
        }
    }, [refreshIncompleteEvents]);

    // 快速添加事项处理
    const handleQuickAddTask = useCallback(async (title: string): Promise<string | null> => {
        try {
            // 使用特殊日期键表示无日期的事项
            const NO_DATE_KEY = 'NO_DATE';
            const created = await EventStorage.addEvent({
                date: NO_DATE_KEY,
                title,
                // 不设置时间、提醒等其他属性
            });

            // 更新本地状态
            setEventsByDate(prev => {
                const next = { ...prev };
                const existingEvents = next[NO_DATE_KEY] ?? [];
                const isDuplicate = existingEvents.some(e => e.id === created.id);
                if (!isDuplicate) {
                    next[NO_DATE_KEY] = [...existingEvents, created];
                }
                return next;
            });

            // 刷新未完成事项列表
            await refreshIncompleteEvents();

            return null; // 成功
        } catch {
            return '保存失败，请重试';
        }
    }, [refreshIncompleteEvents]);

    const handleExportShare = useCallback(async () => {
        const events = getAllEvents();
        if (events.length === 0) return;
        await ImportExportService.shareEvents(events);
    }, [getAllEvents]);

    const handleExportCopy = useCallback(async () => {
        const events = getAllEvents();
        if (events.length === 0) return;
        await ImportExportService.copyToClipboard(events);
    }, [getAllEvents]);

    const handleImportFromClipboard = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        try {
            const events = await ImportExportService.importFromClipboard();
            if (events.length === 0) {
                return { success: false, error: '剪贴板中没有有效的日历数据' };
            }

            let savedCount = 0;
            for (const event of events) {
                try {
                    await EventStorage.addEvent({
                        date: event.date,
                        title: event.title,
                        description: event.description,
                        location: event.location,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        allDay: event.allDay,
                        reminderMinutes: event.reminderMinutes,
                        category: event.category,
                        priority: event.priority,
                    });
                    savedCount++;
                } catch {
                    // ignore individual failures
                }
            }

            const all = await EventStorage.getAllEventsByDate();
            setEventsByDate(all);

            return { success: true };
        } catch {
            return { success: false, error: '导入失败，请检查数据格式' };
        }
    }, []);

    const handleImportFromText = useCallback(async (content: string): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            const events = ImportExportService.importFromContent(content);
            if (events.length === 0) {
                return { success: false, error: '没有找到有效的日程数据' };
            }

            let savedCount = 0;
            for (const event of events) {
                try {
                    await EventStorage.addEvent({
                        date: event.date,
                        title: event.title,
                        description: event.description,
                        location: event.location,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        allDay: event.allDay,
                        reminderMinutes: event.reminderMinutes,
                        category: event.category,
                        priority: event.priority,
                    });
                    savedCount++;
                } catch {
                    // ignore individual failures
                }
            }

            const all = await EventStorage.getAllEventsByDate();
            setEventsByDate(all);

            return { success: true, message: t('success.importedCount', { count: savedCount }) as string };
        } catch {
            return { success: false, error: '导入失败，请检查数据格式' };
        }
    }, []);

    const calendarDayFontWeight: '500' | '600' = Platform.OS === 'ios' ? '600' : '500';

    const calendarTheme = useMemo<Theme>(
        () => ({
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',

            textSectionTitleColor: colors.textSecondary,
            monthTextColor: colors.textPrimary,
            arrowColor: colors.textPrimary,

            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: '#ffffff',
            todayTextColor: colors.primary,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textDisabled,

            textDayFontSize: 15,
            textDayFontWeight: calendarDayFontWeight,
            textDayHeaderFontSize: 12,
            textDayHeaderFontWeight: '600',
            textMonthFontSize: 17,
            textMonthFontWeight: '700',
        }),
        [calendarDayFontWeight, colors],
    );

    // 获取当前选中日期的农历信息
    const lunarInfo = useMemo(() => {
        if (!selectedDate) return null;
        const lunar = solarToLunar(selectedDate);
        const holidays = getAllHolidays(selectedDate);
        return {
            lunar,
            holidays,
            yearInfo: `${lunar.yearGanZhi}${lunar.yearShengXiao}年`,
            monthInfo: `${lunar.isLeapMonth ? '闰' : ''}${lunar.monthStr}月${lunar.dayStr}`,
        };
    }, [selectedDate]);

    // 自定义日期组件，显示农历
    const renderDay = useMemo(() => {
        return ({ date, state }: any) => {
            if (!date) return null;

            const dateString = date.dateString;
            const isSelected = dateString === selectedDate;
            const isToday = dateString === today;
            const isDisabled = state === 'disabled';

            const lunar = solarToLunar(dateString);
            const lunarHoliday = getLunarHoliday(dateString);
            const solarHoliday = getSolarHoliday(dateString);
            const isHoliday = !!(lunarHoliday || solarHoliday);

            // 确定农历显示文字
            let lunarText = getLunarShortString(lunar);
            if (solarHoliday) lunarText = solarHoliday;
            else if (lunarHoliday) lunarText = lunarHoliday;

            // 检查是否有事件
            const hasEvent = (eventsByDate[dateString] ?? []).length > 0;

            return (
                <TouchableOpacity
                    onPress={() => {
                        setSelectedDate(dateString);
                        // 点击日期进入周视图
                        drillDown(dateString);
                    }}
                    style={[
                        styles.dayContainer,
                        isSelected && [styles.dayContainerSelected, { backgroundColor: colors.primary }],
                        isToday && !isSelected && [styles.dayContainerToday, { backgroundColor: colors.primaryLight }],
                    ]}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.dayText,
                            { color: colors.textPrimary },
                            isSelected && styles.dayTextSelected,
                            isToday && !isSelected && [styles.dayTextToday, { color: colors.primary }],
                            isDisabled && [styles.dayTextDisabled, { color: colors.textSecondary }],
                        ]}
                    >
                        {date.day}
                    </Text>
                    {/* 只在简体中文时显示农历 */}
                    {currentLanguage === 'zh-CN' && (
                        <Text
                            style={[
                                styles.lunarText,
                                { color: colors.textSecondary },
                                isSelected && styles.lunarTextSelected,
                                isToday && !isSelected && [styles.lunarTextToday, { color: colors.primary }],
                                isDisabled && [styles.lunarTextDisabled, { color: colors.textSecondary }],
                                isHoliday && !isSelected && !isToday && styles.lunarTextHoliday,
                                !!lunar.solarTerm && !isHoliday && !isSelected && !isToday && styles.lunarTextSolarTerm,
                            ]}
                            numberOfLines={1}
                        >
                            {lunarText}
                        </Text>
                    )}
                    {hasEvent && !isSelected && (
                        <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />
                    )}
                </TouchableOpacity>
            );
        };
    }, [selectedDate, today, isDarkMode, eventsByDate, drillDown, colors, currentLanguage]);

    // 渲染主内容
    const renderContent = () => (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
            {/* 顶部操作栏 - 四个按钮同行 */}
            <View style={[styles.topActionRowCard, { backgroundColor: backgroundImage ? `${colors.primarySurface}E6` : colors.primarySurface }]}>
                {/* 左侧：视图切换 */}
                {canGoBack ? (
                    <TouchableOpacity
                        onPress={goBack}
                        accessibilityRole="button"
                        style={[styles.topActionButton, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.backButtonIcon]}>‹</Text>
                        <Text style={[styles.topActionButtonText]}>
                            {viewMode === 'week' ? t('calendar.month', '月') as string : t('calendar.week', '周') as string}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.topActionButton, { backgroundColor: colors.primary }]}
                        disabled>
                        <Text style={[styles.topActionButtonText]}>
                            {viewMode === 'month' && t('calendar.monthView', '月视图') as string}
                            {viewMode === 'week' && t('calendar.weekView', '周视图') as string}
                            {viewMode === 'day' && t('calendar.dayView', '日视图') as string}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* 设置 */}
                <TouchableOpacity
                    onPress={() => setIsSettingsModalVisible(true)}
                    style={[styles.topActionButton, { backgroundColor: colors.primary }]}
                    accessibilityRole="button">
                    <Text style={[styles.topActionButtonText]}>
                        {t('settings.title', '设置') as string}
                    </Text>
                </TouchableOpacity>

                {/* 订阅 */}
                <TouchableOpacity
                    onPress={openSubscriptionModal}
                    style={[styles.topActionButton, { backgroundColor: colors.primary }]}
                    accessibilityRole="button">
                    <Text style={[styles.topActionButtonText]}>
                        {t('subscription.title', '订阅') as string}
                    </Text>
                </TouchableOpacity>

                {/* 导入/导出 */}
                <TouchableOpacity
                    onPress={openImportExportModal}
                    style={[styles.topActionButton, { backgroundColor: colors.primary }]}
                    accessibilityRole="button">
                    <Text style={[styles.topActionButtonText]}>
                        {t('importExport.title', '导入/导出') as string}
                    </Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'day' ? (
                <View style={[styles.dayNavRow, { backgroundColor: colors.primarySurface }]}>
                    <TouchableOpacity
                        onPress={() => shiftSelectedDate(-1)}
                        accessibilityRole="button"
                        style={[styles.dayNavButton, { backgroundColor: colors.primary }]}>
                        <Text style={styles.dayNavButtonText}>
                            {t('calendar.previousDay', '上一天') as string}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.dayNavTitleContainer}>
                        <Text style={[styles.dayNavTitle, { color: colors.textPrimary }]}>
                            {selectedDate}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => shiftSelectedDate(1)}
                        accessibilityRole="button"
                        style={[styles.dayNavButton, { backgroundColor: colors.primary }]}>
                        <Text style={styles.dayNavButtonText}>
                            {t('calendar.nextDay', '下一天') as string}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : viewMode === 'week' ? (
                <>
                    {/* 周视图导航行 */}
                    <View style={[styles.dayNavRow, { backgroundColor: colors.primarySurface }]}>
                        <TouchableOpacity
                            onPress={() => shiftWeek('prev')}
                            accessibilityRole="button"
                            style={[styles.dayNavButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.dayNavButtonText}>
                                {t('calendar.previousWeek', '上一周') as string}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.dayNavTitleContainer}>
                            <Text style={[styles.dayNavTitle, { color: colors.textPrimary }]}>
                                {selectedDate}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => shiftWeek('next')}
                            accessibilityRole="button"
                            style={[styles.dayNavButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.dayNavButtonText}>
                                {t('calendar.nextWeek', '下一周') as string}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 周视图日历卡片 */}
                    <View style={[styles.calendarCard, { backgroundColor: colors.primarySurface }]}>
                        {/* 星期标题行 */}
                        <View style={styles.weekViewRow}>
                            {(t('calendar.dayNamesShort', undefined, { returnObjects: true }) as string[]).map((day, index) => (
                                <View key={index} style={styles.weekViewDayContainer}>
                                    <Text style={[styles.weekDayHeaderText, { color: colors.textSecondary }]}>
                                        {day}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* 日期数字行 */}
                        <View style={styles.weekViewRow}>
                            {getWeekDates(selectedDate).map((dateString, index) => {
                                const date = new Date(dateString);
                                const dayNumber = date.getDate();
                                const isSelected = dateString === selectedDate;
                                const isToday = dateString === today;
                                const hasEvent = (eventsByDate[dateString] ?? []).length > 0;

                                const lunar = solarToLunar(dateString);
                                const lunarHoliday = getLunarHoliday(dateString);
                                const solarHoliday = getSolarHoliday(dateString);
                                const isHoliday = !!(lunarHoliday || solarHoliday);

                                let lunarText = getLunarShortString(lunar);
                                if (solarHoliday) lunarText = solarHoliday;
                                else if (lunarHoliday) lunarText = lunarHoliday;

                                return (
                                    <TouchableOpacity
                                        key={dateString}
                                        style={styles.weekViewDayContainer}
                                        onPress={() => {
                                            setSelectedDate(dateString);
                                            drillDown(dateString);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={[
                                                styles.weekViewDayContent,
                                                isSelected && [styles.weekViewDaySelected, { backgroundColor: colors.primary }],
                                                isToday && !isSelected && [styles.weekViewDayToday, { backgroundColor: colors.primaryLight }],
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.weekViewDayNumber,
                                                    { color: colors.textPrimary },
                                                    isSelected && styles.weekViewDayNumberSelected,
                                                    isToday && !isSelected && [styles.weekViewDayNumberToday, { color: colors.primary }],
                                                ]}
                                            >
                                                {dayNumber}
                                            </Text>
                                            {/* 只在简体中文时显示农历 */}
                                            {currentLanguage === 'zh-CN' && (
                                                <Text
                                                    style={[
                                                        styles.weekViewLunarText,
                                                        { color: colors.textTertiary },
                                                        isSelected && styles.weekViewLunarTextSelected,
                                                        isToday && !isSelected && [styles.weekViewLunarTextToday, { color: colors.primary }],
                                                        isHoliday && !isSelected && !isToday && styles.lunarTextHoliday,
                                                        !!lunar.solarTerm && !isHoliday && !isSelected && !isToday && styles.lunarTextSolarTerm,
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {lunarText}
                                                </Text>
                                            )}
                                            {hasEvent && !isSelected && (
                                                <View style={[styles.weekViewEventDot, { backgroundColor: colors.primary }]} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </>
            ) : (
                <View style={[styles.calendarCard, { backgroundColor: colors.primarySurface }]}>
                    <Calendar
                        key={`month-${currentLanguage}-${isDarkMode}`}
                        current={selectedDate}
                        onDayPress={onDayPress}
                        onMonthChange={onMonthChange}
                        markedDates={markedDates}
                        theme={calendarTheme}
                        dayComponent={renderDay}
                        hideExtraDays={false}
                    />
                </View>
            )}

            {/* 农历信息和订阅日历 - 合并显示 */}
            {(currentLanguage === 'zh-CN' && lunarInfo) || selectedSubscriptionEvents.length > 0 ? (
                <View style={[styles.lunarInfoCard, { backgroundColor: colors.primarySurface }]}>
                    {/* 农历信息 - 只在简体中文时显示 */}
                    {currentLanguage === 'zh-CN' && lunarInfo && (
                        <View style={styles.infoRow}>
                            <Text style={[styles.lunarInfoYear, { color: colors.textPrimary }]}>
                                {lunarInfo.yearInfo}
                            </Text>
                            <Text style={[styles.lunarInfoDate, { color: colors.textSecondary }]}>
                                {lunarInfo.monthInfo}
                                {lunarInfo.holidays.length > 0 && ` · ${lunarInfo.holidays.join(' ')}`}
                            </Text>
                        </View>
                    )}
                    {/* 订阅日历事件 */}
                    {selectedSubscriptionEvents.map((event, index) => (
                        <View key={event.id || index} style={styles.infoRow}>
                            <Text style={[styles.lunarInfoYear, { color: colors.textPrimary }]}>
                                {event.subscriptionName || t('subscription.title', '订阅')}
                            </Text>
                            <Text style={[styles.lunarInfoDate, { color: colors.textSecondary }]}>
                                {event.title}
                            </Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {selectedDate ? (
                <View style={[styles.eventSection, { backgroundColor: colors.primarySurface, borderRadius: 16, marginHorizontal: 12 }]}>
                    <View style={styles.eventHeaderRow}>
                        <TouchableOpacity
                            style={styles.sectionTitleRow}
                            onPress={() => setIsScheduleExpanded(!isScheduleExpanded)}
                            activeOpacity={0.7}>
                            <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                                {isScheduleExpanded ? '▼' : '▶'}
                            </Text>
                            <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                                {t('event.eventsOnDate', { date: selectedDate }) as string}
                            </Text>
                            <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
                                ({selectedEvents.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={openAddModal}
                            accessibilityRole="button">
                            <Text style={styles.addButtonText}>{t('event.addEvent', '添加日程') as string}</Text>
                        </TouchableOpacity>
                    </View>

                    {isScheduleExpanded && (
                        selectedEvents.length === 0 ? (
                            <View style={[styles.eventCard, { backgroundColor: colors.primaryContent }]}>
                                <Text style={[styles.eventText, { color: colors.textSecondary }]}>
                                    {t('event.noEvents', '暂无日程') as string}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.eventList}>
                                {selectedEvents.map(event => (
                                    <SwipeableEventItem
                                        key={event.id}
                                        event={event}
                                        onPress={() => openDetailModal(event)}
                                        onToggleComplete={() => handleToggleComplete(event)}
                                        onDelete={() => handleDeleteEvent(event)}
                                        showDate={false}
                                        onLocalAnimationComplete={refreshIncompleteEvents}
                                    />
                                ))}
                            </View>
                        )
                    )}
                </View>
            ) : null}

            {/* 未完成事项区域 */}
            <View style={[styles.eventSection, { backgroundColor: colors.primarySurface, borderRadius: 16, marginHorizontal: 12, marginTop: 6 }]}>
                <View style={styles.eventHeaderRow}>
                    <TouchableOpacity
                        style={styles.sectionTitleRow}
                        onPress={() => setIsIncompleteExpanded(!isIncompleteExpanded)}
                        activeOpacity={0.7}>
                        <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                            {isIncompleteExpanded ? '▼' : '▶'}
                        </Text>
                        <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                            {t('event.incompleteEvents', '待完成事项') as string}
                        </Text>
                        <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
                            ({incompleteEvents.length})
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => setIsTrashModalVisible(true)}
                            accessibilityRole="button">
                            <Text style={styles.addButtonText}>{t('trash.title', '垃圾桶') as string}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => setIsQuickAddVisible(true)}
                            accessibilityRole="button">
                            <Text style={styles.addButtonText}>{t('event.quickAdd', '快速添加') as string}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isIncompleteExpanded && (
                    incompleteEvents.length === 0 ? (
                        <View style={[styles.eventCard, { backgroundColor: colors.primaryContent }]}>
                            <Text style={[styles.eventText, { color: colors.textSecondary }]}>
                                {t('event.noIncompleteEvents', '暂无待完成事项') as string}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.eventList}>
                            {incompleteEvents.map(event => (
                                <SwipeableEventItem
                                    key={event.id}
                                    event={event}
                                    onPress={() => openDetailModal(event)}
                                    onToggleComplete={() => handleToggleComplete(event)}
                                    onDelete={() => handleDeleteEvent(event)}
                                    showDate={true}
                                    onLocalAnimationComplete={refreshIncompleteEvents}
                                />
                            ))}
                        </View>
                    )
                )}
            </View>

            {/* Modal Components - only rendered when visible */}
            <AddEventModal
                visible={isAddModalVisible}
                selectedDate={selectedDate}
                onClose={closeAddModal}
                onSave={handleSaveEvent}
            />

            <EventDetailModal
                visible={isDetailModalVisible}
                event={detailEvent}
                onClose={closeDetailModal}
                onDelete={handleDeleteEvent}
                onUpdate={handleUpdateEvent}
            />

            <ImportExportModal
                visible={isImportExportModalVisible}
                onClose={closeImportExportModal}
                onExportShare={handleExportShare}
                onExportCopy={handleExportCopy}
                onImportFromClipboard={handleImportFromClipboard}
                onImportFromText={handleImportFromText}
            />

            <SubscriptionModal
                visible={isSubscriptionModalVisible}
                onClose={closeSubscriptionModal}
                onSubscriptionSync={handleSubscriptionSync}
            />

            <SettingsModal
                visible={isSettingsModalVisible}
                onClose={() => setIsSettingsModalVisible(false)}
            />

            <QuickAddTaskModal
                visible={isQuickAddVisible}
                onClose={() => setIsQuickAddVisible(false)}
                onSave={handleQuickAddTask}
            />

            <TrashModal
                visible={isTrashModalVisible}
                onClose={() => setIsTrashModalVisible(false)}
                onRestore={handleRestoreFromTrash}
            />
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
            {backgroundImage ? (
                <ImageBackground
                    source={{ uri: backgroundImage.uri }}
                    style={styles.backgroundImage}
                    imageStyle={{ opacity: backgroundImage.opacity }}>
                    <SafeAreaView style={styles.safeArea}>
                        {renderContent()}
                    </SafeAreaView>
                </ImageBackground>
            ) : (
                <SafeAreaView style={styles.safeArea}>
                    {renderContent()}
                </SafeAreaView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
    },
    subtitle: {
        fontSize: 14,
        color: '#666666',
        marginTop: 5,
    },
    // 返回按钮图标样式
    backButtonIcon: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '300',
        marginRight: 2,
        marginTop: -2,
    },
    calendarCard: {
        marginBottom: 6,
        marginHorizontal: 12,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 8,
        // backgroundColor 由内联样式 colors.primarySurface 提供
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    // 周视图样式
    weekViewRow: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    weekViewDayContainer: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    weekDayHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    weekViewDayContent: {
        width: 44,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    weekViewDaySelected: {
    },
    weekViewDayToday: {
    },
    weekViewDayNumber: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    weekViewDayNumberSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    weekViewDayNumberToday: {
        fontWeight: '600',
    },
    weekViewLunarText: {
        fontSize: 10,
    },
    weekViewLunarTextSelected: {
        color: 'rgba(255, 255, 255, 0.85)',
    },
    weekViewLunarTextToday: {
    },
    weekViewEventDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    dayNavRow: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 12,
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        // backgroundColor 由内联样式 colors.primarySurface 提供
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    dayNavButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    dayNavButtonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
        color: '#ffffff',
    },
    dayNavTitle: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '700',
    },

    eventSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        // marginTop: 12,
    },
    eventHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    expandIcon: {
        fontSize: 10,
        marginRight: 8,
        width: 12,
    },
    countBadge: {
        fontSize: 14,
        marginLeft: 6,
    },
    eventTitle: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '700',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        width: 80,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '600',
    },
    eventCard: {
        padding: 16,
        borderRadius: 16,
        // backgroundColor 由内联样式 colors.primaryContent 提供
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    eventText: {
        fontSize: 14,
        lineHeight: 20,
    },

    eventList: {
        gap: 10,
    },
    eventItem: {
        flexDirection: 'row',
        borderRadius: 14,
        // backgroundColor 由内联样式 colors.primaryContent 提供
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 1,
        overflow: 'hidden',
    },
    priorityIndicator: {
        width: 4,
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    eventItemContent: {
        flex: 1,
        padding: 14,
    },
    eventTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    prioritySymbol: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    // 完成状态圆圈样式
    completeCircleContainer: {
        paddingLeft: 12,
        paddingVertical: 14,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    completeCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        marginTop: -1,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    statusBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '600',
    },
    eventItemTitle: {
        flex: 1,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
    },
    eventItemMeta: {
        fontSize: 13,
        lineHeight: 18,
    },
    eventItemNotes: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 18,
    },

    detailRow: {
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 4,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        lineHeight: 20,
    },
    priorityDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // 农历信息卡片样式
    lunarInfoCard: {
        marginHorizontal: 12,
        marginBottom: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        // backgroundColor 由内联样式 colors.primarySurface 提供
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
        flexDirection: 'column',
        gap: 6,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lunarInfoYear: {
        fontSize: 15,
        fontWeight: '600',
        flexShrink: 0,
    },
    lunarInfoDate: {
        fontSize: 13,
        flexShrink: 1,
        textAlign: 'right',
    },

    // 日期导航标题容器 - 绝对定位居中
    dayNavTitleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
    },

    // 自定义日期单元格样式
    dayContainer: {
        width: 44,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    dayContainerSelected: {
    },
    dayContainerToday: {
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    dayTextToday: {
        fontWeight: '600',
    },
    dayTextDisabled: {
    },
    lunarText: {
        fontSize: 10,
    },
    lunarTextSelected: {
        color: 'rgba(255, 255, 255, 0.85)',
    },
    lunarTextToday: {
    },
    lunarTextDisabled: {
    },
    lunarTextHoliday: {
        color: '#EF4444',
    },
    lunarTextSolarTerm: {
        color: '#10B981',
    },
    eventDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
    },

    // 顶部操作栏样式
    topActionRowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 12,
        // marginTop: 8,
        marginBottom: 6,
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderRadius: 12,
        gap: 6,
    },
    topActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 10,
        borderRadius: 8,
    },
    topActionButtonText: {
        fontSize: 13,
        color: '#ffffff',
        fontWeight: '600',
    },
    appTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
});

export default HomeScreen;
