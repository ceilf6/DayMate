import React, { memo, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

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
    const isDarkMode = useColorScheme() === 'dark';

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
        setSuccess('导出成功！');
    }, [onExportShare]);

    const handleExportCopy = useCallback(async () => {
        setError('');
        setSuccess('');
        await onExportCopy();
        setSuccess('已复制到剪贴板！');
    }, [onExportCopy]);

    const handleImportFromClipboard = useCallback(async () => {
        setError('');
        setSuccess('');
        const result = await onImportFromClipboard();
        if (result.success) {
            setSuccess('导入成功！');
        } else {
            setError(result.error || '导入失败');
        }
    }, [onImportFromClipboard]);

    const handleImportFromText = useCallback(async () => {
        setError('');
        setSuccess('');
        if (!importContent.trim()) {
            setError('请输入 iCalendar 数据');
            return;
        }
        const result = await onImportFromText(importContent);
        if (result.success) {
            setSuccess(result.message || '导入成功！');
            setImportContent('');
        } else {
            setError(result.error || '导入失败');
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
                <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
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
                                onPress={handleExportShare}
                                accessibilityRole="button"
                            >
                                <Text style={[styles.exportButtonText, isDarkMode && styles.textPrimaryDark]}>
                                    分享
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.exportButton, isDarkMode && styles.exportButtonDark]}
                                onPress={handleExportCopy}
                                accessibilityRole="button"
                            >
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
                            onPress={handleImportFromClipboard}
                            accessibilityRole="button"
                        >
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
                            onPress={handleImportFromText}
                            accessibilityRole="button"
                        >
                            <Text style={styles.saveButtonText}>导入</Text>
                        </TouchableOpacity>

                        {error ? (
                            <Text style={styles.formErrorText}>{error}</Text>
                        ) : null}
                        {success ? (
                            <Text style={styles.successText}>{success}</Text>
                        ) : null}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.cancelButton]}
                                onPress={handleClose}
                                accessibilityRole="button"
                            >
                                <Text style={styles.cancelButtonText}>关闭</Text>
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
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        maxHeight: '80%',
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
    textPrimaryDark: {
        color: '#F4F4F5',
    },
    textSecondaryDark: {
        color: '#A1A1AA',
    },
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
});

ImportExportModal.displayName = 'ImportExportModal';

export default ImportExportModal;
