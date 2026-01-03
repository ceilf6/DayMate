import React, { memo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import type { CalendarEvent } from '@daymate/shared';
import { getPriorityColors, getPriorityText } from '@daymate/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface EventDetailModalProps {
    visible: boolean;
    event: CalendarEvent | null;
    onClose: () => void;
    onDelete: (event: CalendarEvent) => Promise<boolean>;
}

const EventDetailModal = memo(({
    visible,
    event,
    onClose,
    onDelete,
}: EventDetailModalProps) => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useI18n();
    const [error, setError] = useState('');

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
                        {t('event.eventDetail', '日程详情')}
                    </Text>

                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        {t('splash.date', '日期')}：{event.date}
                    </Text>

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
                                    {getPriorityText(event.priority)}
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

                    {error ? <Text style={styles.formErrorText}>{error}</Text> : null}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
                            onPress={handleClose}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>{t('common.close', '关闭')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
                            onPress={handleDelete}
                            accessibilityRole="button"
                        >
                            <Text style={styles.deleteButtonText}>{t('common.delete', '删除')}</Text>
                        </TouchableOpacity>
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
});

EventDetailModal.displayName = 'EventDetailModal';

export default EventDetailModal;
