import React, { memo, useState, useCallback, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { SubscriptionService, CalendarSubscription, SubscriptionEvent } from '../services/SubscriptionService';

interface SubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubscriptionSync: (events: SubscriptionEvent[]) => Promise<void>;
}

const SubscriptionModal = memo(({
    visible,
    onClose,
    onSubscriptionSync,
}: SubscriptionModalProps) => {
    const { colors } = useTheme();
    const { t } = useI18n();

    const [subscriptions, setSubscriptions] = useState<CalendarSubscription[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // 加载订阅列表
    const loadSubscriptions = useCallback(async () => {
        setIsLoading(true);
        try {
            const subs = await SubscriptionService.getAllSubscriptions();
            setSubscriptions(subs);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            loadSubscriptions();
            setError('');
            setSuccess('');
            setIsAdding(false);
            setNewName('');
            setNewUrl('');
        }
    }, [visible, loadSubscriptions]);

    const handleAddSubscription = useCallback(async () => {
        setError('');
        setSuccess('');

        if (!newName.trim()) {
            setError(t('subscription.nameRequired', '请输入订阅名称'));
            return;
        }

        if (!newUrl.trim()) {
            setError(t('subscription.urlRequired', '请输入订阅地址'));
            return;
        }

        setIsLoading(true);
        try {
            // 验证 URL
            const validation = await SubscriptionService.validateSubscriptionUrl(newUrl);
            if (!validation.valid) {
                setError(validation.error || t('subscription.invalidUrl', '无效的订阅地址'));
                return;
            }

            // 添加订阅
            const newSub = await SubscriptionService.addSubscription(newName, newUrl);

            // 自动同步该订阅的事件
            const result = await SubscriptionService.syncSubscription(newSub);
            if (result.success && result.events.length > 0) {
                await onSubscriptionSync(result.events);
            }

            setSuccess(t('subscription.addSuccess', '订阅添加成功！') +
                (result.events.length ? ` (${result.events.length} ${t('subscription.eventsFound', '个事件')})` : ''));

            setNewName('');
            setNewUrl('');
            setIsAdding(false);
            await loadSubscriptions();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('subscription.addFailed', '添加失败'));
        } finally {
            setIsLoading(false);
        }
    }, [newName, newUrl, t, loadSubscriptions, onSubscriptionSync]);

    const handleDeleteSubscription = useCallback(async (sub: CalendarSubscription) => {
        Alert.alert(
            t('subscription.deleteConfirmTitle', '删除订阅'),
            t('subscription.deleteConfirmMessage', '确定要删除订阅 "{{name}}" 吗？').replace('{{name}}', sub.name),
            [
                { text: t('common.cancel', '取消'), style: 'cancel' },
                {
                    text: t('common.delete', '删除'),
                    style: 'destructive',
                    onPress: async () => {
                        // 删除订阅
                        await SubscriptionService.deleteSubscription(sub.id);
                        // 同时删除该订阅的所有事件
                        await SubscriptionService.deleteSubscriptionEvents(sub.id);
                        // 刷新订阅列表
                        await loadSubscriptions();
                        // 通知父组件刷新事件显示（传空数组触发刷新）
                        await onSubscriptionSync([]);
                    },
                },
            ]
        );
    }, [t, loadSubscriptions, onSubscriptionSync]);

    const handleToggleSubscription = useCallback(async (sub: CalendarSubscription) => {
        await SubscriptionService.updateSubscription(sub.id, { enabled: !sub.enabled });
        await loadSubscriptions();
    }, [loadSubscriptions]);

    const handleSyncAll = useCallback(async () => {
        setError('');
        setSuccess('');
        setIsSyncing(true);

        try {
            const results = await SubscriptionService.syncAllSubscriptions();
            const successResults = results.filter(r => r.success);
            const failedResults = results.filter(r => !r.success);

            // 收集所有同步的事件
            const allEvents = successResults.flatMap(r => r.events);

            if (allEvents.length > 0) {
                await onSubscriptionSync(allEvents);
            }

            if (failedResults.length > 0) {
                setError(t('subscription.someSyncFailed', '部分订阅同步失败：') +
                    failedResults.map(r => r.subscription.name).join(', '));
            } else if (successResults.length > 0) {
                setSuccess(t('subscription.syncSuccess', '同步成功！共导入 {{count}} 个事件').replace('{{count}}', String(allEvents.length)));
            } else {
                setError(t('subscription.noEnabledSubscriptions', '没有启用的订阅'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('subscription.syncFailed', '同步失败'));
        } finally {
            setIsSyncing(false);
        }
    }, [t, onSubscriptionSync]);

    const handleSyncOne = useCallback(async (sub: CalendarSubscription) => {
        setError('');
        setSuccess('');
        setIsSyncing(true);

        try {
            const result = await SubscriptionService.syncSubscription(sub);

            if (result.success) {
                if (result.events.length > 0) {
                    await onSubscriptionSync(result.events);
                }
                setSuccess(t('subscription.syncOneSuccess', '"{{name}}" 同步成功！导入 {{count}} 个事件')
                    .replace('{{name}}', sub.name)
                    .replace('{{count}}', String(result.events.length)));
                await loadSubscriptions();
            } else {
                setError(result.error || t('subscription.syncFailed', '同步失败'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('subscription.syncFailed', '同步失败'));
        } finally {
            setIsSyncing(false);
        }
    }, [t, onSubscriptionSync, loadSubscriptions]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                            {t('subscription.title', '日历订阅')}
                        </Text>

                        {/* 订阅列表 */}
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            {t('subscription.mySubscriptions', '我的订阅')}
                        </Text>

                        {isLoading && !isSyncing ? (
                            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                        ) : subscriptions.length === 0 ? (
                            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                                {t('subscription.noSubscriptions', '暂无订阅，点击下方按钮添加')}
                            </Text>
                        ) : (
                            <View style={styles.subscriptionList}>
                                {subscriptions.map((sub) => (
                                    <View
                                        key={sub.id}
                                        style={[styles.subscriptionItem, { backgroundColor: colors.primarySurface }]}
                                    >
                                        <TouchableOpacity
                                            style={styles.subscriptionToggle}
                                            onPress={() => handleToggleSubscription(sub)}
                                        >
                                            <View style={[
                                                styles.checkbox,
                                                { borderColor: colors.border },
                                                sub.enabled && { backgroundColor: colors.primary, borderColor: colors.primary }
                                            ]}>
                                                {sub.enabled && <Text style={styles.checkmark}>✓</Text>}
                                            </View>
                                        </TouchableOpacity>

                                        <View style={styles.subscriptionInfo}>
                                            <Text style={[styles.subscriptionName, { color: colors.textPrimary }]}>
                                                {sub.name}
                                            </Text>
                                            <Text
                                                style={[styles.subscriptionUrl, { color: colors.textTertiary }]}
                                                numberOfLines={1}
                                            >
                                                {sub.url}
                                            </Text>
                                            {sub.lastSyncAt && (
                                                <Text style={[styles.subscriptionMeta, { color: colors.textTertiary }]}>
                                                    {t('subscription.lastSync', '上次同步')}: {new Date(sub.lastSyncAt).toLocaleString()}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={styles.subscriptionActions}>
                                            <TouchableOpacity
                                                style={[styles.syncButton, { backgroundColor: colors.primary }]}
                                                onPress={() => handleSyncOne(sub)}
                                                disabled={isSyncing}
                                            >
                                                <Text style={styles.syncButtonText}>
                                                    {t('subscription.sync', '同步')}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => handleDeleteSubscription(sub)}
                                            >
                                                <Text style={styles.deleteButtonText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* 同步所有按钮 */}
                        {subscriptions.length > 0 && (
                            <TouchableOpacity
                                style={[styles.syncAllButton, { backgroundColor: colors.primary }]}
                                onPress={handleSyncAll}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.syncAllButtonText}>
                                        {t('subscription.syncAll', '同步所有订阅')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* 添加新订阅 */}
                        {isAdding ? (
                            <View style={styles.addForm}>
                                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                    {t('subscription.addNew', '添加新订阅')}
                                </Text>
                                <TextInput
                                    value={newName}
                                    onChangeText={setNewName}
                                    placeholder={t('subscription.namePlaceholder', '订阅名称')}
                                    placeholderTextColor={colors.textTertiary}
                                    style={[styles.input, { backgroundColor: colors.primarySurface, color: colors.textPrimary }]}
                                />
                                <TextInput
                                    value={newUrl}
                                    onChangeText={setNewUrl}
                                    placeholder={t('subscription.urlPlaceholder', 'https://example.com/calendar.ics')}
                                    placeholderTextColor={colors.textTertiary}
                                    style={[styles.input, { backgroundColor: colors.primarySurface, color: colors.textPrimary }]}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                />
                                <View style={styles.addFormButtons}>
                                    <TouchableOpacity
                                        style={[styles.formButton, { borderColor: colors.border }]}
                                        onPress={() => {
                                            setIsAdding(false);
                                            setNewName('');
                                            setNewUrl('');
                                            setError('');
                                        }}
                                    >
                                        <Text style={[styles.formButtonText, { color: colors.textSecondary }]}>
                                            {t('common.cancel', '取消')}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.formButton, { backgroundColor: colors.primary }]}
                                        onPress={handleAddSubscription}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.formButtonTextPrimary}>
                                                {t('subscription.add', '添加')}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.primarySurface }]}
                                onPress={() => setIsAdding(true)}
                            >
                                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                                    + {t('subscription.addSubscription', '添加订阅')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* 错误/成功提示 */}
                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}
                        {success ? (
                            <Text style={styles.successText}>{success}</Text>
                        ) : null}

                        {/* 关闭按钮 */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.closeButton, { borderColor: colors.border }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
                                    {t('common.close', '关闭')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
});

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalCard: {
        width: '90%',
        maxWidth: 400,
        maxHeight: '85%',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        textAlign: 'center',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
    },
    loader: {
        marginVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginVertical: 16,
    },
    subscriptionList: {
        gap: 10,
    },
    subscriptionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
    },
    subscriptionToggle: {
        marginRight: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    subscriptionInfo: {
        flex: 1,
    },
    subscriptionName: {
        fontSize: 15,
        fontWeight: '600',
    },
    subscriptionUrl: {
        fontSize: 12,
        marginTop: 2,
    },
    subscriptionMeta: {
        fontSize: 11,
        marginTop: 4,
    },
    subscriptionActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    syncButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    syncButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ffffff',
    },
    deleteButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
    },
    syncAllButton: {
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    syncAllButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    addForm: {
        marginTop: 16,
    },
    input: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        fontSize: 15,
        marginBottom: 10,
    },
    addFormButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    formButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    formButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    formButtonTextPrimary: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    addButton: {
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        marginTop: 12,
        textAlign: 'center',
    },
    successText: {
        color: '#10B981',
        fontSize: 13,
        marginTop: 12,
        textAlign: 'center',
    },
    modalActions: {
        marginTop: 20,
    },
    closeButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    closeButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default SubscriptionModal;
