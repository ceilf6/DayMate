import React, { memo, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    Platform,
    Dimensions,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useI18n, type Language } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBackground } from '../contexts/BackgroundContext';
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

// 获取屏幕尺寸用于裁剪比例
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SettingsModal = memo(({ visible, onClose }: SettingsModalProps) => {
    const { t, currentLanguage, changeLanguage } = useI18n();
    const { colors, themeId, setTheme } = useTheme();
    const { backgroundImage, setBackgroundImage, setBackgroundOpacity, clearBackground } = useBackground();
    const [opacity, setOpacity] = useState(backgroundImage?.opacity ?? 0.3);

    const handleSelectLanguage = async (lang: Language) => {
        await changeLanguage(lang);
    };

    const handleSelectTheme = async (newThemeId: ThemeId) => {
        await setTheme(newThemeId);
    };

    const handleSelectImage = async () => {
        try {
            const result = await ImageCropPicker.openPicker({
                mediaType: 'photo',
                cropping: true,
                cropperToolbarTitle: t('settings.cropImage', '裁剪图片') as string,
                width: screenWidth * 2,
                height: screenHeight * 2,
                compressImageQuality: 0.8,
                cropperChooseText: t('common.confirm', '确定') as string,
                cropperCancelText: t('common.cancel', '取消') as string,
            });

            if (result.path) {
                await setBackgroundImage({
                    uri: result.path,
                    opacity: opacity,
                });
            }
        } catch (error: any) {
            // 用户取消选择不需要提示
            if (error?.code === 'E_PICKER_CANCELLED') return;
            Alert.alert(t('error.title', '错误') as string, t('error.selectImageFailed', '选择图片失败') as string);
        }
    };

    const handleClearBackground = async () => {
        Alert.alert(
            t('settings.clearBackground', '清除背景') as string,
            t('settings.clearBackgroundConfirm', '确定要清除背景图片吗？') as string,
            [
                { text: t('common.cancel', '取消') as string, style: 'cancel' },
                {
                    text: t('common.confirm', '确定') as string,
                    style: 'destructive',
                    onPress: () => clearBackground(),
                },
            ]
        );
    };

    const handleOpacityChange = async (newOpacity: number) => {
        setOpacity(newOpacity);
        if (backgroundImage) {
            await setBackgroundOpacity(newOpacity);
        }
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
                                                { backgroundColor: colors.primarySurface },
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
                                                { backgroundColor: colors.primarySurface },
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

                        {/* 背景图片设置 */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                {t('settings.backgroundImage', '背景图片')}
                            </Text>

                            {/* 当前背景预览 */}
                            {backgroundImage && (
                                <View style={styles.backgroundPreviewContainer}>
                                    <Image
                                        source={{ uri: backgroundImage.uri }}
                                        style={styles.backgroundPreview}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.clearBackgroundButton}
                                        onPress={handleClearBackground}>
                                        <Text style={styles.clearBackgroundText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* 选择图片按钮 */}
                            <TouchableOpacity
                                style={[styles.selectImageButton, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}
                                onPress={handleSelectImage}>
                                <Text style={[styles.selectImageText, { color: colors.primary }]}>
                                    {backgroundImage
                                        ? t('settings.changeImage', '更换图片') as string
                                        : t('settings.selectImage', '选择图片') as string}
                                </Text>
                            </TouchableOpacity>

                            {/* 恢复默认背景按钮 */}
                            {backgroundImage && (
                                <TouchableOpacity
                                    style={[styles.restoreDefaultButton, { borderColor: colors.textSecondary }]}
                                    onPress={() => clearBackground()}>
                                    <Text style={[styles.restoreDefaultText, { color: colors.textSecondary }]}>
                                        {t('settings.restoreDefault', '恢复默认主题背景') as string}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* 透明度调节 */}
                            {backgroundImage && (
                                <View style={styles.opacitySection}>
                                    <Text style={[styles.opacityLabel, { color: colors.textSecondary }]}>
                                        {t('settings.backgroundOpacity', '背景透明度')}
                                    </Text>
                                    <View style={styles.opacityOptions}>
                                        {[0.1, 0.2, 0.3, 0.4, 0.5].map((value) => {
                                            const isSelected = Math.abs(opacity - value) < 0.05;
                                            return (
                                                <TouchableOpacity
                                                    key={value}
                                                    style={[
                                                        styles.opacityButton,
                                                        { backgroundColor: colors.primarySurface },
                                                        isSelected && { backgroundColor: colors.primary },
                                                    ]}
                                                    onPress={() => handleOpacityChange(value)}>
                                                    <Text style={[
                                                        styles.opacityButtonText,
                                                        { color: colors.textPrimary },
                                                        isSelected && { color: '#FFFFFF' },
                                                    ]}>
                                                        {Math.round(value * 100)}%
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
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
    // 背景图片相关样式
    backgroundPreviewContainer: {
        position: 'relative',
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    backgroundPreview: {
        width: '100%',
        height: 120,
        borderRadius: 12,
    },
    clearBackgroundButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearBackgroundText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    selectImageButton: {
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    selectImageText: {
        fontSize: 15,
        fontWeight: '600',
    },
    restoreDefaultButton: {
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    restoreDefaultText: {
        fontSize: 14,
    },
    opacitySection: {
        marginTop: 16,
    },
    opacityLabel: {
        fontSize: 14,
        marginBottom: 10,
    },
    opacityOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    opacityButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    opacityButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default SettingsModal;
