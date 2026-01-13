import React, { useRef, useState, useEffect } from 'react';
import {
    Animated,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import type { CalendarEvent } from '@daymate/shared';
import {
    getPriorityColors,
    getPriorityIndicator,
} from '@daymate/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -120; // 滑动超过这个值触发删除

type SwipeableEventItemProps = {
    event: CalendarEvent;
    onPress: () => void;
    onToggleComplete: () => Promise<boolean> | void;
    onDelete: () => void;
    showDate?: boolean; // 是否显示日期（用于待完成事项区域）
};

const SwipeableEventItem: React.FC<SwipeableEventItemProps> = ({
    event,
    onPress,
    onToggleComplete,
    onDelete,
    showDate = false,
}) => {
    const { colors } = useTheme();
    const { t } = useI18n();
    const translateX = useRef(new Animated.Value(0)).current;
    const isSwipingRef = useRef(false);

    // 完成动画相关状态
    const strikethroughWidth = useRef(new Animated.Value(0)).current;
    const itemOpacity = useRef(new Animated.Value(1)).current;
    const itemHeight = useRef(new Animated.Value(1)).current; // 用于缩放高度
    const [isAnimating, setIsAnimating] = useState(false);
    const [contentWidth, setContentWidth] = useState(0);

    const priorityColors = getPriorityColors(event.priority);
    const priorityIndicator = getPriorityIndicator(event.priority);
    const isCompleted = event.completed === true;

    // 处理完成动画
    const handleToggleComplete = async () => {
        if (isAnimating) return;

        // 如果当前是未完成状态，点击后会变成完成状态，播放动画
        if (!isCompleted) {
            setIsAnimating(true);

            // 先播放删除线动画
            Animated.timing(strikethroughWidth, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start(async () => {
                // 删除线动画完成后
                if (showDate) {
                    // 待完成区域：播放消失动画
                    Animated.parallel([
                        Animated.timing(itemOpacity, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.timing(itemHeight, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: false,
                        }),
                    ]).start(() => {
                        // 消失动画完成后调用完成回调
                        onToggleComplete();
                        setIsAnimating(false);
                    });
                } else {
                    // 日程区域：直接调用完成回调
                    onToggleComplete();
                    setIsAnimating(false);
                }
            });
        } else {
            // 如果当前是完成状态，取消完成，重置动画状态
            strikethroughWidth.setValue(0);
            itemOpacity.setValue(1);
            itemHeight.setValue(1);
            onToggleComplete();
        }
    };

    // 当事件完成状态改变时，重置动画状态
    useEffect(() => {
        if (!isCompleted) {
            strikethroughWidth.setValue(0);
            itemOpacity.setValue(1);
            itemHeight.setValue(1);
        }
    }, [isCompleted]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // 只有水平滑动距离大于垂直滑动距离时才响应
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
            },
            onPanResponderGrant: () => {
                isSwipingRef.current = true;
            },
            onPanResponderMove: (_, gestureState) => {
                // 只允许向左滑动
                if (gestureState.dx < 0) {
                    translateX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                isSwipingRef.current = false;
                if (gestureState.dx < SWIPE_THRESHOLD) {
                    // 滑动超过阈值，直接删除
                    Animated.timing(translateX, {
                        toValue: -SCREEN_WIDTH,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onDelete();
                    });
                } else {
                    // 否则恢复原位
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        friction: 8,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                isSwipingRef.current = false;
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                }).start();
            },
        })
    ).current;

    // 动画插值：删除线宽度
    const animatedStrikeWidth = strikethroughWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // 动画插值：容器高度（用于消失动画）
    const animatedMaxHeight = itemHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 200], // 最大高度估计值
    });

    const animatedMarginBottom = itemHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0],
    });

    return (
        <Animated.View
            style={[
                styles.outerContainer,
                showDate && {
                    opacity: itemOpacity,
                    maxHeight: animatedMaxHeight,
                    marginBottom: animatedMarginBottom,
                },
            ]}>
            <View style={styles.container}>
                {/* 可滑动的事件卡片 */}
                <Animated.View
                    style={[
                        styles.eventItem,
                        { backgroundColor: colors.primaryContent, transform: [{ translateX }] },
                    ]}
                    {...panResponder.panHandlers}>
                    {/* 优先级指示条 */}
                    <View
                        style={[
                            styles.priorityIndicator,
                            { backgroundColor: priorityColors.background }
                        ]}
                    />
                    {/* 完成状态圆圈按钮 */}
                    <TouchableOpacity
                        style={styles.completeCircleContainer}
                        onPress={handleToggleComplete}
                        disabled={isAnimating}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isCompleted }}
                        accessibilityLabel={isCompleted ? t('event.markIncomplete') as string : t('event.markComplete') as string}>
                        <View style={[
                            styles.completeCircle,
                            { borderColor: isCompleted ? colors.primary : colors.textPrimary },
                            isCompleted && { backgroundColor: colors.primary },
                        ]}>
                            {isCompleted && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.eventItemContent}
                        onPress={onPress}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}>
                        <View style={styles.eventTitleRow}>
                            <View style={styles.titleContainer}>
                                <Text
                                    style={[
                                        styles.eventItemTitle,
                                        { color: colors.textPrimary },
                                        isCompleted && !isAnimating && styles.completedText,
                                    ]}
                                    numberOfLines={1}>
                                    {event.title}
                                </Text>
                                {/* 动画删除线 */}
                                {isAnimating && (
                                    <Animated.View
                                        style={[
                                            styles.strikethroughLine,
                                            {
                                                width: animatedStrikeWidth,
                                                backgroundColor: colors.textPrimary,
                                            },
                                        ]}
                                    />
                                )}
                            </View>
                            {priorityIndicator ? (
                                <Text style={[styles.prioritySymbol, { color: priorityColors.background }]}>
                                    {priorityIndicator}
                                </Text>
                            ) : null}
                        </View>
                        {/* 只有当有时间或有效日期时才显示元信息 */}
                        {(event.startTime || event.endTime || (showDate && event.date !== 'NO_DATE')) ? (
                            <Text
                                style={[
                                    styles.eventItemMeta,
                                    { color: colors.textSecondary },
                                    isCompleted && !isAnimating && styles.completedText,
                                ]}
                                numberOfLines={1}>
                                {showDate ? (
                                    <>
                                        {event.date !== 'NO_DATE' && event.date}
                                        {event.date !== 'NO_DATE' && (event.startTime || event.endTime) && ' · '}
                                        {(event.startTime || event.endTime) && `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`}
                                    </>
                                ) : (
                                    `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`
                                )}
                            </Text>
                        ) : null}
                        {!showDate && event.reminderMinutes && event.reminderMinutes > 0 ? (
                            <Text
                                style={[
                                    styles.eventItemMeta,
                                    { color: colors.textSecondary },
                                ]}
                                numberOfLines={1}>
                                {t('event.reminder', '提醒') as string}: {t('reminder.minutesBefore', { minutes: event.reminderMinutes }) as string}
                            </Text>
                        ) : null}
                        {event.description ? (
                            <Text
                                style={[
                                    styles.eventItemNotes,
                                    { color: colors.textSecondary },
                                ]}
                                numberOfLines={2}>
                                {event.description}
                            </Text>
                        ) : null}
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        overflow: 'hidden',
    },
    container: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 14,
        marginBottom: 0,
    },
    eventItem: {
        flexDirection: 'row',
        borderRadius: 14,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 1,
        overflow: 'hidden',
    },
    priorityIndicator: {
        width: 4,
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    completeCircleContainer: {
        paddingLeft: 12,
        paddingVertical: 14,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    completeCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        marginTop: -1,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    eventItemContent: {
        flex: 1,
        padding: 14,
    },
    eventTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    titleContainer: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
    },
    strikethroughLine: {
        position: 'absolute',
        left: 0,
        top: '50%',
        height: 2,
        borderRadius: 1,
        marginTop: -1,
    },
    prioritySymbol: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    eventItemTitle: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
    },
    eventItemMeta: {
        fontSize: 13,
        lineHeight: 18,
    },
    eventItemNotes: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 18,
    },
});

export default SwipeableEventItem;
