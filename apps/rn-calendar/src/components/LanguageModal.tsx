import React, { memo } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
} from 'react-native';
import { useI18n, type Language } from '../contexts/I18nContext';

interface LanguageModalProps {
    visible: boolean;
    onClose: () => void;
}

const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
    { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
];

const LanguageModal = memo(({ visible, onClose }: LanguageModalProps) => {
    const isDarkMode = useColorScheme() === 'dark';
    const { t, currentLanguage, changeLanguage } = useI18n();

    const handleSelectLanguage = async (lang: Language) => {
        await changeLanguage(lang);
        onClose();
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
                <View style={styles.modalBackdrop} />
                <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
                    <Text style={[styles.modalTitle, isDarkMode && styles.textPrimaryDark]}>
                        {t('settings.selectLanguage')}
                    </Text>

                    <View style={styles.languageList}>
                        {languages.map((lang) => {
                            const isSelected = currentLanguage === lang.code;
                            return (
                                <TouchableOpacity
                                    key={lang.code}
                                    style={[
                                        styles.languageItem,
                                        isDarkMode && styles.languageItemDark,
                                        isSelected && styles.languageItemSelected,
                                        isSelected && isDarkMode && styles.languageItemSelectedDark,
                                    ]}
                                    onPress={() => handleSelectLanguage(lang.code)}
                                    accessibilityRole="button"
                                >
                                    <Text
                                        style={[
                                            styles.languageText,
                                            isDarkMode && styles.textSecondaryDark,
                                            isSelected && styles.languageTextSelected,
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

                    <TouchableOpacity
                        style={[styles.closeButton, isDarkMode && styles.closeButtonDark]}
                        onPress={onClose}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.closeButtonText, isDarkMode && styles.textPrimaryDark]}>
                            {t('common.close')}
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
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
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
        marginBottom: 16,
        textAlign: 'center',
    },
    textPrimaryDark: {
        color: '#F4F4F5',
    },
    textSecondaryDark: {
        color: '#A1A1AA',
    },
    languageList: {
        gap: 8,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
    },
    languageItemDark: {
        backgroundColor: '#27272A',
    },
    languageItemSelected: {
        backgroundColor: '#2196F3',
    },
    languageItemSelectedDark: {
        backgroundColor: '#2196F3',
    },
    languageText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    languageTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    checkmark: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    closeButton: {
        marginTop: 16,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    closeButtonDark: {
        backgroundColor: '#27272A',
    },
    closeButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
});

export default LanguageModal;
