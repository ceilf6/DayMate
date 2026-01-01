import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useI18n, type Language } from '../services/i18nService';

/**
 * 语言选择器组件示例
 * 可以在设置页面或其他地方使用
 */
export const LanguageSelector = () => {
    const { t, currentLanguage, changeLanguage } = useI18n();

    const languages: { code: Language; name: string }[] = [
        { code: 'zh-CN', name: '简体中文' },
        { code: 'zh-TW', name: '繁體中文' },
        { code: 'en', name: 'English' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>选择语言 / Select Language</Text>
            {languages.map((lang) => (
                <TouchableOpacity
                    key={lang.code}
                    style={[
                        styles.languageButton,
                        currentLanguage === lang.code && styles.languageButtonActive,
                    ]}
                    onPress={() => changeLanguage(lang.code)}
                >
                    <Text
                        style={[
                            styles.languageText,
                            currentLanguage === lang.code && styles.languageTextActive,
                        ]}
                    >
                        {lang.name}
                    </Text>
                    {currentLanguage === lang.code && (
                        <Text style={styles.checkmark}>✓</Text>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#111827',
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    languageButtonActive: {
        backgroundColor: '#2196F3',
    },
    languageText: {
        fontSize: 14,
        color: '#374151',
    },
    languageTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    checkmark: {
        fontSize: 18,
        color: '#FFFFFF',
    },
});
