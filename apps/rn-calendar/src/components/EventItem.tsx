import React, { memo } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, useColorScheme } from 'react-native';
import type { CalendarEvent } from '@daymate/shared';
import { getPriorityColors, getPriorityIndicator, isHighPriority } from '@daymate/shared';

interface EventItemProps {
    event: CalendarEvent;
    onPress: (event: CalendarEvent) => void;
}

const EventItem = memo(({ event, onPress }: EventItemProps) => {
    const isDarkMode = useColorScheme() === 'dark';
    const priorityColors = getPriorityColors(event.priority);
    const priorityIndicator = getPriorityIndicator(event.priority);
    const highPriority = isHighPriority(event.priority);

    return (
        <TouchableOpacity
            style={[styles.eventItem, isDarkMode && styles.eventItemDark]}
            onPress={() => onPress(event)}
            accessibilityRole="button"
        >
            {/* 优先级指示条 */}
            <View
                style={[
                    styles.priorityIndicator,
                    { backgroundColor: priorityColors.background },
                ]}
            />
            <View style={styles.eventItemContent}>
                <View style={styles.eventTitleRow}>
                    <Text
                        style={[
                            styles.eventItemTitle,
                            isDarkMode && styles.textPrimaryDark,
                            highPriority && { color: priorityColors.background },
                        ]}
                        numberOfLines={1}
                    >
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
                        isDarkMode && styles.textSecondaryDark,
                    ]}
                    numberOfLines={1}
                >
                    {(event.startTime || event.endTime)
                        ? `${event.startTime ?? ''}${event.endTime ? ` - ${event.endTime}` : ''}`
                        : '全天'}
                </Text>
                {event.reminderMinutes && event.reminderMinutes > 0 ? (
                    <Text
                        style={[
                            styles.eventItemMeta,
                            isDarkMode && styles.textSecondaryDark,
                        ]}
                        numberOfLines={1}
                    >
                        提醒：提前 {event.reminderMinutes} 分钟
                    </Text>
                ) : null}
                {event.description ? (
                    <Text
                        style={[
                            styles.eventItemNotes,
                            isDarkMode && styles.textSecondaryDark,
                        ]}
                        numberOfLines={2}
                    >
                        {event.description}
                    </Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // 只在事件数据变化时重新渲染
    return (
        prevProps.event.id === nextProps.event.id &&
        prevProps.event.title === nextProps.event.title &&
        prevProps.event.startTime === nextProps.event.startTime &&
        prevProps.event.endTime === nextProps.event.endTime &&
        prevProps.event.description === nextProps.event.description &&
        prevProps.event.reminderMinutes === nextProps.event.reminderMinutes &&
        prevProps.event.priority === nextProps.event.priority &&
        prevProps.onPress === nextProps.onPress
    );
});

const styles = StyleSheet.create({
    eventItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 1,
        overflow: 'hidden',
    },
    eventItemDark: {
        backgroundColor: '#141418',
    },
    priorityIndicator: {
        width: 4,
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
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
        color: '#111827',
    },
    textPrimaryDark: {
        color: '#F4F4F5',
    },
    eventItemMeta: {
        fontSize: 13,
        lineHeight: 18,
        color: '#6B7280',
    },
    textSecondaryDark: {
        color: '#A1A1AA',
    },
    eventItemNotes: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 18,
        color: '#6B7280',
    },
});

EventItem.displayName = 'EventItem';

export default EventItem;
