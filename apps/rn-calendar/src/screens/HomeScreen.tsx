import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';
import { Calendar, CalendarProvider, WeekCalendar } from 'react-native-calendars';
import type { Theme } from 'react-native-calendars/src/types';

import type { CalendarEvent } from '@daymate/shared';
import {
    // Lunar Utils
    solarToLunar,
    getAllHolidays,
    // Date Utils
    getToday,
    addDays,
    // Priority Utils
    comparePriority,
} from '@daymate/shared';
import { EventStorage } from '../services/EventStorage';
import { ReminderService } from '../services/ReminderService';
import { ImportExportService } from '../services/ImportExportService';
import DayCell from '../components/DayCell';
import EventItem from '../components/EventItem';
import AddEventModal from '../components/AddEventModal';
import EventDetailModal from '../components/EventDetailModal';
import ImportExportModal from '../components/ImportExportModal';

const HomeScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';

    type ViewMode = 'month' | 'week' | 'day';
    const today = useMemo(() => getToday(), []);

    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [selectedDate, setSelectedDate] = useState(today);
    const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});

    // Modal visibility states
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
    const [isImportExportModalVisible, setIsImportExportModalVisible] = useState(false);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            const all = await EventStorage.getAllEventsByDate();
            if (isMounted) setEventsByDate(all);
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    const onDayPress = useCallback((day: any) => {
        setSelectedDate(day.dateString);
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

    const markedDates = useMemo(() => {
        const marks: Record<string, any> = {};

        for (const date of Object.keys(eventsByDate)) {
            if ((eventsByDate[date] ?? []).length > 0) {
                marks[date] = {
                    marked: true,
                    dotColor: '#2196F3',
                };
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
    }, [eventsByDate, selectedDate]);

    // Modal handlers
    const openAddModal = useCallback(() => {
        if (!selectedDate) return;
        setIsAddModalVisible(true);
    }, [selectedDate]);

    const closeAddModal = useCallback(() => {
        setIsAddModalVisible(false);
    }, []);

    const openDetailModal = useCallback((event: CalendarEvent) => {
        setDetailEvent(event);
        setIsDetailModalVisible(true);
    }, []);

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
                next[selectedDate] = [...(next[selectedDate] ?? []), finalEvent];
                return next;
            });

            return null; // Success
        } catch {
            return '保存失败，请重试';
        }
    }, [selectedDate]);

    const handleDeleteEvent = useCallback(async (event: CalendarEvent): Promise<boolean> => {
        try {
            if (event.notificationId) {
                await ReminderService.cancelReminder(event.notificationId);
            }

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

            return true;
        } catch {
            return false;
        }
    }, []);

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

            return { success: true, message: `成功导入 ${savedCount} 条日程！` };
        } catch {
            return { success: false, error: '导入失败，请检查数据格式' };
        }
    }, []);

    const calendarDayFontWeight: '500' | '600' = Platform.OS === 'ios' ? '600' : '500';

    const calendarTheme = useMemo<Theme>(
        () => ({
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',

            textSectionTitleColor: isDarkMode ? '#A1A1AA' : '#6B7280',
            monthTextColor: isDarkMode ? '#F4F4F5' : '#111827',
            arrowColor: isDarkMode ? '#F4F4F5' : '#111827',

            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: isDarkMode ? '#E5E7EB' : '#111827',
            textDisabledColor: isDarkMode ? '#52525B' : '#D1D5DB',

            textDayFontSize: 15,
            textDayFontWeight: calendarDayFontWeight,
            textDayHeaderFontSize: 12,
            textDayHeaderFontWeight: '600',
            textMonthFontSize: 17,
            textMonthFontWeight: '700',
        }),
        [calendarDayFontWeight, isDarkMode],
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

    // 处理日期点击 - 使用 useCallback 避免重新创建
    const handleDayPress = useCallback((dateString: string) => {
        setSelectedDate(dateString);
    }, []);

    // 自定义日期组件，使用 memoized DayCell
    const renderDay = useCallback(({ date, state }: any) => {
        if (!date) return null;
        const hasEvent = (eventsByDate[date.dateString] ?? []).length > 0;
        return (
            <DayCell
                date={date}
                state={state}
                selectedDate={selectedDate}
                today={today}
                hasEvent={hasEvent}
                onPress={handleDayPress}
            />
        );
    }, [selectedDate, today, eventsByDate, handleDayPress]);

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
            <ScrollView contentInsetAdjustmentBehavior="automatic">
                {/* <View style={styles.header}>
                    <Text style={[styles.title, isDarkMode && styles.textDark]}>
                        DayMate 日历
                    </Text>
                    <Text style={[styles.subtitle, isDarkMode && styles.textDark]}>
                        跨平台日程管理
                    </Text>
                </View> */}

                {/* 顶部操作栏 */}
                <View style={styles.topActionRow}>
                    <Text style={[styles.appTitle, isDarkMode && styles.textPrimaryDark]}>
                        DayMate
                    </Text>
                    <TouchableOpacity
                        onPress={openImportExportModal}
                        style={[styles.importExportButton, isDarkMode && styles.importExportButtonDark]}
                        accessibilityRole="button">
                        <Text style={[styles.importExportButtonText, isDarkMode && styles.textPrimaryDark]}>
                            导入/导出
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.viewModeRow, isDarkMode && styles.viewModeRowDark]}>
                    <TouchableOpacity
                        onPress={() => setViewMode('month')}
                        accessibilityRole="button"
                        style={[
                            styles.viewModeButton,
                            isDarkMode && styles.viewModeButtonDark,
                            viewMode === 'month' && styles.viewModeButtonActive,
                            isDarkMode && viewMode === 'month' && styles.viewModeButtonActiveDark,
                        ]}>
                        <Text
                            style={[
                                styles.viewModeButtonText,
                                isDarkMode && styles.viewModeButtonTextDark,
                                viewMode === 'month' && styles.viewModeButtonTextActive,
                                isDarkMode && viewMode === 'month' && styles.viewModeButtonTextActiveDark,
                            ]}>
                            月
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('week')}
                        accessibilityRole="button"
                        style={[
                            styles.viewModeButton,
                            isDarkMode && styles.viewModeButtonDark,
                            viewMode === 'week' && styles.viewModeButtonActive,
                            isDarkMode && viewMode === 'week' && styles.viewModeButtonActiveDark,
                        ]}>
                        <Text
                            style={[
                                styles.viewModeButtonText,
                                isDarkMode && styles.viewModeButtonTextDark,
                                viewMode === 'week' && styles.viewModeButtonTextActive,
                                isDarkMode && viewMode === 'week' && styles.viewModeButtonTextActiveDark,
                            ]}>
                            周
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('day')}
                        accessibilityRole="button"
                        style={[
                            styles.viewModeButton,
                            isDarkMode && styles.viewModeButtonDark,
                            viewMode === 'day' && styles.viewModeButtonActive,
                            isDarkMode && viewMode === 'day' && styles.viewModeButtonActiveDark,
                        ]}>
                        <Text
                            style={[
                                styles.viewModeButtonText,
                                isDarkMode && styles.viewModeButtonTextDark,
                                viewMode === 'day' && styles.viewModeButtonTextActive,
                                isDarkMode && viewMode === 'day' && styles.viewModeButtonTextActiveDark,
                            ]}>
                            日
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 农历信息显示 */}
                {lunarInfo && (
                    <View style={[styles.lunarInfoCard, isDarkMode && styles.lunarInfoCardDark]}>
                        <Text style={[styles.lunarInfoYear, isDarkMode && styles.textPrimaryDark]}>
                            {lunarInfo.yearInfo}
                        </Text>
                        <Text style={[styles.lunarInfoDate, isDarkMode && styles.textSecondaryDark]}>
                            {lunarInfo.monthInfo}
                            {lunarInfo.holidays.length > 0 && ` · ${lunarInfo.holidays.join(' ')}`}
                        </Text>
                    </View>
                )}

                {viewMode === 'day' ? (
                    <View style={[styles.dayNavRow, isDarkMode && styles.dayNavRowDark]}>
                        <TouchableOpacity
                            onPress={() => shiftSelectedDate(-1)}
                            accessibilityRole="button"
                            style={[styles.dayNavButton, isDarkMode && styles.dayNavButtonDark]}>
                            <Text style={[styles.dayNavButtonText, isDarkMode && styles.textPrimaryDark]}>
                                上一天
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.dayNavTitleContainer}>
                            <Text style={[styles.dayNavTitle, isDarkMode && styles.textPrimaryDark]}>
                                {selectedDate}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => shiftSelectedDate(1)}
                            accessibilityRole="button"
                            style={[styles.dayNavButton, isDarkMode && styles.dayNavButtonDark]}>
                            <Text style={[styles.dayNavButtonText, isDarkMode && styles.textPrimaryDark]}>
                                下一天
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : viewMode === 'week' ? (
                    <View style={[styles.calendarCard, isDarkMode && styles.calendarCardDark]}>
                        <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
                            <WeekCalendar
                                current={selectedDate}
                                markedDates={markedDates}
                                theme={calendarTheme}
                            />
                        </CalendarProvider>
                    </View>
                ) : (
                    <View style={[styles.calendarCard, isDarkMode && styles.calendarCardDark]}>
                        <Calendar
                            current={selectedDate}
                            onDayPress={onDayPress}
                            markedDates={markedDates}
                            theme={calendarTheme}
                            dayComponent={renderDay}
                            hideExtraDays={false}
                        />
                    </View>
                )}

                {selectedDate ? (
                    <View style={styles.eventSection}>
                        <View style={styles.eventHeaderRow}>
                            <Text style={[styles.eventTitle, isDarkMode && styles.textPrimaryDark]}>
                                {selectedDate} 的日程
                            </Text>
                            <TouchableOpacity
                                style={[styles.addButton, isDarkMode && styles.addButtonDark]}
                                onPress={openAddModal}
                                accessibilityRole="button">
                                <Text style={styles.addButtonText}>添加日程</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedEvents.length === 0 ? (
                            <View style={[styles.eventCard, isDarkMode && styles.eventCardDark]}>
                                <Text style={[styles.eventText, isDarkMode && styles.textSecondaryDark]}>
                                    暂无日程
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.eventList}>
                                {selectedEvents.map(event => (
                                    <EventItem
                                        key={event.id}
                                        event={event}
                                        onPress={openDetailModal}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                ) : null}

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
                />

                <ImportExportModal
                    visible={isImportExportModalVisible}
                    onClose={closeImportExportModal}
                    onExportShare={handleExportShare}
                    onExportCopy={handleExportCopy}
                    onImportFromClipboard={handleImportFromClipboard}
                    onImportFromText={handleImportFromText}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    containerDark: {
        backgroundColor: '#0B0B0F',
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
    viewModeRow: {
        flexDirection: 'row',
        marginHorizontal: 12,
        marginTop: 10,
        marginBottom: 12,
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
    },
    viewModeRowDark: {
        backgroundColor: '#27272A',
    },
    viewModeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    viewModeButtonDark: {
        backgroundColor: 'transparent',
    },
    viewModeButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },
    viewModeButtonActiveDark: {
        backgroundColor: '#1C1C1E',
    },
    viewModeButtonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
        color: '#374151',
    },
    viewModeButtonTextDark: {
        color: '#E5E7EB',
    },
    viewModeButtonTextActive: {
        color: '#111827',
        fontWeight: '700',
    },
    viewModeButtonTextActiveDark: {
        color: '#F4F4F5',
    },
    calendarCard: {
        marginHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 8,
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    calendarCardDark: {
        backgroundColor: '#141418',
    },
    dayNavRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 12,
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
        gap: 10,
    },
    dayNavRowDark: {
        backgroundColor: '#141418',
    },
    dayNavButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    dayNavButtonDark: {
        backgroundColor: '#1C1C1E',
    },
    dayNavButtonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
        color: '#111827',
    },
    dayNavTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '700',
        color: '#111827',
    },

    textPrimaryDark: {
        color: '#F4F4F5',
    },
    textSecondaryDark: {
        color: '#A1A1AA',
    },
    eventSection: {
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 20,
    },
    eventHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    eventTitle: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '700',
        color: '#111827',
    },
    addButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#2196F3',
        borderRadius: 8,
    },
    addButtonDark: {
        backgroundColor: '#2196F3',
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '600',
    },
    eventCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    eventCardDark: {
        backgroundColor: '#141418',
    },
    eventText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#6B7280',
    },

    eventList: {
        gap: 10,
    },

    // 农历信息卡片样式
    lunarInfoCard: {
        marginHorizontal: 12,
        marginBottom: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lunarInfoCardDark: {
        backgroundColor: '#141418',
    },
    lunarInfoYear: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    lunarInfoDate: {
        fontSize: 13,
        color: '#6B7280',
    },

    // 日期导航标题容器
    dayNavTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },

    // 顶部操作栏样式
    topActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    appTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    importExportButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    importExportButtonDark: {
        backgroundColor: '#1C1C1E',
    },
    importExportButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
});

export default HomeScreen;
