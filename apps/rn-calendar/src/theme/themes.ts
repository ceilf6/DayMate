/**
 * 主题颜色定义
 */

export interface ThemeColors {
    // 主色调
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // 主题色分层透明度系统（从淡到浓）
    primaryBackground: string;  // 最淡 - 页面背景
    primarySurface: string;     // 中等 - 卡片背景
    primaryContent: string;     // 较浓 - 卡片内子区域

    // 背景色
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;

    // 卡片和表面
    surface: string;
    surfaceHover: string;

    // 文本颜色
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textDisabled: string;

    // 边框
    border: string;
    borderLight: string;

    // 状态颜色
    success: string;
    warning: string;
    error: string;
    info: string;
}

export interface Theme {
    id: string;
    name: string;
    colors: ThemeColors;
}

// 蓝色主题（默认）
const blueTheme: Theme = {
    id: 'blue',
    name: '蓝色',
    colors: {
        primary: '#2196F3',
        primaryLight: 'rgba(33, 150, 243, 0.20)',
        primaryDark: '#1976D2',

        // 三层透明度系统
        primaryBackground: 'rgba(33, 150, 243, 0.06)',  // 页面背景 - 最淡
        primarySurface: 'rgba(33, 150, 243, 0.12)',     // 卡片背景 - 中等
        primaryContent: 'rgba(33, 150, 243, 0.18)',     // 卡片内子区域 - 较浓

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#D1D5DB',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#2196F3',
    },
};

// 深蓝色主题
const darkBlueTheme: Theme = {
    id: 'darkBlue',
    name: '深蓝',
    colors: {
        primary: '#1976D2',
        primaryLight: 'rgba(25, 118, 210, 0.20)',
        primaryDark: '#0D47A1',

        primaryBackground: 'rgba(25, 118, 210, 0.06)',
        primarySurface: 'rgba(25, 118, 210, 0.12)',
        primaryContent: 'rgba(25, 118, 210, 0.18)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#D1D5DB',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#1976D2',
    },
};

// 绿色主题
const greenTheme: Theme = {
    id: 'green',
    name: '绿色',
    colors: {
        primary: '#10B981',
        primaryLight: 'rgba(16, 185, 129, 0.20)',
        primaryDark: '#059669',

        primaryBackground: 'rgba(16, 185, 129, 0.06)',
        primarySurface: 'rgba(16, 185, 129, 0.12)',
        primaryContent: 'rgba(16, 185, 129, 0.18)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#D1D5DB',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#10B981',
    },
};

// 紫色主题
const purpleTheme: Theme = {
    id: 'purple',
    name: '紫色',
    colors: {
        primary: '#8B5CF6',
        primaryLight: 'rgba(139, 92, 246, 0.20)',
        primaryDark: '#7C3AED',

        primaryBackground: 'rgba(139, 92, 246, 0.06)',
        primarySurface: 'rgba(139, 92, 246, 0.12)',
        primaryContent: 'rgba(139, 92, 246, 0.18)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#D1D5DB',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#8B5CF6',
    },
};

// 橙色主题
const orangeTheme: Theme = {
    id: 'orange',
    name: '橙色',
    colors: {
        primary: '#F97316',
        primaryLight: 'rgba(249, 115, 22, 0.20)',
        primaryDark: '#EA580C',

        primaryBackground: 'rgba(249, 115, 22, 0.06)',
        primarySurface: 'rgba(249, 115, 22, 0.12)',
        primaryContent: 'rgba(249, 115, 22, 0.18)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#D1D5DB',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#F97316',
    },
};

// 粉色主题
const pinkTheme: Theme = {
    id: 'pink',
    name: '粉色',
    colors: {
        primary: '#EC4899',
        primaryLight: 'rgba(236, 72, 153, 0.20)',
        primaryDark: '#DB2777',

        primaryBackground: 'rgba(236, 72, 153, 0.06)',
        primarySurface: 'rgba(236, 72, 153, 0.12)',
        primaryContent: 'rgba(236, 72, 153, 0.18)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#D1D5DB',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#EC4899',
    },
};

// 深色模式下的颜色调整
export const darkModeColors = {
    // 深色模式三层透明度系统（使用白色透明度）
    primaryBackground: 'rgba(255, 255, 255, 0.04)',  // 页面背景 - 最淡
    primarySurface: 'rgba(255, 255, 255, 0.08)',     // 卡片背景 - 中等
    primaryContent: 'rgba(255, 255, 255, 0.12)',    // 卡片内子区域 - 较浓

    background: '#0B0B0F',
    backgroundSecondary: '#141418',
    backgroundTertiary: '#1C1C1E',

    surface: '#141418',
    surfaceHover: '#27272A',

    textPrimary: '#F4F4F5',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    textDisabled: '#52525B',

    border: '#27272A',
    borderLight: '#1C1C1E',
};

// 所有主题
export const themes: Theme[] = [
    blueTheme,
    darkBlueTheme,
    greenTheme,
    purpleTheme,
    orangeTheme,
    pinkTheme,
];

// 根据ID获取主题
export const getThemeById = (id: string): Theme => {
    return themes.find(t => t.id === id) || blueTheme;
};

// 主题ID类型
export type ThemeId = 'blue' | 'darkBlue' | 'green' | 'purple' | 'orange' | 'pink';
