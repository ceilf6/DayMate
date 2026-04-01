import React, { memo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
} from 'react-native';
import DateTimePickerRN, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface DatePickerProps {
    label: string;
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    placeholder?: string;
}

interface TimePickerProps {
    label: string;
    value: string; // HH:mm
    onChange: (time: string) => void;
    placeholder?: string;
}

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const parseDateValue = (dateStr: string): Date => {
    const fallback = new Date();
    if (!dateStr) return fallback;

    const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return fallback;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
        return fallback;
    }

    const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (!isValidDate(parsed)) return fallback;

    const isSameDate = parsed.getFullYear() === year
        && parsed.getMonth() === month - 1
        && parsed.getDate() === day;
    return isSameDate ? parsed : fallback;
};

const parseTimeValue = (timeStr: string): Date => {
    const fallback = new Date();
    if (!timeStr) return fallback;

    const match = timeStr.trim().match(/^(\d{1,2}):(\d{1,2})$/);
    if (!match) return fallback;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return fallback;
    }
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return fallback;
    }

    fallback.setHours(hours, minutes, 0, 0);
    return fallback;
};

// 日期选择器
export const DatePicker = memo(({ label, value, onChange, placeholder }: DatePickerProps) => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useI18n();
    const [show, setShow] = useState(false);
    const [tempDate, setTempDate] = useState<Date | null>(null);

    const currentDate = parseDateValue(value);

    const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            if (event.type === 'set' && selectedDate) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                onChange(`${year}-${month}-${day}`);
            }
        } else {
            // iOS: 暂存选择的日期
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const openPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: currentDate,
                mode: 'date',
                display: 'default',
                onChange: handleChange,
            });
            return;
        }

        setShow(true);
    };

    const handleConfirm = () => {
        // iOS 确认时，使用暂存的日期或当前显示的日期
        const dateToUse = tempDate || currentDate;
        const year = dateToUse.getFullYear();
        const month = String(dateToUse.getMonth() + 1).padStart(2, '0');
        const day = String(dateToUse.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setTempDate(null);
        setShow(false);
    };

    const handleCancel = () => {
        setTempDate(null);
        setShow(false);
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            )}
            <TouchableOpacity
                style={[styles.picker, { backgroundColor: colors.primarySurface }]}
                onPress={openPicker}
            >
                <Text style={[styles.pickerText, { color: value ? colors.textPrimary : colors.textTertiary }]}>
                    {value || placeholder || t('placeholder.dateHint', '日期 YYYY-MM-DD')}
                </Text>
            </TouchableOpacity>

            {show && Platform.OS === 'ios' && (
                <Modal
                    transparent
                    animationType="fade"
                    visible={show}
                    onRequestClose={handleCancel}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={handleCancel}>
                                    <Text style={[styles.modalButton, { color: colors.textSecondary }]}>
                                        {t('common.cancel', '取消')}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                    {t('event.selectDate', '选择日期')}
                                </Text>
                                <TouchableOpacity onPress={handleConfirm}>
                                    <Text style={[styles.modalButton, { color: colors.primary }]}>
                                        {t('common.confirm', '确定')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePickerRN
                                value={tempDate || currentDate}
                                mode="date"
                                display="spinner"
                                onChange={handleChange}
                                locale="zh-CN"
                                style={styles.iosPicker}
                                themeVariant={isDarkMode ? 'dark' : 'light'}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
});

// 时间选择器
export const TimePicker = memo(({ label, value, onChange, placeholder }: TimePickerProps) => {
    const { colors, isDarkMode } = useTheme();
    const { t } = useI18n();
    const [show, setShow] = useState(false);
    const [tempTime, setTempTime] = useState<Date | null>(null);

    const currentTime = parseTimeValue(value);

    const handleChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === 'android') {
            if (event.type === 'set' && selectedTime) {
                const hours = String(selectedTime.getHours()).padStart(2, '0');
                const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
                onChange(`${hours}:${minutes}`);
            }
        } else {
            // iOS: 暂存选择的时间
            if (selectedTime) {
                setTempTime(selectedTime);
            }
        }
    };

    const openPicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: currentTime,
                mode: 'time',
                display: 'default',
                is24Hour: true,
                onChange: handleChange,
            });
            return;
        }

        setShow(true);
    };

    const handleConfirm = () => {
        // iOS 确认时，使用暂存的时间或当前显示的时间
        const timeToUse = tempTime || currentTime;
        const hours = String(timeToUse.getHours()).padStart(2, '0');
        const minutes = String(timeToUse.getMinutes()).padStart(2, '0');
        onChange(`${hours}:${minutes}`);
        setTempTime(null);
        setShow(false);
    };

    const handleCancel = () => {
        setTempTime(null);
        setShow(false);
    };

    const handleClear = () => {
        onChange('');
        setTempTime(null);
        setShow(false);
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            )}
            <TouchableOpacity
                style={[styles.picker, { backgroundColor: colors.primarySurface }]}
                onPress={openPicker}
            >
                <Text style={[styles.pickerText, { color: value ? colors.textPrimary : colors.textTertiary }]}>
                    {value || placeholder || t('placeholder.timeHint', '时间 HH:mm')}
                </Text>
            </TouchableOpacity>

            {show && Platform.OS === 'ios' && (
                <Modal
                    transparent
                    animationType="fade"
                    visible={show}
                    onRequestClose={handleCancel}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={handleCancel}>
                                    <Text style={[styles.modalButton, { color: colors.textSecondary }]}>
                                        {t('common.cancel', '取消')}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                    {t('event.selectTime', '选择时间')}
                                </Text>
                                <TouchableOpacity onPress={handleConfirm}>
                                    <Text style={[styles.modalButton, { color: colors.primary }]}>
                                        {t('common.confirm', '确定')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePickerRN
                                value={tempTime || currentTime}
                                mode="time"
                                display="spinner"
                                onChange={handleChange}
                                locale="zh-CN"
                                style={styles.iosPicker}
                                themeVariant={isDarkMode ? 'dark' : 'light'}
                            />
                            <TouchableOpacity
                                style={[styles.clearButton, { borderColor: colors.border }]}
                                onPress={handleClear}
                            >
                                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                                    {t('event.clearTime', '清除时间')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
    },
    pickerText: {
        fontSize: 16,
    },
    pickerIcon: {
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    modalButton: {
        fontSize: 17,
    },
    iosPicker: {
        height: 200,
    },
    clearButton: {
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 15,
    },
});
