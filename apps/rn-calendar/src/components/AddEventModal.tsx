import React, { memo, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { getPriorityColors } from '@daymate/shared';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '@daymate/i18n';

interface AddEventModalProps {
    visible: boolean;
    selectedDate: string;
    onClose: () => void;
    onSave: (data: {
        title: string;
        startTime: string;
        endTime: string;
        notes: string;
        reminderMinutes: string;
        priority: number;
    }) => Promise<string | null>; // Returns error message or null on success
}

const AddEventModal = memo(({
    visible,
    selectedDate,
    onClose,
    onSave,
}: AddEventModalProps) => {
    const { colors, isDarkMode } = useTheme();

    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [reminderMinutes, setReminderMinutes] = useState('');
    const [priority, setPriority] = useState(0);
    const [error, setError] = useState('');

    const resetForm = useCallback(() => {
        setTitle('');
        setStartTime('');
        setEndTime('');
        setNotes('');
        setReminderMinutes('');
        setPriority(0);
        setError('');
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const handleSave = useCallback(async () => {
        const errorMsg = await onSave({
            title,
            startTime,
            endTime,
            notes,
            reminderMinutes,
            priority,
        });

        if (errorMsg) {
            setError(errorMsg);
        } else {
            handleClose();
        }
    }, [title, startTime, endTime, notes, reminderMinutes, priority, onSave, handleClose]);

    if (!visible) return null;

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
                        {t('event.addEvent', '添加日程')}
                    </Text>
                    <Text style={[styles.modalSubtitle, isDarkMode && styles.textSecondaryDark]}>
                        {t('splash.date', '日期')}：{selectedDate}
                    </Text>

                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder={t('placeholder.titleRequired', '标题（必填）')}
                        placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                        style={[styles.input, isDarkMode && styles.inputDark]}
                    />
                    <View style={styles.timeRow}>
                        <TextInput
                            value={startTime}
                            onChangeText={setStartTime}
                            placeholder={t('placeholder.startTimeHint', '开始 HH:mm')}
                            placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                            style={[styles.input, styles.timeInput, isDarkMode && styles.inputDark]}
                        />
                        <TextInput
                            value={endTime}
                            onChangeText={setEndTime}
                            placeholder={t('placeholder.endTimeHint', '结束 HH:mm')}
                            placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                            style={[styles.input, styles.timeInput, isDarkMode && styles.inputDark]}
                        />
                    </View>
                    <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={t('placeholder.notesOptional', '备注（可选）')}
                        placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                        style={[styles.input, styles.notesInput, isDarkMode && styles.inputDark]}
                        multiline
                    />

                    <TextInput
                        value={reminderMinutes}
                        onChangeText={setReminderMinutes}
                        placeholder={t('placeholder.reminderHint', '提醒（提前分钟，可选，如 10）')}
                        placeholderTextColor={isDarkMode ? '#b6c1cd' : '#666666'}
                        keyboardType="number-pad"
                        style={[styles.input, isDarkMode && styles.inputDark]}
                    />

                    {/* 优先级选择器 */}
                    <Text style={[styles.priorityLabel, isDarkMode && styles.textSecondaryDark]}>
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
                                        isSelected && {
                                            backgroundColor: priorityColors.background,
                                            borderColor: priorityColors.border,
                                        },
                                        !isSelected && isDarkMode && styles.priorityOptionDark,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.priorityOptionText,
                                            isSelected && { color: priorityColors.text },
                                            !isSelected && isDarkMode && styles.textSecondaryDark,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {error ? (
                        <Text style={styles.formErrorText}>{error}</Text>
                    ) : null}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={handleClose}
                            accessibilityRole="button"
                        >
                            <Text style={styles.cancelButtonText}>{t('common.cancel', '取消')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                            accessibilityRole="button"
                        >
                            <Text style={styles.saveButtonText}>{t('common.save', '保存')}</Text>
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
        paddingHorizontal: 8,
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
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
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
        // backgroundColor applied dynamically via colors.primary
    },
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
        lineHeight: 18,
    },
});

AddEventModal.displayName = 'AddEventModal';

export default AddEventModal;
