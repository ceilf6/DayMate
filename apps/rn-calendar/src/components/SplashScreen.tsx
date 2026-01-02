import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
    onAnimationComplete?: () => void;
}

/**
 * DayMate 启动画面组件
 * 展示品牌标题和体现日历+待办事项管理的动画
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
    const { colors, isDarkMode } = useTheme();

    // 动画值 - Logo 初始就是可见的，与原生启动页保持一致
    const logoOpacity = useRef(new Animated.Value(1)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const subtitleTranslate = useRef(new Animated.Value(20)).current;

    // 日历动画值
    const calendarOpacity = useRef(new Animated.Value(0)).current;
    const calendarScale = useRef(new Animated.Value(0.8)).current;

    // 勾选框动画值
    const checkboxes = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    // 勾选动画值
    const checkmarks = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        // 记录开始时间，确保动画至少播放一定时长
        const startTime = Date.now();
        const MIN_DURATION = 2000; // 最少显示2秒

        // 启动动画序列 - Logo 已经可见，直接开始后续动画
        Animated.sequence([
            // 1. 副标题淡入上移
            Animated.parallel([
                Animated.timing(subtitleOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(subtitleTranslate, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),

            // 2. 日历和待办同时淡入
            Animated.parallel([
                Animated.timing(calendarOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(calendarScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 50,
                    useNativeDriver: true,
                }),
                // 待办事项勾选框同时出现
                ...checkboxes.map(anim =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ),
            ]),

            // 3. 勾选动画依次完成
            Animated.stagger(150,
                checkmarks.map(anim =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 250,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    })
                )
            ),
        ]).start(() => {
            // 确保动画至少显示了最小时长
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, MIN_DURATION - elapsed);
            
            setTimeout(() => {
                onAnimationComplete?.();
            }, remaining);
        });
    }, []);

    const primaryColor = colors.primary || '#3B82F6';
    const backgroundColor = isDarkMode ? '#1a1a2e' : '#F8FAFC';
    const textColor = isDarkMode ? '#FFFFFF' : '#1F2937';
    const secondaryTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const cardColor = isDarkMode ? '#2D2D44' : '#FFFFFF';
    const checkColor = '#10B981';

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {/* 背景装饰 */}
            <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: `${primaryColor}15` }]} />
            <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: `${primaryColor}10` }]} />

            {/* Logo 和标题 */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                    },
                ]}
            >
                <Text style={[styles.title, { color: primaryColor }]}>DayMate</Text>
            </Animated.View>

            {/* 副标题 */}
            <Animated.View
                style={[
                    styles.subtitleContainer,
                    {
                        opacity: subtitleOpacity,
                        transform: [{ translateY: subtitleTranslate }],
                    },
                ]}
            >
                <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                    你的日程小帮手
                </Text>
            </Animated.View>

            {/* 动画展示区 */}
            <Animated.View
                style={[
                    styles.animationContainer,
                    {
                        opacity: calendarOpacity,
                        transform: [{ scale: calendarScale }],
                    },
                ]}
            >
                {/* 日历卡片 */}
                <View style={[styles.calendarCard, { backgroundColor: cardColor }]}>
                    {/* 日历头部 */}
                    <View style={[styles.calendarHeader, { backgroundColor: primaryColor }]}>
                        <Text style={styles.calendarMonth}>一月</Text>
                        <Text style={styles.calendarYear}>2026</Text>
                    </View>

                    {/* 日历网格 */}
                    <View style={styles.calendarGrid}>
                        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                            <Text key={`header-${index}`} style={[styles.calendarDayHeader, { color: secondaryTextColor }]}>
                                {day}
                            </Text>
                        ))}
                        {[...Array(7)].map((_, i) => (
                            <View
                                key={`date-${i}`}
                                style={[
                                    styles.calendarDate,
                                    i === 4 && [styles.calendarDateToday, { backgroundColor: primaryColor }],
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.calendarDateText,
                                        { color: i === 4 ? '#FFFFFF' : textColor },
                                    ]}
                                >
                                    {i + 1}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 待办事项列表 */}
                <View style={styles.todoList}>
                    {['会议安排', '重要任务', '生活计划'].map((item, index) => (
                        <Animated.View
                            key={`todo-${index}`}
                            style={[
                                styles.todoItem,
                                { backgroundColor: cardColor },
                                {
                                    opacity: checkboxes[index],
                                    transform: [
                                        { scale: checkboxes[index] },
                                        {
                                            translateX: checkboxes[index].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-20, 0],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.checkbox,
                                    { borderColor: checkColor },
                                    {
                                        backgroundColor: checkmarks[index].interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['transparent', checkColor],
                                        }),
                                    },
                                ]}
                            >
                                <Animated.Text
                                    style={[
                                        styles.checkmark,
                                        {
                                            opacity: checkmarks[index],
                                            transform: [{ scale: checkmarks[index] }],
                                        },
                                    ]}
                                >
                                    ✓
                                </Animated.Text>
                            </Animated.View>
                            <Text style={[styles.todoText, { color: textColor }]}>{item}</Text>
                            <View style={[styles.todoIndicator, { backgroundColor: getIndicatorColor(index) }]} />
                        </Animated.View>
                    ))}
                </View>
            </Animated.View>

            {/* 底部加载提示 */}
            <Animated.View
                style={[
                    styles.loadingContainer,
                    { opacity: subtitleOpacity },
                ]}
            >
                <View style={styles.loadingDots}>
                    {[0, 1, 2].map((i) => (
                        <LoadingDot key={i} delay={i * 200} color={primaryColor} />
                    ))}
                </View>
                <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
                    正在加载...
                </Text>
            </Animated.View>
        </View>
    );
};

// 获取待办事项指示器颜色
const getIndicatorColor = (index: number): string => {
    const colors = ['#EF4444', '#F59E0B', '#10B981'];
    return colors[index % colors.length];
};

// 加载点组件
const LoadingDot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [delay]);

    return (
        <Animated.View
            style={[
                styles.loadingDot,
                { backgroundColor: color },
                {
                    opacity: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                    }),
                    transform: [{
                        scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.3],
                        }),
                    }],
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },

    // 装饰圆圈
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
    },
    decorCircle1: {
        width: width * 1.2,
        height: width * 1.2,
        top: -width * 0.6,
        right: -width * 0.3,
    },
    decorCircle2: {
        width: width * 0.8,
        height: width * 0.8,
        bottom: -width * 0.4,
        left: -width * 0.2,
    },

    // Logo 和标题
    logoContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: 2,
    },

    // 副标题
    subtitleContainer: {
        marginBottom: 32,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 2,
    },

    // 动画展示区
    animationContainer: {
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },

    // 日历卡片
    calendarCard: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    calendarHeader: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    calendarMonth: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    calendarYear: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
    },
    calendarDayHeader: {
        width: `${100 / 7}%`,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    calendarDate: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    calendarDateToday: {
        borderRadius: 10,
    },
    calendarDateText: {
        fontSize: 14,
        fontWeight: '600',
    },

    // 待办事项
    todoList: {
        width: '100%',
        gap: 8,
    },
    todoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    todoText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
    },
    todoIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    // 加载提示
    loadingContainer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    loadingDots: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    loadingText: {
        fontSize: 13,
        fontWeight: '500',
    },
});

export default SplashScreen;
