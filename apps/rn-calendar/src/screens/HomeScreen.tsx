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
    getPriorityText,
    isHighPriority,
    comparePriority,
} from '@daymate/shared';
import { EventStorage } from '../services/EventStorage';
import { ReminderService } from '../services/ReminderService';
import { ImportExportService } from '../services/ImportExportService';
// 导入日历本地化配置（必须在使用 Calendar 组件之前）
import '../services/CalendarLocale';
import AddEventModal from '../components/AddEventModal';
import EventDetailModal from '../components/EventDetailModal';
import ImportExportModal from '../components/ImportExportModal';
import SettingsModal from '../components/SettingsModal';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';

const HomeScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const { t, currentLanguage } = useI18n();
    const { colors } = useTheme();

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
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

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

    const onDayPress = (day: any) => {
        setSelectedDate(day.dateString);
    };

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
                    onPress={() => onDayPress({ dateString })}
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
                            isDisabled && [styles.dayTextDisabled, { color: colors.textDisabled }],
                        ]}
                    >
                        {date.day}
                    </Text>
                    <Text
                        style={[
                            styles.lunarText,
                            { color: colors.textTertiary },
                            isSelected && styles.lunarTextSelected,
                            isToday && !isSelected && [styles.lunarTextToday, { color: colors.primary }],
                            isDisabled && [styles.lunarTextDisabled, { color: colors.textDisabled }],
                            isHoliday && !isSelected && !isToday && styles.lunarTextHoliday,
                            !!lunar.solarTerm && !isHoliday && !isSelected && !isToday && styles.lunarTextSolarTerm,
                        ]}
                        numberOfLines={1}
                    >
                        {lunarText}
                    </Text>
                    {hasEvent && !isSelected && (
                        <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />
                    )}
                </TouchableOpacity>
            );
        };
    }, [selectedDate, today, isDarkMode, eventsByDate, onDayPress]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
                    <TouchableOpacity
                        onPress={() => setIsSettingsModalVisible(true)}
                        style={[styles.settingsButton, { backgroundColor: colors.backgroundTertiary }]}
                        accessibilityRole="button">
                        <Text style={styles.settingsIcon}>
                            ⚙️
                        </Text>
                        <Text style={[styles.settingsButtonText, { color: colors.textPrimary }]}>
                            {t('settings.title')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={openImportExportModal}
                        style={[styles.importExportButton, { backgroundColor: colors.backgroundTertiary }]}
                        accessibilityRole="button">
                        <Text style={[styles.importExportButtonText, { color: colors.textPrimary }]}>
                            {t('importExport.title')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.viewModeRow, { backgroundColor: colors.backgroundSecondary }]}>
                    <TouchableOpacity
                        onPress={() => setViewMode('month')}
                        accessibilityRole="button"
                        style={[
                            styles.viewModeButton,
                            viewMode === 'month' && styles.viewModeButtonActive,
                            viewMode === 'month' && { backgroundColor: colors.surface },
                        ]}>
                        <Text
                            style={[
                                styles.viewModeButtonText,
                                { color: colors.textSecondary },
                                viewMode === 'month' && styles.viewModeButtonTextActive,
                                viewMode === 'month' && { color: colors.textPrimary },
                            ]}>
                            月
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('week')}
                        accessibilityRole="button"
                        style={[
                            styles.viewModeButton,
                            viewMode === 'week' && styles.viewModeButtonActive,
                            viewMode === 'week' && { backgroundColor: colors.surface },
                        ]}>
                        <Text
                            style={[
                                styles.viewModeButtonText,
                                { color: colors.textSecondary },
                                viewMode === 'week' && styles.viewModeButtonTextActive,
                                viewMode === 'week' && { color: colors.textPrimary },
                            ]}>
                            周
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('day')}
                        accessibilityRole="button"
                        style={[
                            styles.viewModeButton,
                            viewMode === 'day' && styles.viewModeButtonActive,
                            viewMode === 'day' && { backgroundColor: colors.surface },
                        ]}>
                        <Text
                            style={[
                                styles.viewModeButtonText,
                                { color: colors.textSecondary },
                                viewMode === 'day' && styles.viewModeButtonTextActive,
                                viewMode === 'day' && { color: colors.textPrimary },
                            ]}>
                            日
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 农历信息显示 */}
                {lunarInfo && (
                    <View style={[styles.lunarInfoCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.lunarInfoYear, { color: colors.textPrimary }]}>
                            {lunarInfo.yearInfo}
                        </Text>
                        <Text style={[styles.lunarInfoDate, { color: colors.textSecondary }]}>
                            {lunarInfo.monthInfo}
                            {lunarInfo.holidays.length > 0 && ` · ${lunarInfo.holidays.join(' ')}`}
                        </Text>
                    </View>
                )}

                {viewMode === 'day' ? (
                    <View style={[styles.dayNavRow, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity
                            onPress={() => shiftSelectedDate(-1)}
                            accessibilityRole="button"
                            style={[styles.dayNavButton, { backgroundColor: colors.backgroundTertiary }]}>
                            <Text style={[styles.dayNavButtonText, { color: colors.textPrimary }]}>
                                {t('calendar.previousDay')}
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
                            style={[styles.dayNavButton, { backgroundColor: colors.backgroundTertiary }]}>
                            <Text style={[styles.dayNavButtonText, { color: colors.textPrimary }]}>
                                {t('calendar.nextDay')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : viewMode === 'week' ? (
                    <View style={[styles.calendarCard, { backgroundColor: colors.surface }]}>
                        <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
                            <WeekCalendar
                                key={`week-${currentLanguage}`}
                                current={selectedDate}
                                markedDates={markedDates}
                                theme={calendarTheme}
                            />
                        </CalendarProvider>
                    </View>
                ) : (
                    <View style={[styles.calendarCard, { backgroundColor: colors.surface }]}>
                        <Calendar
                            key={`month-${currentLanguage}`}
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

                {selectedDate ? (
                    <View style={styles.eventSection}>
                        <View style={styles.eventHeaderRow}>
                            <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                                {t('event.eventsOnDate', { date: selectedDate })}
                            </Text>
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.primary }]}
                                onPress={openAddModal}
                                accessibilityRole="button">
                                <Text style={styles.addButtonText}>{t('event.addEvent')}</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedEvents.length === 0 ? (
                            <View style={[styles.eventCard, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.eventText, { color: colors.textSecondary }]}>
                                    {t('event.noEvents')}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.eventList}>
                                {selectedEvents.map(event => {
                                    const priorityColors = getPriorityColors(event.priority);
                                    const priorityIndicator = getPriorityIndicator(event.priority);
                                    const highPriority = isHighPriority(event.priority);

                                    return (
                                        <TouchableOpacity
                                            key={event.id}
                                            style={[styles.eventItem, { backgroundColor: colors.surface }]}
                                            onPress={() => openDetailModal(event)}
                                            accessibilityRole="button">
                                            {/* 优先级指示条 */}
                                            <View
                                                style={[
                                                    styles.priorityIndicator,
                                                    { backgroundColor: priorityColors.background }
                                                ]}
                                            />
                                            <View style={styles.eventItemContent}>
                                                <View style={styles.eventTitleRow}>
                                                    <Text
                                                        style={[
                                                            styles.eventItemTitle,
                                                            { color: colors.textPrimary },
                                                            highPriority && { color: priorityColors.background },
                                                        ]}
                                                        numberOfLines={1}>
                                                        {event.title}
                                                    </Text>
                                                    {priorityIndicator ? (
                                                        <Text style={[styles.prioritySymbol, { color: priorityColors.background }]}>
                                                            {priorityIndicator}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                                <Text
                                                    style={[
                                                        styles.eventItemMeta,
                                                        { color: colors.textSecondary },
                                                    ]}
                                                    numberOfLines={1}>
                                                    {(event.startTime || event.endTime)
                                                        ? `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`
                                                        : t('calendar.allDay')}
                                                </Text>
                                                {event.reminderMinutes && event.reminderMinutes > 0 ? (
                                                    <Text
                                                        style={[
                                                            styles.eventItemMeta,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                        numberOfLines={1}>
                                                        {t('event.reminder')}: {t('reminder.minutesBefore', { minutes: event.reminderMinutes })}
                                                    </Text>
                                                ) : null}
                                                {event.description ? (
                                                    <Text
                                                        style={[
                                                            styles.eventItemNotes,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                        numberOfLines={2}>
                                                        {event.description}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
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

                <SettingsModal
                    visible={isSettingsModalVisible}
                    onClose={() => setIsSettingsModalVisible(false)}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
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
    viewModeRow: {
        flexDirection: 'row',
        marginHorizontal: 12,
        marginTop: 10,
        marginBottom: 12,
        padding: 4,
        borderRadius: 12,
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
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },
    viewModeButtonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },
    viewModeButtonTextActive: {
        fontWeight: '700',
    },
    calendarCard: {
        marginHorizontal: 12,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 8,
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
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
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
        gap: 10,
    },
    dayNavButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    dayNavButtonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },
    dayNavTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '700',
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
        marginBottom: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lunarInfoYear: {
        fontSize: 15,
        fontWeight: '600',
    },
    lunarInfoDate: {
        fontSize: 13,
    },

    // 日期导航标题容器
    dayNavTitleContainer: {
        flex: 1,
        alignItems: 'center',
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
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    settingsIcon: {
        fontSize: 16,
    },
    settingsButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    importExportButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    importExportButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default HomeScreen;
