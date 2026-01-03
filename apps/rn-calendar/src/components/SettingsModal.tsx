import React, { memo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { useI18n, type Language } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { themes, type ThemeId } from '../theme/themes';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
    { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
];

const SettingsModal = memo(({ visible, onClose }: SettingsModalProps) => {
    const { t, currentLanguage, changeLanguage } = useI18n();
    const { colors, themeId, setTheme } = useTheme();

    const handleSelectLanguage = async (lang: Language) => {
        await changeLanguage(lang);
    };

    const handleSelectTheme = async (newThemeId: ThemeId) => {
        await setTheme(newThemeId);
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                        {t('settings.title', '设置')}
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* 语言设置 */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                {t('settings.language', '语言')}
                            </Text>
                            <View style={styles.optionList}>
                                {languages.map((lang) => {
                                    const isSelected = currentLanguage === lang.code;
                                    return (
                                        <TouchableOpacity
                                            key={lang.code}
                                            style={[
                                                styles.optionItem,
                                                { backgroundColor: colors.backgroundTertiary },
                                                isSelected && {
                                                    backgroundColor: colors.primary,
                                                    borderColor: colors.primary,
                                                    borderWidth: 2,
                                                },
                                            ]}
                                            onPress={() => handleSelectLanguage(lang.code)}
                                            accessibilityRole="button"
                                        >
                                            <Text
                                                style={[
                                                    styles.optionText,
                                                    { color: colors.textPrimary },
                                                    isSelected && styles.optionTextSelected,
                                                ]}
                                            >
                                                {lang.nativeName}
                                            </Text>
                                            {isSelected && (
                                                <Text style={styles.checkmark}>✓</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* 主题色设置 */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                {t('settings.themeColor', '主题色')}
                            </Text>
                            <View style={styles.themeGrid}>
                                {themes.map((theme) => {
                                    const isSelected = themeId === theme.id;
                                    return (
                                        <TouchableOpacity
                                            key={theme.id}
                                            style={[
                                                styles.themeItem,
                                                { backgroundColor: colors.backgroundTertiary },
                                                isSelected && {
                                                    borderColor: colors.primary,
                                                    borderWidth: 3,
                                                },
                                            ]}
                                            onPress={() => handleSelectTheme(theme.id as ThemeId)}
                                            accessibilityRole="button"
                                        >
                                            <View
                                                style={[
                                                    styles.themeColorPreview,
                                                    { backgroundColor: theme.colors.primary },
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.themeText,
                                                    { color: colors.textSecondary },
                                                    isSelected && {
                                                        color: colors.textPrimary,
                                                        fontWeight: '700',
                                                    },
                                                ]}
                                            >
                                                {t(`themes.${theme.id}`)}
                                            </Text>
                                            {isSelected && (
                                                <View style={styles.selectedBadge}>
                                                    <Text style={styles.selectedBadgeText}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.closeButton, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                        accessibilityRole="button"
                    >
                        <Text style={styles.closeButtonText}>
                            {t('common.close', '关闭')}
                        </Text>
                    </TouchableOpacity>
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
        borderRadius: 20,
        padding: 24,
        maxHeight: '80%',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    optionList: {
        gap: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    checkmark: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    themeItem: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    themeColorPreview: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: 8,
    },
    themeText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    selectedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    closeButton: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default SettingsModal;
