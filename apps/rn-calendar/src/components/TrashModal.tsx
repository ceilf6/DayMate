import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';
import { TrashService, TrashedEvent } from '../services/TrashService';

interface TrashModalProps {
    visible: boolean;
    onClose: () => void;
    onRestore: (event: any) => Promise<void>;
}

const TrashModal: React.FC<TrashModalProps> = ({ visible, onClose, onRestore }) => {
    const { t } = useI18n();
    const { colors } = useTheme();

    const [trashItems, setTrashItems] = useState<TrashedEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);
    const [isDeletedExpanded, setIsDeletedExpanded] = useState(true);

    // 分离已完成和已删除的事项
    const completedItems = useMemo(() => {
        return trashItems.filter(item => item.itemType === 'completed');
    }, [trashItems]);

    const deletedItems = useMemo(() => {
        return trashItems.filter(item => item.itemType === 'deleted');
    }, [trashItems]);

    // 加载垃圾桶内容
    const loadTrashItems = useCallback(async () => {
        setLoading(true);
        try {
            // 先清理过期项目
            await TrashService.cleanupExpiredItems();
            const items = await TrashService.getTrashItems();
            setTrashItems(items);
        } catch (error) {
            console.error('加载垃圾桶失败:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            loadTrashItems();
        }
    }, [visible, loadTrashItems]);

    // 恢复事项
    const handleRestore = async (item: TrashedEvent) => {
        setActionLoading(item.id);
        try {
            const restored = await TrashService.restoreFromTrash(item.id);
            if (restored) {
                await onRestore(restored);
                setTrashItems(prev => prev.filter(i => i.id !== item.id));
                Alert.alert(
                    t('common.ok', '成功') as string,
                    t('trash.restoreSuccess', '事项已恢复') as string
                );
            }
        } catch (error) {
            Alert.alert(
                t('error.title', '错误') as string,
                t('trash.restoreFailed', '恢复失败') as string
            );
        } finally {
            setActionLoading(null);
        }
    };

    // 永久删除单个事项
    const handlePermanentDelete = (item: TrashedEvent) => {
        Alert.alert(
            t('trash.permanentDeleteTitle', '永久删除') as string,
            t('trash.permanentDeleteConfirm', '此操作不可撤销，确定要永久删除吗？') as string,
            [
                { text: t('common.cancel', '取消') as string, style: 'cancel' },
                {
                    text: t('common.delete', '删除') as string,
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(item.id);
                        try {
                            await TrashService.permanentlyDelete(item.id);
                            setTrashItems(prev => prev.filter(i => i.id !== item.id));
                        } catch (error) {
                            Alert.alert(
                                t('error.title', '错误') as string,
                                t('error.deleteFailed', '删除失败') as string
                            );
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    // 清空垃圾桶
    const handleEmptyTrash = () => {
        if (trashItems.length === 0) return;

        Alert.alert(
            t('trash.emptyTrashTitle', '清空垃圾桶') as string,
            t('trash.emptyTrashConfirm', '确定要永久删除所有事项吗？此操作不可撤销。') as string,
            [
                { text: t('common.cancel', '取消') as string, style: 'cancel' },
                {
                    text: t('trash.emptyTrash', '清空') as string,
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await TrashService.emptyTrash();
                            setTrashItems([]);
                        } catch (error) {
                            Alert.alert(
                                t('error.title', '错误') as string,
                                t('error.deleteFailed', '删除失败') as string
                            );
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    // 格式化删除时间
    const formatDeletedAt = (isoString: string): string => {
        const date = new Date(isoString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
    };

    // 渲染事项列表
    const renderItemList = (items: TrashedEvent[], showUncompleteButton: boolean = false) => {
        if (items.length === 0) {
            return (
                <View style={styles.sectionEmptyContainer}>
                    <Text style={[styles.sectionEmptyText, { color: colors.textTertiary }]}>
                        暂无事项
                    </Text>
                </View>
            );
        }

        return items.map(item => {
            const daysLeft = TrashService.getDaysUntilPermanentDelete(item);
            const isLoading = actionLoading === item.id;

            return (
                <View
                    key={item.id}
                    style={[styles.itemCard, { backgroundColor: colors.primarySurface }]}>
                    <View style={styles.itemContent}>
                        <Text
                            style={[styles.itemTitle, { color: colors.textPrimary }]}
                            numberOfLines={1}>
                            {item.title}
                        </Text>
                        <View style={styles.itemMeta}>
                            {item.originalDate && item.originalDate !== 'NO_DATE' && (
                                <>
                                    <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
                                        {item.originalDate}
                                    </Text>
                                    <Text style={[styles.itemDot, { color: colors.textDisabled }]}>•</Text>
                                </>
                            )}
                            <Text style={[styles.itemDeletedAt, { color: colors.textSecondary }]}>
                                {item.itemType === 'completed' ? '完成于' : t('trash.deletedAt', '删除于') as string} {formatDeletedAt(item.deletedAt)}
                            </Text>
                        </View>
                        <Text style={[styles.daysLeft, { color: daysLeft <= 7 ? '#EF4444' : colors.textTertiary }]}>
                            {(t('trash.daysLeft') as string).replace('{{days}}', String(daysLeft))}
                        </Text>
                    </View>
                    <View style={styles.itemActions}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <>
                                {showUncompleteButton ? (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.restoreButton, { backgroundColor: colors.primary }]}
                                        onPress={() => handleRestore(item)}>
                                        <Text style={styles.actionButtonText}>
                                            取消完成
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.restoreButton, { backgroundColor: colors.primary }]}
                                        onPress={() => handleRestore(item)}>
                                        <Text style={styles.actionButtonText}>
                                            {t('trash.restore', '恢复') as string}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.primaryBackground }]}
                                    onPress={() => handlePermanentDelete(item)}>
                                    <Text style={[styles.deleteButtonText]}>
                                        {t('common.delete', '删除') as string}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            );
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.primaryBackground }]}>
                {/* 头部 */}
                <View style={[styles.header, { backgroundColor: colors.primarySurface }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                            {t('common.close', '关闭') as string}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        {t('trash.title', '垃圾桶') as string}
                    </Text>
                    <TouchableOpacity
                        onPress={handleEmptyTrash}
                        style={styles.emptyButton}
                        disabled={trashItems.length === 0}>
                        <Text style={[
                            styles.emptyButtonText,
                            { color: trashItems.length > 0 ? '#EF4444' : colors.textDisabled }
                        ]}>
                            {t('trash.emptyTrash', '清空') as string}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 提示信息 */}
                <View style={[styles.infoBar, { backgroundColor: colors.primarySurface }]}>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {t('trash.autoDeleteHint', '事项将在删除后 30 天自动永久删除') as string}
                    </Text>
                </View>

                {/* 内容区域 */}
                <ScrollView style={styles.content}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : trashItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyIcon]}>🗑️</Text>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {t('trash.empty', '垃圾桶是空的') as string}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.sectionsContainer}>
                            {/* 已完成事项区域 */}
                            <View style={[styles.section, { backgroundColor: colors.primarySurface }]}>
                                <TouchableOpacity
                                    style={styles.sectionHeader}
                                    onPress={() => setIsCompletedExpanded(!isCompletedExpanded)}
                                    activeOpacity={0.7}>
                                    <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                                        {isCompletedExpanded ? '▼' : '▶'}
                                    </Text>
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                        已完成事项
                                    </Text>
                                    <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
                                        ({completedItems.length})
                                    </Text>
                                </TouchableOpacity>
                                {isCompletedExpanded && (
                                    <View style={styles.sectionContent}>
                                        {renderItemList(completedItems, true)}
                                    </View>
                                )}
                            </View>

                            {/* 删除事项区域 */}
                            <View style={[styles.section, { backgroundColor: colors.primarySurface }]}>
                                <TouchableOpacity
                                    style={styles.sectionHeader}
                                    onPress={() => setIsDeletedExpanded(!isDeletedExpanded)}
                                    activeOpacity={0.7}>
                                    <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                                        {isDeletedExpanded ? '▼' : '▶'}
                                    </Text>
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                        删除事项
                                    </Text>
                                    <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
                                        ({deletedItems.length})
                                    </Text>
                                </TouchableOpacity>
                                {isDeletedExpanded && (
                                    <View style={styles.sectionContent}>
                                        {renderItemList(deletedItems, false)}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    closeButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptyButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    emptyButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    infoBar: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    infoText: {
        fontSize: 13,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
    },
    sectionsContainer: {
        padding: 12,
        gap: 12,
    },
    section: {
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    expandIcon: {
        fontSize: 10,
        marginRight: 8,
        width: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    countBadge: {
        fontSize: 14,
        marginLeft: 6,
    },
    sectionContent: {
        gap: 10,
        paddingTop: 4,
    },
    sectionEmptyContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    sectionEmptyText: {
        fontSize: 14,
    },
    list: {
        padding: 12,
        gap: 10,
    },
    itemCard: {
        borderRadius: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    itemContent: {
        marginBottom: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemDate: {
        fontSize: 13,
    },
    itemDot: {
        marginHorizontal: 6,
        fontSize: 13,
    },
    itemDeletedAt: {
        fontSize: 13,
    },
    daysLeft: {
        fontSize: 12,
        marginTop: 2,
    },
    itemActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    restoreButton: {},
    deleteButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        // borderColor: '#EF4444',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default TrashModal;
