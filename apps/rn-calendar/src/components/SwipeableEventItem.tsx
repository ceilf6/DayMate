import React, { useRef } from 'react';
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
    isHighPriority,
} from '@daymate/shared';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -120; // 滑动超过这个值触发删除

type SwipeableEventItemProps = {
    event: CalendarEvent;
    onPress: () => void;
    onToggleComplete: () => void;
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

    const priorityColors = getPriorityColors(event.priority);
    const priorityIndicator = getPriorityIndicator(event.priority);
    const highPriority = isHighPriority(event.priority);
    const isCompleted = event.completed === true;

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

    return (
        <View style={styles.container}>
            {/* 删除背景指示 */}
            {/* <View style={[styles.deleteBackground, { backgroundColor: '#EF4444' }]} /> */}

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
                    onPress={onToggleComplete}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isCompleted }}
                    accessibilityLabel={isCompleted ? t('event.markIncomplete') as string : t('event.markComplete') as string}>
                    <View style={[
                        styles.completeCircle,
                        { borderColor: isCompleted ? colors.primary : colors.textDisabled },
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
                    accessibilityRole="button">
                    <View style={styles.eventTitleRow}>
                        <Text
                            style={[
                                styles.eventItemTitle,
                                { color: colors.textPrimary },
                                highPriority && { color: priorityColors.background },
                                isCompleted && styles.completedText,
                            ]}
                            numberOfLines={1}>
                            {event.title}
                        </Text>
                        {priorityIndicator ? (
                            <Text style={[styles.prioritySymbol, { color: priorityColors.background }]}>
                                {priorityIndicator}
                            </Text>
                        ) : null}
                    </View>
                    <Text
                        style={[
                            styles.eventItemMeta,
                            { color: colors.textSecondary },
                            isCompleted && styles.completedText,
                        ]}
                        numberOfLines={1}>
                        {showDate ? (
                            <>
                                {event.date}
                                {(event.startTime || event.endTime) && ` · ${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`}
                            </>
                        ) : (
                            (event.startTime || event.endTime)
                                ? `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`
                                : t('calendar.allDay', '全天') as string
                        )}
                    </Text>
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
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 14,
        marginBottom: 0,
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 14,
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
    prioritySymbol: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    eventItemTitle: {
        flex: 1,
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
