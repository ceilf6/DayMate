import React, { memo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    TextInput,
} from 'react-native';
import DateTimePickerRN, {
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
    const [showAndroidEditor, setShowAndroidEditor] = useState(false);
    const [androidYear, setAndroidYear] = useState('');
    const [androidMonth, setAndroidMonth] = useState('');
    const [androidDay, setAndroidDay] = useState('');
    const [androidDateError, setAndroidDateError] = useState('');

    const currentDate = parseDateValue(value);

    const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        // iOS: 暂存选择的日期
        if (selectedDate) {
            setTempDate(selectedDate);
        }
    };

    const openPicker = () => {
        if (Platform.OS === 'android') {
            setAndroidYear(String(currentDate.getFullYear()));
            setAndroidMonth(String(currentDate.getMonth() + 1).padStart(2, '0'));
            setAndroidDay(String(currentDate.getDate()).padStart(2, '0'));
            setAndroidDateError('');
            setShowAndroidEditor(true);
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

    const handleClearAndroidDate = () => {
        onChange('');
        setAndroidDateError('');
        setShowAndroidEditor(false);
    };

    const parseAndroidDatePart = (raw: string, min: number, max: number, exactDigits?: number): number | null => {
        const trimmed = raw.trim();
        const digitPattern = exactDigits ? new RegExp(`^\\d{${exactDigits}}$`) : /^\d{1,2}$/;
        if (!digitPattern.test(trimmed)) return null;
        const parsed = Number(trimmed);
        if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
        return parsed;
    };

    const handleConfirmAndroidDateEditor = () => {
        const year = parseAndroidDatePart(androidYear, 1, 9999, 4);
        const month = parseAndroidDatePart(androidMonth, 1, 12);
        const day = parseAndroidDatePart(androidDay, 1, 31);
        if (year === null || month === null || day === null) {
            setAndroidDateError(t('event.invalidDate', '请输入有效日期（YYYY-MM-DD）') as string);
            return;
        }

        const picked = new Date(year, month - 1, day, 0, 0, 0, 0);
        const isSameDate = picked.getFullYear() === year
            && picked.getMonth() === month - 1
            && picked.getDate() === day;
        if (!isSameDate) {
            setAndroidDateError(t('event.invalidDate', '请输入有效日期（YYYY-MM-DD）') as string);
            return;
        }

        onChange(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
        setAndroidDateError('');
        setShowAndroidEditor(false);
    };

    const handleCancelAndroidDateEditor = () => {
        setAndroidDateError('');
        setShowAndroidEditor(false);
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

            {showAndroidEditor && Platform.OS === 'android' && (
                <Modal
                    transparent
                    animationType="fade"
                    visible={showAndroidEditor}
                    onRequestClose={handleCancelAndroidDateEditor}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.androidEditorContent, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                {t('event.selectDate', '选择日期')}
                            </Text>

                            <View style={styles.androidDateEditorRow}>
                                <TextInput
                                    value={androidYear}
                                    onChangeText={(text) => {
                                        setAndroidYear(text.replace(/\D/g, '').slice(0, 4));
                                        if (androidDateError) setAndroidDateError('');
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    placeholder="YYYY"
                                    placeholderTextColor={colors.textTertiary}
                                    style={[
                                        styles.androidDateInput,
                                        {
                                            width: 100,
                                            backgroundColor: colors.primarySurface,
                                            color: colors.textPrimary,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                />
                                <Text style={[styles.androidDateSeparator, { color: colors.textPrimary }]}>-</Text>
                                <TextInput
                                    value={androidMonth}
                                    onChangeText={(text) => {
                                        setAndroidMonth(text.replace(/\D/g, '').slice(0, 2));
                                        if (androidDateError) setAndroidDateError('');
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="MM"
                                    placeholderTextColor={colors.textTertiary}
                                    style={[
                                        styles.androidDateInput,
                                        {
                                            backgroundColor: colors.primarySurface,
                                            color: colors.textPrimary,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                />
                                <Text style={[styles.androidDateSeparator, { color: colors.textPrimary }]}>-</Text>
                                <TextInput
                                    value={androidDay}
                                    onChangeText={(text) => {
                                        setAndroidDay(text.replace(/\D/g, '').slice(0, 2));
                                        if (androidDateError) setAndroidDateError('');
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="DD"
                                    placeholderTextColor={colors.textTertiary}
                                    style={[
                                        styles.androidDateInput,
                                        {
                                            backgroundColor: colors.primarySurface,
                                            color: colors.textPrimary,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                />
                            </View>

                            {androidDateError ? (
                                <Text style={styles.androidDateErrorText}>{androidDateError}</Text>
                            ) : null}

                            <View style={styles.androidActionsRow}>
                                <TouchableOpacity
                                    style={[styles.androidActionButton, { borderColor: colors.border }]}
                                    onPress={handleClearAndroidDate}
                                >
                                    <Text style={[styles.androidActionText, { color: colors.textSecondary }]}>
                                        {t('event.clearDate', '清除日期')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.androidActionButton, { borderColor: colors.border }]}
                                    onPress={handleCancelAndroidDateEditor}
                                >
                                    <Text style={[styles.androidActionText, { color: colors.textSecondary }]}>
                                        {t('common.cancel', '取消')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.androidActionButton, styles.androidConfirmButton, { backgroundColor: colors.primary }]}
                                    onPress={handleConfirmAndroidDateEditor}
                                >
                                    <Text style={styles.androidConfirmText}>
                                        {t('common.confirm', '确定')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
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
    const [showAndroidEditor, setShowAndroidEditor] = useState(false);
    const [androidHour, setAndroidHour] = useState('');
    const [androidMinute, setAndroidMinute] = useState('');
    const [androidTimeError, setAndroidTimeError] = useState('');

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
            setAndroidHour(String(currentTime.getHours()).padStart(2, '0'));
            setAndroidMinute(String(currentTime.getMinutes()).padStart(2, '0'));
            setAndroidTimeError('');
            setShowAndroidEditor(true);
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
        setShowAndroidEditor(false);
        setAndroidTimeError('');
    };

    const parseAndroidTimePart = (raw: string, max: number): number | null => {
        const trimmed = raw.trim();
        if (!/^\d{1,2}$/.test(trimmed)) return null;
        const parsed = Number(trimmed);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > max) return null;
        return parsed;
    };

    const handleConfirmAndroidEditor = () => {
        const hour = parseAndroidTimePart(androidHour, 23);
        const minute = parseAndroidTimePart(androidMinute, 59);
        if (hour === null || minute === null) {
            setAndroidTimeError(t('event.invalidTime', '请输入有效时间（00:00 - 23:59）') as string);
            return;
        }

        onChange(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        setAndroidTimeError('');
        setShowAndroidEditor(false);
    };

    const handleCancelAndroidEditor = () => {
        setAndroidTimeError('');
        setShowAndroidEditor(false);
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

            {showAndroidEditor && Platform.OS === 'android' && (
                <Modal
                    transparent
                    animationType="fade"
                    visible={showAndroidEditor}
                    onRequestClose={handleCancelAndroidEditor}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.androidEditorContent, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                {t('event.selectTime', '选择时间')}
                            </Text>

                            <View style={styles.androidTimeEditorRow}>
                                <TextInput
                                    value={androidHour}
                                    onChangeText={(text) => {
                                        setAndroidHour(text.replace(/\D/g, '').slice(0, 2));
                                        if (androidTimeError) setAndroidTimeError('');
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="HH"
                                    placeholderTextColor={colors.textTertiary}
                                    style={[
                                        styles.androidTimeInput,
                                        {
                                            backgroundColor: colors.primarySurface,
                                            color: colors.textPrimary,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                />
                                <Text style={[styles.androidTimeSeparator, { color: colors.textPrimary }]}>:</Text>
                                <TextInput
                                    value={androidMinute}
                                    onChangeText={(text) => {
                                        setAndroidMinute(text.replace(/\D/g, '').slice(0, 2));
                                        if (androidTimeError) setAndroidTimeError('');
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    placeholder="mm"
                                    placeholderTextColor={colors.textTertiary}
                                    style={[
                                        styles.androidTimeInput,
                                        {
                                            backgroundColor: colors.primarySurface,
                                            color: colors.textPrimary,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                />
                            </View>

                            {androidTimeError ? (
                                <Text style={styles.androidTimeErrorText}>{androidTimeError}</Text>
                            ) : null}

                            <View style={styles.androidActionsRow}>
                                <TouchableOpacity
                                    style={[styles.androidActionButton, { borderColor: colors.border }]}
                                    onPress={handleClear}
                                >
                                    <Text style={[styles.androidActionText, { color: colors.textSecondary }]}>
                                        {t('event.clearTime', '清除时间')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.androidActionButton, { borderColor: colors.border }]}
                                    onPress={handleCancelAndroidEditor}
                                >
                                    <Text style={[styles.androidActionText, { color: colors.textSecondary }]}>
                                        {t('common.cancel', '取消')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.androidActionButton, styles.androidConfirmButton, { backgroundColor: colors.primary }]}
                                    onPress={handleConfirmAndroidEditor}
                                >
                                    <Text style={styles.androidConfirmText}>
                                        {t('common.confirm', '确定')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
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
    androidEditorContent: {
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 16,
    },
    androidTimeEditorRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 8,
    },
    androidTimeInput: {
        width: 80,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
    },
    androidTimeSeparator: {
        fontSize: 26,
        fontWeight: '600',
        marginHorizontal: 10,
    },
    androidTimeErrorText: {
        marginTop: 8,
        fontSize: 13,
        color: '#D32F2F',
        textAlign: 'center',
    },
    androidDateEditorRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 8,
    },
    androidDateInput: {
        width: 80,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    androidDateSeparator: {
        fontSize: 20,
        fontWeight: '600',
        marginHorizontal: 8,
    },
    androidDateErrorText: {
        marginTop: 8,
        fontSize: 13,
        color: '#D32F2F',
        textAlign: 'center',
    },
    androidActionsRow: {
        marginTop: 14,
        flexDirection: 'row',
        gap: 8,
    },
    androidActionButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    androidActionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    androidConfirmButton: {
        borderWidth: 0,
    },
    androidConfirmText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
