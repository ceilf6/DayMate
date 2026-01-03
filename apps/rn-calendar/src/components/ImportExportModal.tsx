import React, { memo, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface ImportExportModalProps {
    visible: boolean;
    onClose: () => void;
    onExportShare: () => Promise<void>;
    onExportCopy: () => Promise<void>;
    onImportFromClipboard: () => Promise<{ success: boolean; error?: string }>;
    onImportFromText: (content: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const ImportExportModal = memo(({
    visible,
    onClose,
    onExportShare,
    onExportCopy,
    onImportFromClipboard,
    onImportFromText,
}: ImportExportModalProps) => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useI18n();

    const [importContent, setImportContent] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const resetState = useCallback(() => {
        setImportContent('');
        setError('');
        setSuccess('');
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    const handleExportShare = useCallback(async () => {
        setError('');
        setSuccess('');
        await onExportShare();
        setSuccess(t('success.exportSuccess', '导出成功！'));
    }, [onExportShare]);

    const handleExportCopy = useCallback(async () => {
        setError('');
        setSuccess('');
        await onExportCopy();
        setSuccess(t('success.copiedToClipboard', '已复制到剪贴板！'));
    }, [onExportCopy]);

    const handleImportFromClipboard = useCallback(async () => {
        setError('');
        setSuccess('');
        const result = await onImportFromClipboard();
        if (result.success) {
            setSuccess(t('success.importSuccess', '导入成功！'));
        } else {
            setError(result.error || t('error.importFailed', '导入失败'));
        }
    }, [onImportFromClipboard]);

    const handleImportFromText = useCallback(async () => {
        setError('');
        setSuccess('');
        if (!importContent.trim()) {
            setError(t('error.enterICalendarData', '请输入 iCalendar 数据'));
            return;
        }
        const result = await onImportFromText(importContent);
        if (result.success) {
            setSuccess(result.message || t('success.importSuccess', '导入成功！'));
            setImportContent('');
        } else {
            setError(result.error || t('error.importFailed', '导入失败'));
        }
    }, [importContent, onImportFromText]);

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
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                            {t('importExport.title', '导入/导出')}
                        </Text>

                        {/* 导出区域 */}
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            {t('importExport.export', '导出日程')}
                        </Text>
                        <View style={styles.exportButtons}>
                            <TouchableOpacity
                                style={[styles.exportButton, { backgroundColor: colors.primarySurface }]}
                                onPress={handleExportShare}
                                accessibilityRole="button"
                            >
                                <Text style={[styles.exportButtonText, { color: colors.textPrimary }]}>
                                    {t('importExport.share', '分享')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.exportButton, { backgroundColor: colors.primarySurface }]}
                                onPress={handleExportCopy}
                                accessibilityRole="button"
                            >
                                <Text style={[styles.exportButtonText, { color: colors.textPrimary }]}>
                                    {t('importExport.copy', '复制')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* 导入区域 */}
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            {t('importExport.import', '导入日程')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.importButton, { backgroundColor: colors.primarySurface }]}
                            onPress={handleImportFromClipboard}
                            accessibilityRole="button"
                        >
                            <Text style={[styles.importButtonText, { color: colors.textPrimary }]}>
                                {t('importExport.importFromClipboard', '从剪贴板导入')}
                            </Text>
                        </TouchableOpacity>

                        <TextInput
                            value={importContent}
                            onChangeText={setImportContent}
                            placeholder={t('placeholder.pasteICalendar', '粘贴 iCalendar 数据...')}
                            placeholderTextColor={colors.textTertiary}
                            style={[styles.input, styles.importTextInput, { backgroundColor: colors.primarySurface, color: colors.textPrimary }]}
                            multiline
                        />

                        {error ? (
                            <Text style={styles.formErrorText}>{error}</Text>
                        ) : null}
                        {success ? (
                            <Text style={styles.successText}>{success}</Text>
                        ) : null}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
                                onPress={handleClose}
                                accessibilityRole="button"
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>{t('common.close', '关闭')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                onPress={handleImportFromText}
                                accessibilityRole="button"
                            >
                                <Text style={styles.saveButtonText}>{t('importExport.importButton', '导入')}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
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
        maxHeight: '80%',
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
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
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
        alignItems: 'center',
    },
    exportButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    importButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    importButtonText: {
        fontSize: 14,
        fontWeight: '600',
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
    importTextInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    formErrorText: {
        color: '#EF4444',
        marginBottom: 10,
        fontSize: 13,
    },
    successText: {
        color: '#10B981',
        marginBottom: 10,
        fontSize: 13,
        fontWeight: '600',
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
    saveButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 14,
        lineHeight: 18,
    },
});

ImportExportModal.displayName = 'ImportExportModal';

export default ImportExportModal;
