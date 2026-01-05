import React, { memo, useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import type { CalendarEvent } from '@daymate/shared';
import { getPriorityColors, getPriorityText } from '@daymate/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { DatePicker, TimePicker } from './DateTimePicker';

interface EventDetailModalProps {
    visible: boolean;
    event: CalendarEvent | null;
    onClose: () => void;
    onDelete: (event: CalendarEvent) => Promise<boolean>;
    onUpdate?: (event: CalendarEvent, data: {
        title: string;
        date: string;
        startTime: string;
        endTime: string;
        notes: string;
        reminderMinutes: string;
        priority: number;
    }) => Promise<string | null>;
}

const EventDetailModal = memo(({
    visible,
    event,
    onClose,
    onDelete,
    onUpdate,
}: EventDetailModalProps) => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useI18n();
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // 编辑模式的表单状态
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [reminderMinutes, setReminderMinutes] = useState('');
    const [priority, setPriority] = useState(0);

    // 当事项改变时，重置表单状态
    useEffect(() => {
        if (event) {
            setTitle(event.title || '');
            // 如果是无日期事项，编辑时显示空（让用户看到 placeholder）
            setDate(event.date === 'NO_DATE' ? '' : (event.date || ''));
            setStartTime(event.startTime || '');
            setEndTime(event.endTime || '');
            setNotes(event.description || '');
            setReminderMinutes(event.reminderMinutes ? String(event.reminderMinutes) : '');
            setPriority(event.priority || 0);
            setIsEditing(false);
        }
    }, [event]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        // 恢复原始值
        if (event) {
            setTitle(event.title || '');
            setDate(event.date === 'NO_DATE' ? '' : (event.date || ''));
            setStartTime(event.startTime || '');
            setEndTime(event.endTime || '');
            setNotes(event.description || '');
            setReminderMinutes(event.reminderMinutes ? String(event.reminderMinutes) : '');
            setPriority(event.priority || 0);
        }
        setIsEditing(false);
        setError('');
    };

    const handleSaveEdit = async () => {
        if (!event || !onUpdate) return;

        const errorMsg = await onUpdate(event, {
            title,
            date,
            startTime,
            endTime,
            notes,
            reminderMinutes,
            priority,
        });

        if (errorMsg) {
            setError(errorMsg);
        } else {
            setIsEditing(false);
            setError('');
            onClose();
        }
    };

    const handleDelete = () => {
        if (!event) return;

        Alert.alert('删除日程', '确定要删除这条日程吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    const success = await onDelete(event);
                    if (success) {
                        onClose();
                    } else {
                        setError('删除失败，请重试');
                    }
                },
            },
        ]);
    };

    const handleClose = () => {
        setError('');
        setIsEditing(false);
        onClose();
    };

    if (!visible || !event) return null;

    const priorityColors = getPriorityColors(event.priority);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalBackdrop} />
                <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                        {isEditing ? t('event.editEvent', '编辑日程') : t('event.eventDetail', '日程详情')}
                    </Text>

                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        {t('splash.date', '日期')}：{event.date === 'NO_DATE' ? (t('event.noDate', '无日期') as string) : event.date}
                    </Text>

                    {!isEditing ? (
                        // 查看模式
                        <>
                            {/* 第一行：标题（单列） */}
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                    {t('event.title', '标题')}
                                </Text>
                                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                    {event.title}
                                </Text>
                            </View>

                            {/* 第二行：时间 + 提醒（双列） */}
                            <View style={styles.detailTwoColumns}>
                                <View style={styles.detailColumn}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                        {t('event.time', '时间')}
                                    </Text>
                                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                        {(event.startTime || event.endTime)
                                            ? `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`
                                            : t('calendar.allDay', '全天')}
                                    </Text>
                                </View>

                                <View style={styles.detailColumn}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                        {t('event.reminder', '提醒')}
                                    </Text>
                                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                        {event.reminderMinutes && event.reminderMinutes > 0
                                            ? t('reminder.minutesBefore', { minutes: event.reminderMinutes })
                                            : t('reminder.none', '无')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailTwoColumns}>
                                <View style={styles.detailColumn}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                        {t('event.priority', '优先级')}
                                    </Text>
                                    <View style={styles.priorityDetailRow}>
                                        <View
                                            style={[
                                                styles.priorityDot,
                                                { backgroundColor: priorityColors.background },
                                            ]}
                                        />
                                        <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                            {getPriorityText(event.priority, t)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailColumn}>
                                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                        {t('event.notes', '备注')}
                                    </Text>
                                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                        {event.description?.trim() ? event.description : t('reminder.none', '无')}
                                    </Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        // 编辑模式
                        <>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder={t('placeholder.titleRequired', '标题（必填）')}
                                placeholderTextColor={colors.textTertiary}
                                style={[styles.input, { backgroundColor: colors.primarySurface, color: colors.textPrimary }]}
                            />
                            {/* 日期编辑 */}
                            <DatePicker
                                label=""
                                value={date}
                                onChange={setDate}
                                placeholder={t('placeholder.dateHint', '日期 YYYY-MM-DD') as string}
                            />
                            <View style={styles.timeRow}>
                                <View style={styles.timePickerWrapper}>
                                    <TimePicker
                                        label=""
                                        value={startTime}
                                        onChange={setStartTime}
                                        placeholder={t('placeholder.startTimeHint', '开始 HH:mm') as string}
                                    />
                                </View>
                                <View style={styles.timePickerWrapper}>
                                    <TimePicker
                                        label=""
                                        value={endTime}
                                        onChange={setEndTime}
                                        placeholder={t('placeholder.endTimeHint', '结束 HH:mm') as string}
                                    />
                                </View>
                            </View>
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                placeholder={t('placeholder.notesOptional', '备注（可选）')}
                                placeholderTextColor={colors.textTertiary}
                                style={[styles.input, styles.notesInput, { backgroundColor: colors.primarySurface, color: colors.textPrimary }]}
                                multiline
                            />

                            <TextInput
                                value={reminderMinutes}
                                onChangeText={setReminderMinutes}
                                placeholder={t('placeholder.reminderHint', '提醒（提前分钟，可选，如 10）')}
                                placeholderTextColor={colors.textTertiary}
                                keyboardType="number-pad"
                                style={[styles.input, { backgroundColor: colors.primarySurface, color: colors.textPrimary }]}
                            />

                            {/* 优先级选择器 */}
                            <Text style={[styles.priorityLabel, { color: colors.textSecondary }]}>
                                {t('event.priority', '优先级')}
                            </Text>
                            <View style={styles.prioritySelector}>
                                {[
                                    { value: 0, label: t('priority.none', '无') },
                                    { value: 2, label: t('priority.high', '高') },
                                    { value: 5, label: t('priority.medium', '中') },
                                    { value: 8, label: t('priority.low', '低') },
                                ].map(option => {
                                    const priorityColors = getPriorityColors(option.value);
                                    const isSelected = priority === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => setPriority(option.value)}
                                            style={[
                                                styles.priorityOption,
                                                { backgroundColor: colors.primarySurface, borderColor: colors.border },
                                                isSelected && {
                                                    backgroundColor: priorityColors.background,
                                                    borderColor: priorityColors.border,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.priorityOptionText,
                                                    { color: colors.textSecondary },
                                                    isSelected && { color: priorityColors.text },
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {error ? <Text style={styles.formErrorText}>{error}</Text> : null}

                    <View style={styles.modalActions}>
                        {!isEditing ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.closeButton, { borderColor: colors.border }]}
                                    onPress={handleClose}
                                    accessibilityRole="button"
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.close', '关闭')}</Text>
                                </TouchableOpacity>
                                {onUpdate && (
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                        onPress={handleEdit}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.saveButtonText}>{t('common.edit', '编辑')}</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.deleteButton, { borderColor: colors.border }]}
                                    onPress={handleDelete}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.deleteButtonText}>{t('common.delete', '删除')}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
                                    onPress={handleCancelEdit}
                                    accessibilityRole="button"
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>{t('common.cancel', '取消')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveEdit}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.saveButtonText}>{t('common.save', '保存')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
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
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
    },
    modalTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '700',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    detailRow: {
        marginBottom: 10,
    },
    detailTwoColumns: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    detailColumn: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 15,
        lineHeight: 16,
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
    input: {
        borderWidth: 0,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    timeInput: {
        flex: 1,
    },
    timePickerWrapper: {
        flex: 1,
    },
    notesInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    priorityLabel: {
        fontSize: 13,
        fontWeight: '600',
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
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    priorityOptionText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    formErrorText: {
        color: '#EF4444',
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
    deleteButton: { borderWidth: 2 },
    closeButton: {
        borderWidth: 2,
    },
    cancelButtonText: {
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 18,
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontWeight: '700',
        fontSize: 14,
        lineHeight: 18,
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
        lineHeight: 18,
    },
});

EventDetailModal.displayName = 'EventDetailModal';

export default EventDetailModal;
