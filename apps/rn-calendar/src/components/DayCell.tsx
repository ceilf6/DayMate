import React, { memo } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, useColorScheme } from 'react-native';
import {
    solarToLunar,
    getLunarShortString,
    getLunarHoliday,
    getSolarHoliday,
} from '@daymate/shared';

interface DayCellProps {
    date: {
        dateString: string;
        day: number;
    };
    state?: string;
    selectedDate: string;
    today: string;
    hasEvent: boolean;
    onPress: (dateString: string) => void;
}

const DayCell = memo(({
    date,
    state,
    selectedDate,
    today,
    hasEvent,
    onPress,
}: DayCellProps) => {
    const isDarkMode = useColorScheme() === 'dark';

    if (!date) return null;

    const dateString = date.dateString;
    const isSelected = dateString === selectedDate;
    const isToday = dateString === today;
    const isDisabled = state === 'disabled';

    // 农历计算 - 只在需要时计算
    const lunar = solarToLunar(dateString);
    const lunarHoliday = getLunarHoliday(dateString);
    const solarHoliday = getSolarHoliday(dateString);
    const isHoliday = !!(lunarHoliday || solarHoliday);

    // 确定农历显示文字
    let lunarText = getLunarShortString(lunar);
    if (solarHoliday) lunarText = solarHoliday;
    else if (lunarHoliday) lunarText = lunarHoliday;

    return (
        <TouchableOpacity
            onPress={() => onPress(dateString)}
            style={[
                styles.dayContainer,
                isSelected && styles.dayContainerSelected,
                isToday && !isSelected && styles.dayContainerToday,
            ]}
            activeOpacity={0.7}
        >
            <Text
                style={[
                    styles.dayText,
                    isDarkMode && styles.dayTextDark,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                    isDisabled && styles.dayTextDisabled,
                    isDisabled && isDarkMode && styles.dayTextDisabledDark,
                ]}
            >
                {date.day}
            </Text>
            <Text
                style={[
                    styles.lunarText,
                    isDarkMode && styles.lunarTextDark,
                    isSelected && styles.lunarTextSelected,
                    isToday && !isSelected && styles.lunarTextToday,
                    isDisabled && styles.lunarTextDisabled,
                    isDisabled && isDarkMode && styles.lunarTextDisabledDark,
                    isHoliday && !isSelected && !isToday && styles.lunarTextHoliday,
                    !!lunar.solarTerm && !isHoliday && !isSelected && !isToday && styles.lunarTextSolarTerm,
                ]}
                numberOfLines={1}
            >
                {lunarText}
            </Text>
            {hasEvent && !isSelected && (
                <View style={styles.eventDot} />
            )}
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // 自定义比较函数 - 只在真正需要时重新渲染
    return (
        prevProps.date?.dateString === nextProps.date?.dateString &&
        prevProps.state === nextProps.state &&
        prevProps.hasEvent === nextProps.hasEvent &&
        // 只有当前日期是选中或上一次选中时才需要比较 selectedDate
        (prevProps.date?.dateString !== prevProps.selectedDate &&
         prevProps.date?.dateString !== nextProps.selectedDate &&
         nextProps.date?.dateString !== prevProps.selectedDate &&
         nextProps.date?.dateString !== nextProps.selectedDate) ||
        (prevProps.selectedDate === nextProps.selectedDate) &&
        // today 一般不会变
        prevProps.today === nextProps.today
    );
});

const styles = StyleSheet.create({
    dayContainer: {
        width: 44,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    dayContainerSelected: {
        backgroundColor: '#2196F3',
    },
    dayContainerToday: {
        backgroundColor: 'rgba(33, 150, 243, 0.15)',
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    dayTextDark: {
        color: '#E5E7EB',
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    dayTextToday: {
        color: '#2196F3',
        fontWeight: '600',
    },
    dayTextDisabled: {
        color: '#D1D5DB',
    },
    dayTextDisabledDark: {
        color: '#52525B',
    },
    lunarText: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    lunarTextDark: {
        color: '#71717A',
    },
    lunarTextSelected: {
        color: 'rgba(255, 255, 255, 0.85)',
    },
    lunarTextToday: {
        color: '#2196F3',
    },
    lunarTextDisabled: {
        color: '#D1D5DB',
    },
    lunarTextDisabledDark: {
        color: '#3F3F46',
    },
    lunarTextHoliday: {
        color: '#EF4444',
    },
    lunarTextSolarTerm: {
        color: '#10B981',
    },
    eventDot: {
        position: 'absolute',
        bottom: 4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#2196F3',
    },
});

DayCell.displayName = 'DayCell';

export default DayCell;
