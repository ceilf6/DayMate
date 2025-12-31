import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    Modal,
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

const HomeScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';

    type ViewMode = 'month' | 'week' | 'day';
    const today = useMemo(() => getToday(), []);

    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [selectedDate, setSelectedDate] = useState(today);
    const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newReminderMinutes, setNewReminderMinutes] = useState('');
    const [newPriority, setNewPriority] = useState<number>(0);
    const [formError, setFormError] = useState('');

    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
    const [detailError, setDetailError] = useState('');

    const [isImportExportModalVisible, setIsImportExportModalVisible] = useState(false);
    const [importContent, setImportContent] = useState('');
    const [importExportError, setImportExportError] = useState('');
    const [importExportSuccess, setImportExportSuccess] = useState('');

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

    const openAddModal = () => {
        if (!selectedDate) return;
        setFormError('');
        setNewTitle('');
        setNewStartTime('');
        setNewEndTime('');
        setNewNotes('');
        setNewReminderMinutes('');
        setNewPriority(0);
        setIsAddModalVisible(true);
    };

    const closeAddModal = () => {
        setIsAddModalVisible(false);
        setFormError('');
    };

    const openDetailModal = (event: CalendarEvent) => {
        setDetailError('');
        setDetailEvent(event);
        setIsDetailModalVisible(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalVisible(false);
        setDetailEvent(null);
        setDetailError('');
    };

    const openImportExportModal = () => {
        setImportContent('');
        setImportExportError('');
        setImportExportSuccess('');
        setIsImportExportModalVisible(true);
    };

    const closeImportExportModal = () => {
        setIsImportExportModalVisible(false);
        setImportContent('');
        setImportExportError('');
        setImportExportSuccess('');
    };

    const getAllEvents = (): CalendarEvent[] => {
        const allEvents: CalendarEvent[] = [];
        for (const dateEvents of Object.values(eventsByDate)) {
            allEvents.push(...dateEvents);
        }
        return allEvents;
    };

    const onExportShare = async () => {
        const events = getAllEvents();
        if (events.length === 0) {
            setImportExportError('没有可导出的日程');
            return;
        }
        const success = await ImportExportService.shareEvents(events);
        if (success) {
            setImportExportSuccess('导出成功！');
        }
    };

    const onExportCopy = async () => {
        const events = getAllEvents();
        if (events.length === 0) {
            setImportExportError('没有可导出的日程');
            return;
        }
        await ImportExportService.copyToClipboard(events);
        setImportExportSuccess('已复制到剪贴板！');
    };

    const onImportFromClipboard = async () => {
        try {
            const events = await ImportExportService.importFromClipboard();
            if (events.length === 0) {
                setImportExportError('剪贴板中没有有效的日历数据');
                return;
            }
            await saveImportedEvents(events);
        } catch {
            setImportExportError('导入失败，请检查数据格式');
        }
    };

    const onImportFromText = async () => {
        if (!importContent.trim()) {
            setImportExportError('请输入 iCalendar 数据');
            return;
        }
        try {
            const events = ImportExportService.importFromContent(importContent);
            if (events.length === 0) {
                setImportExportError('没有找到有效的日程数据');
                return;
            }
            await saveImportedEvents(events);
        } catch {
            setImportExportError('导入失败，请检查数据格式');
        }
    };

    const saveImportedEvents = async (events: CalendarEvent[]) => {
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

        // 刷新事件列表
        const all = await EventStorage.getAllEventsByDate();
        setEventsByDate(all);

        setImportExportSuccess(`成功导入 ${savedCount} 条日程！`);
        setImportContent('');
    };

    const onDeleteEvent = async () => {
        if (!detailEvent) return;

        Alert.alert('删除日程', '确定要删除这条日程吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    try {
                        if (detailEvent.notificationId) {
                            await ReminderService.cancelReminder(detailEvent.notificationId);
                        }

                        const deleted = await EventStorage.deleteEvent(detailEvent.date, detailEvent.id);
                        if (!deleted) {
                            setDetailError('删除失败（未找到该日程）');
                            return;
                        }

                        setEventsByDate(prev => {
                            const next = { ...prev };
                            const list = next[deleted.date] ?? [];
                            const filtered = list.filter(e => e.id !== deleted.id);
                            if (filtered.length === 0) delete next[deleted.date];
                            else next[deleted.date] = filtered;
                            return next;
                        });

                        closeDetailModal();
                    } catch {
                        setDetailError('删除失败，请重试');
                    }
                },
            },
        ]);
    };

    const isValidTime = (value: string): boolean => {
        const trimmed = value.trim();
        if (!trimmed) return true;
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed);
    };

    const onSaveNewEvent = async () => {
        if (!selectedDate) return;
        const title = newTitle.trim();
        if (!title) {
            setFormError('请输入标题');
            return;
        }

        if (!isValidTime(newStartTime) || !isValidTime(newEndTime)) {
            setFormError('时间格式应为 HH:mm');
            return;
        }

        const start = newStartTime.trim();
        const end = newEndTime.trim();
        if (start && end && end < start) {
            setFormError('结束时间不能早于开始时间');
            return;
        }

        const reminderRaw = newReminderMinutes.trim();
        let reminderMinutes: number | undefined;
        if (reminderRaw) {
            const parsed = Number(reminderRaw);
            if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
                setFormError('提醒分钟应为非负整数');
                return;
            }
            if (parsed > 0 && !start) {
                setFormError('设置提醒需要填写开始时间');
                return;
            }
            reminderMinutes = parsed;
        }

        const created = await EventStorage.addEvent({
            date: selectedDate,
            title,
            startTime: start,
            endTime: end,
            description: newNotes.trim(),
            reminderMinutes,
            priority: newPriority > 0 ? newPriority : undefined,
        });

        let finalEvent = created;
        if (created.reminderMinutes && created.reminderMinutes > 0) {
            const notificationId = await ReminderService.scheduleReminder(created);
            if (!notificationId) {
                setFormError('提醒创建失败（可能未授权或提醒时间已过）');
                return;
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

        closeAddModal();
    };

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
                        isSelected && styles.dayContainerSelected,
                        isToday && !isSelected && styles.dayContainerToday,
                    ]}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.dayText,
                            isDarkMode && styles.dayTextDark,
                            isSelected && styles.dayTextSelected,
                            isToday && !isSelected && styles.dayTextToday,
                            isDisabled && styles.dayTextDisabled,
                            isDisabled && isDarkMode && styles.dayTextDisabledDark,
                        ]}
                    >
                        {date.day}
                    </Text>
                    <Text
                        style={[
                            styles.lunarText,
                            isDarkMode && styles.lunarTextDark,
                            isSelected && styles.lunarTextSelected,
                            isToday && !isSelected && styles.lunarTextToday,
                            isDisabled && styles.lunarTextDisabled,
                            isDisabled && isDarkMode && styles.lunarTextDisabledDark,
                            isHoliday && !isSelected && !isToday && styles.lunarTextHoliday,
                            !!lunar.solarTerm && !isHoliday && !isSelected && !isToday && styles.lunarTextSolarTerm,
                        ]}
                        numberOfLines={1}
                    >
                        {lunarText}
                    </Text>
                    {hasEvent && !isSelected && (
                        <View style={styles.eventDot} />
                    )}
                </TouchableOpacity>
            );
        };
    }, [selectedDate, today, isDarkMode, eventsByDate, onDayPress]);

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
                                {selectedEvents.map(event => {
                                    const priorityColors = getPriorityColors(event.priority);
                                    const priorityIndicator = getPriorityIndicator(event.priority);
                                    const highPriority = isHighPriority(event.priority);

                                    return (
                                        <TouchableOpacity
                                            key={event.id}
                                            style={[styles.eventItem, isDarkMode && styles.eventItemDark]}
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
                                                            isDarkMode && styles.textPrimaryDark,
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
                                                        isDarkMode && styles.textSecondaryDark,
                                                    ]}
                                                    numberOfLines={1}>
                                                    {(event.startTime || event.endTime)
                                                        ? `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`
                                                        : '全天'}
                                                </Text>
                                                {event.reminderMinutes && event.reminderMinutes > 0 ? (
                                                    <Text
                                                        style={[
                                                            styles.eventItemMeta,
                                                            isDarkMode && styles.textSecondaryDark,
                                                        ]}
                                                        numberOfLines={1}>
                                                        提醒：提前 {event.reminderMinutes} 分钟
                                                    </Text>
                                                ) : null}
                                                {event.description ? (
                                                    <Text
                                                        style={[
                                                            styles.eventItemNotes,
                                                            isDarkMode && styles.textSecondaryDark,
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

                <Modal
                    visible={isAddModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={closeAddModal}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBackdrop} />
                        <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.textPrimaryDark]}>
                                添加日程
                            </Text>
                            <Text style={[styles.modalSubtitle, isDarkMode && styles.textSecondaryDark]}>
                                日期：{selectedDate}
                            </Text>

                            <TextInput
                                value={newTitle}
                                onChangeText={setNewTitle}
                                placeholder="标题（必填）"
                                placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                                style={[styles.input, isDarkMode && styles.inputDark]}
                            />
                            <View style={styles.timeRow}>
                                <TextInput
                                    value={newStartTime}
                                    onChangeText={setNewStartTime}
                                    placeholder="开始 HH:mm"
                                    placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                                    style={[styles.input, styles.timeInput, isDarkMode && styles.inputDark]}
                                />
                                <TextInput
                                    value={newEndTime}
                                    onChangeText={setNewEndTime}
                                    placeholder="结束 HH:mm"
                                    placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                                    style={[styles.input, styles.timeInput, isDarkMode && styles.inputDark]}
                                />
                            </View>
                            <TextInput
                                value={newNotes}
                                onChangeText={setNewNotes}
                                placeholder="备注（可选）"
                                placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                                style={[styles.input, styles.notesInput, isDarkMode && styles.inputDark]}
                                multiline
                            />

                            <TextInput
                                value={newReminderMinutes}
                                onChangeText={setNewReminderMinutes}
                                placeholder="提醒（提前分钟，可选，如 10）"
                                placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                                keyboardType="number-pad"
                                style={[styles.input, isDarkMode && styles.inputDark]}
                            />

                            {/* 优先级选择器 */}
                            <Text style={[styles.priorityLabel, isDarkMode && styles.textSecondaryDark]}>
                                优先级
                            </Text>
                            <View style={styles.prioritySelector}>
                                {[
                                    { value: 0, label: '无' },
                                    { value: 2, label: '高' },
                                    { value: 5, label: '中' },
                                    { value: 8, label: '低' },
                                ].map(option => {
                                    const colors = getPriorityColors(option.value);
                                    const isSelected = newPriority === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => setNewPriority(option.value)}
                                            style={[
                                                styles.priorityOption,
                                                isSelected && {
                                                    backgroundColor: colors.background,
                                                    borderColor: colors.border,
                                                },
                                                !isSelected && isDarkMode && styles.priorityOptionDark,
                                            ]}>
                                            <Text
                                                style={[
                                                    styles.priorityOptionText,
                                                    isSelected && { color: colors.text },
                                                    !isSelected && isDarkMode && styles.textSecondaryDark,
                                                ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {formError ? (
                                <Text style={styles.formErrorText}>{formError}</Text>
                            ) : null}

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={closeAddModal}
                                    accessibilityRole="button">
                                    <Text style={styles.cancelButtonText}>取消</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.saveButton]}
                                    onPress={onSaveNewEvent}
                                    accessibilityRole="button">
                                    <Text style={styles.saveButtonText}>保存</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isDetailModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={closeDetailModal}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBackdrop} />
                        <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.textPrimaryDark]}>
                                日程详情
                            </Text>

                            {detailEvent ? (
                                <>
                                    <Text style={[styles.modalSubtitle, isDarkMode && styles.textSecondaryDark]}>
                                        日期：{detailEvent.date}
                                    </Text>

                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                                            标题
                                        </Text>
                                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                                            {detailEvent.title}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                                            时间
                                        </Text>
                                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                                            {(detailEvent.startTime || detailEvent.endTime)
                                                ? `${detailEvent.startTime ?? ''}${detailEvent.endTime ? ` - ${detailEvent.endTime}` : ''}`
                                                : '全天'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                                            提醒
                                        </Text>
                                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                                            {detailEvent.reminderMinutes && detailEvent.reminderMinutes > 0
                                                ? `提前 ${detailEvent.reminderMinutes} 分钟`
                                                : '无'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                                            优先级
                                        </Text>
                                        <View style={styles.priorityDetailRow}>
                                            <View
                                                style={[
                                                    styles.priorityDot,
                                                    { backgroundColor: getPriorityColors(detailEvent.priority).background }
                                                ]}
                                            />
                                            <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                                                {getPriorityText(detailEvent.priority)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                                            备注
                                        </Text>
                                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                                            {detailEvent.description?.trim() ? detailEvent.description : '无'}
                                        </Text>
                                    </View>
                                </>
                            ) : null}

                            {detailError ? <Text style={styles.formErrorText}>{detailError}</Text> : null}

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={closeDetailModal}
                                    accessibilityRole="button">
                                    <Text style={styles.cancelButtonText}>关闭</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.deleteButton]}
                                    onPress={onDeleteEvent}
                                    accessibilityRole="button">
                                    <Text style={styles.deleteButtonText}>删除</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* 导入导出弹窗 */}
                <Modal
                    visible={isImportExportModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={closeImportExportModal}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBackdrop} />
                        <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
                            <Text style={[styles.modalTitle, isDarkMode && styles.textPrimaryDark]}>
                                导入/导出
                            </Text>

                            {/* 导出区域 */}
                            <Text style={[styles.sectionLabel, isDarkMode && styles.textSecondaryDark]}>
                                导出日程
                            </Text>
                            <View style={styles.exportButtons}>
                                <TouchableOpacity
                                    style={[styles.exportButton, isDarkMode && styles.exportButtonDark]}
                                    onPress={onExportShare}
                                    accessibilityRole="button">
                                    <Text style={[styles.exportButtonText, isDarkMode && styles.textPrimaryDark]}>
                                        分享
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.exportButton, isDarkMode && styles.exportButtonDark]}
                                    onPress={onExportCopy}
                                    accessibilityRole="button">
                                    <Text style={[styles.exportButtonText, isDarkMode && styles.textPrimaryDark]}>
                                        复制
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* 导入区域 */}
                            <Text style={[styles.sectionLabel, isDarkMode && styles.textSecondaryDark]}>
                                导入日程
                            </Text>
                            <TouchableOpacity
                                style={[styles.importButton, isDarkMode && styles.importButtonDark]}
                                onPress={onImportFromClipboard}
                                accessibilityRole="button">
                                <Text style={[styles.importButtonText, isDarkMode && styles.textPrimaryDark]}>
                                    从剪贴板导入
                                </Text>
                            </TouchableOpacity>

                            <TextInput
                                value={importContent}
                                onChangeText={setImportContent}
                                placeholder="粘贴 iCalendar 数据..."
                                placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                                style={[styles.input, styles.importTextInput, isDarkMode && styles.inputDark]}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={onImportFromText}
                                accessibilityRole="button">
                                <Text style={styles.saveButtonText}>导入</Text>
                            </TouchableOpacity>

                            {importExportError ? (
                                <Text style={styles.formErrorText}>{importExportError}</Text>
                            ) : null}
                            {importExportSuccess ? (
                                <Text style={styles.successText}>{importExportSuccess}</Text>
                            ) : null}

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={closeImportExportModal}
                                    accessibilityRole="button">
                                    <Text style={styles.cancelButtonText}>关闭</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    eventItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 1,
        overflow: 'hidden',
    },
    eventItemDark: {
        backgroundColor: '#141418',
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
        color: '#111827',
    },
    eventItemMeta: {
        fontSize: 13,
        lineHeight: 18,
        color: '#6B7280',
    },
    eventItemNotes: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 18,
        color: '#6B7280',
    },

    detailRow: {
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 12,
        lineHeight: 16,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        lineHeight: 20,
        color: '#111827',
    },
    priorityDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        opacity: 0.5,
    },
    modalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
    },
    modalCardDark: {
        backgroundColor: '#141418',
    },
    modalTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        lineHeight: 18,
        color: '#6B7280',
        marginBottom: 12,
    },
    input: {
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
        backgroundColor: '#F3F4F6',
        marginBottom: 10,
    },
    inputDark: {
        color: '#F4F4F5',
        backgroundColor: '#1C1C1E',
    },
    timeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    timeInput: {
        flex: 1,
    },
    notesInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    priorityLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    prioritySelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    priorityOptionDark: {
        backgroundColor: '#1C1C1E',
        borderColor: '#3F3F46',
    },
    priorityOptionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    formErrorText: {
        color: '#2196F3',
        marginBottom: 10,
        fontSize: 13,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 4,
    },
    actionButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 18,
    },
    saveButton: {
        backgroundColor: '#2196F3',
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
        lineHeight: 18,
    },

    deleteButton: {
        backgroundColor: '#F3F4F6',
    },
    deleteButtonText: {
        color: '#FF3B30', // UIColor.systemRed,
        fontWeight: '700',
        fontSize: 14,
        lineHeight: 18,
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

    // 自定义日期单元格样式
    dayContainer: {
        width: 44,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    dayContainerSelected: {
        backgroundColor: '#2196F3',
    },
    dayContainerToday: {
        backgroundColor: 'rgba(33, 150, 243, 0.15)',
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    dayTextDark: {
        color: '#E5E7EB',
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    dayTextToday: {
        color: '#2196F3',
        fontWeight: '600',
    },
    dayTextDisabled: {
        color: '#D1D5DB',
    },
    dayTextDisabledDark: {
        color: '#52525B',
    },
    lunarText: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    lunarTextDark: {
        color: '#71717A',
    },
    lunarTextSelected: {
        color: 'rgba(255, 255, 255, 0.85)',
    },
    lunarTextToday: {
        color: '#2196F3',
    },
    lunarTextDisabled: {
        color: '#D1D5DB',
    },
    lunarTextDisabledDark: {
        color: '#3F3F46',
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
        backgroundColor: '#2196F3',
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

    // 导入导出弹窗样式
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
        marginBottom: 8,
    },
    exportButtons: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    exportButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    exportButtonDark: {
        backgroundColor: '#1C1C1E',
    },
    exportButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    importButton: {
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        marginBottom: 10,
    },
    importButtonDark: {
        backgroundColor: '#1C1C1E',
    },
    importButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    importTextInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    successText: {
        color: '#10B981',
        marginBottom: 10,
        fontSize: 13,
        fontWeight: '600',
    },
});

export default HomeScreen;
