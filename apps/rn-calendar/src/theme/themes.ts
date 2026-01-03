/**
 * 主题颜色定义
 * 
 * 设计原则：
 * - 每个主题包含浅色模式和深色模式两套主题色
 * - 深色模式下使用更深的主题色，确保与白色文字有足够对比度
 * - 三层透明度系统：primaryBackground < primarySurface < primaryContent
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

// 深色模式专用的主题色配置
interface DarkModeThemeColors {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryBackground: string;
    primarySurface: string;
    primaryContent: string;
}

export interface Theme {
    id: string;
    name: string;
    colors: ThemeColors;
    // 深色模式下的主题色覆盖
    darkModeOverrides: DarkModeThemeColors;
}

// 蓝色主题（默认）- 深色模式自动变为深蓝色
const blueTheme: Theme = {
    id: 'blue',
    name: '蓝色',
    colors: {
        primary: '#2196F3',
        primaryLight: 'rgba(33, 150, 243, 0.20)',
        primaryDark: '#1976D2',

        // 浅色模式三层透明度
        primaryBackground: 'rgba(33, 150, 243, 0.08)',
        primarySurface: 'rgba(33, 150, 243, 0.15)',
        primaryContent: 'rgba(33, 150, 243, 0.22)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#A0A0A8',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#2196F3',
    },
    // 深色模式：使用深蓝色
    darkModeOverrides: {
        primary: '#1565C0',
        primaryLight: 'rgba(21, 101, 192, 0.30)',
        primaryDark: '#0D47A1',
        primaryBackground: 'rgba(21, 101, 192, 0.25)',
        primarySurface: 'rgba(21, 101, 192, 0.35)',
        primaryContent: 'rgba(21, 101, 192, 0.45)',
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

        primaryBackground: 'rgba(16, 185, 129, 0.08)',
        primarySurface: 'rgba(16, 185, 129, 0.15)',
        primaryContent: 'rgba(16, 185, 129, 0.22)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#A0A0A8',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#10B981',
    },
    // 深色模式：使用深绿色
    darkModeOverrides: {
        primary: '#047857',
        primaryLight: 'rgba(4, 120, 87, 0.30)',
        primaryDark: '#065F46',
        primaryBackground: 'rgba(4, 120, 87, 0.25)',
        primarySurface: 'rgba(4, 120, 87, 0.35)',
        primaryContent: 'rgba(4, 120, 87, 0.45)',
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

        primaryBackground: 'rgba(139, 92, 246, 0.08)',
        primarySurface: 'rgba(139, 92, 246, 0.15)',
        primaryContent: 'rgba(139, 92, 246, 0.22)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#A0A0A8',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#8B5CF6',
    },
    // 深色模式：使用深紫色
    darkModeOverrides: {
        primary: '#6D28D9',
        primaryLight: 'rgba(109, 40, 217, 0.30)',
        primaryDark: '#5B21B6',
        primaryBackground: 'rgba(109, 40, 217, 0.25)',
        primarySurface: 'rgba(109, 40, 217, 0.35)',
        primaryContent: 'rgba(109, 40, 217, 0.45)',
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

        primaryBackground: 'rgba(249, 115, 22, 0.08)',
        primarySurface: 'rgba(249, 115, 22, 0.15)',
        primaryContent: 'rgba(249, 115, 22, 0.22)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#A0A0A8',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#F97316',
    },
    // 深色模式：使用深橙色
    darkModeOverrides: {
        primary: '#C2410C',
        primaryLight: 'rgba(194, 65, 12, 0.30)',
        primaryDark: '#9A3412',
        primaryBackground: 'rgba(194, 65, 12, 0.25)',
        primarySurface: 'rgba(194, 65, 12, 0.35)',
        primaryContent: 'rgba(194, 65, 12, 0.45)',
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

        primaryBackground: 'rgba(236, 72, 153, 0.08)',
        primarySurface: 'rgba(236, 72, 153, 0.15)',
        primaryContent: 'rgba(236, 72, 153, 0.22)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#A0A0A8',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#EC4899',
    },
    // 深色模式：使用深粉色/玫红色
    darkModeOverrides: {
        primary: '#BE185D',
        primaryLight: 'rgba(190, 24, 93, 0.30)',
        primaryDark: '#9D174D',
        primaryBackground: 'rgba(190, 24, 93, 0.25)',
        primarySurface: 'rgba(190, 24, 93, 0.35)',
        primaryContent: 'rgba(190, 24, 93, 0.45)',
    },
};

// 灰色主题（新增）
const grayTheme: Theme = {
    id: 'gray',
    name: '灰色',
    colors: {
        primary: '#6B7280',
        primaryLight: 'rgba(107, 114, 128, 0.20)',
        primaryDark: '#4B5563',

        primaryBackground: 'rgba(107, 114, 128, 0.08)',
        primarySurface: 'rgba(107, 114, 128, 0.15)',
        primaryContent: 'rgba(107, 114, 128, 0.22)',

        background: '#F2F2F7',
        backgroundSecondary: '#FFFFFF',
        backgroundTertiary: '#F3F4F6',

        surface: '#FFFFFF',
        surfaceHover: '#F3F4F6',

        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        textDisabled: '#A0A0A8',

        border: '#E5E7EB',
        borderLight: '#F3F4F6',

        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#6B7280',
    },
    // 深色模式：使用深灰色
    darkModeOverrides: {
        primary: '#374151',
        primaryLight: 'rgba(55, 65, 81, 0.30)',
        primaryDark: '#1F2937',
        primaryBackground: 'rgba(55, 65, 81, 0.25)',
        primarySurface: 'rgba(55, 65, 81, 0.35)',
        primaryContent: 'rgba(55, 65, 81, 0.45)',
    },
};

// 深色模式下的通用颜色调整（非主题色部分）
export const darkModeColors = {
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
    greenTheme,
    purpleTheme,
    orangeTheme,
    pinkTheme,
    grayTheme,
];

// 根据ID获取主题
export const getThemeById = (id: string): Theme => {
    return themes.find(t => t.id === id) || blueTheme;
};

// 主题ID类型
export type ThemeId = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'gray';
