import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface QuickAddTaskModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (title: string) => Promise<string | null>; // Returns error message or null on success
}

const QuickAddTaskModal = memo(({
    visible,
    onClose,
    onSave,
}: QuickAddTaskModalProps) => {
    const { colors } = useTheme();
    const { t } = useI18n();

    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<TextInput>(null);

    // 当弹窗打开时自动聚焦输入框
    useEffect(() => {
        if (visible) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [visible]);

    const resetForm = useCallback(() => {
        setTitle('');
        setError('');
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const handleSave = useCallback(async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError(t('validation.titleRequired', '请输入标题') as string);
            return;
        }

        const errorMsg = await onSave(trimmedTitle);

        if (errorMsg) {
            setError(errorMsg);
        } else {
            handleClose();
        }
    }, [title, onSave, handleClose, t]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                        {t('event.quickAddTask', '快速添加事项')}
                    </Text>

                    <TextInput
                        ref={inputRef}
                        value={title}
                        onChangeText={(text) => {
                            setTitle(text);
                            if (error) setError('');
                        }}
                        placeholder={t('placeholder.taskTitle', '输入事项标题...') as string}
                        placeholderTextColor={colors.textTertiary}
                        style={[styles.input, { backgroundColor: colors.primarySurface, color: colors.textPrimary }]}
                        returnKeyType="done"
                        onSubmitEditing={handleSave}
                        autoFocus
                    />

                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                            onPress={handleClose}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                                {t('common.cancel', '取消')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.buttonText, styles.saveButtonText]}>
                                {t('common.save', '保存')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
});

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCard: {
        width: '85%',
        maxWidth: 360,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 12,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    saveButton: {},
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#FFFFFF',
    },
});

export default QuickAddTaskModal;
