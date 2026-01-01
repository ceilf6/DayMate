import React, { memo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    useColorScheme,
} from 'react-native';
import type { CalendarEvent } from '@daymate/shared';
import { getPriorityColors, getPriorityText } from '@daymate/shared';

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
    const isDarkMode = useColorScheme() === 'dark';
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
                <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
                    <Text style={[styles.modalTitle, isDarkMode && styles.textPrimaryDark]}>
                        日程详情
                    </Text>

                    <Text style={[styles.modalSubtitle, isDarkMode && styles.textSecondaryDark]}>
                        日期：{event.date}
                    </Text>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                            标题
                        </Text>
                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                            {event.title}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                            时间
                        </Text>
                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                            {(event.startTime || event.endTime)
                                ? `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`
                                : '全天'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                            提醒
                        </Text>
                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                            {event.reminderMinutes && event.reminderMinutes > 0
                                ? `提前 ${event.reminderMinutes} 分钟`
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
                                    { backgroundColor: priorityColors.background },
                                ]}
                            />
                            <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                                {getPriorityText(event.priority)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDarkMode && styles.textSecondaryDark]}>
                            备注
                        </Text>
                        <Text style={[styles.detailValue, isDarkMode && styles.textPrimaryDark]}>
                            {event.description?.trim() ? event.description : '无'}
                        </Text>
                    </View>

                    {error ? <Text style={styles.formErrorText}>{error}</Text> : null}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={handleClose}
                            accessibilityRole="button"
                        >
                            <Text style={styles.cancelButtonText}>关闭</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={handleDelete}
                            accessibilityRole="button"
                        >
                            <Text style={styles.deleteButtonText}>删除</Text>
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
    textPrimaryDark: {
        color: '#F4F4F5',
    },
    textSecondaryDark: {
        color: '#A1A1AA',
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
    cancelButton: {
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        color: '#111827',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 18,
    },
    deleteButton: {
        backgroundColor: '#F3F4F6',
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
