package com.example.daymate.shared.core.utils

/**
 * 事件优先级工具类
 * @description 共享的优先级处理逻辑，与 TypeScript PriorityUtils.ts 保持一致
 */
object PriorityUtils {

    /**
     * 优先级范围定义
     * 0 = 未设置
     * 1-3 = 高优先级
     * 4-6 = 中优先级
     * 7-9 = 低优先级
     */
    val PRIORITY_HIGH_RANGE = 1..3
    val PRIORITY_MEDIUM_RANGE = 4..6
    val PRIORITY_LOW_RANGE = 7..9

    /**
     * 优先级等级枚举
     */
    enum class PriorityLevel {
        HIGH, MEDIUM, LOW, NONE
    }

    /**
     * 根据优先级数值获取优先级等级
     * @param priority 优先级数值 (0-9)
     * @return 优先级等级
     */
    fun getPriorityLevel(priority: Int): PriorityLevel {
        return when (priority) {
            in PRIORITY_HIGH_RANGE -> PriorityLevel.HIGH
            in PRIORITY_MEDIUM_RANGE -> PriorityLevel.MEDIUM
            in PRIORITY_LOW_RANGE -> PriorityLevel.LOW
            else -> PriorityLevel.NONE
        }
    }

    /**
     * 根据优先级获取指示符
     * @param priority 优先级数值
     * @return 优先级指示符字符串
     */
    fun getPriorityIndicator(priority: Int): String {
        return when (getPriorityLevel(priority)) {
            PriorityLevel.HIGH -> "!!!"
            PriorityLevel.MEDIUM -> "!!"
            PriorityLevel.LOW -> "!"
            PriorityLevel.NONE -> ""
        }
    }

    /**
     * 根据优先级获取文本描述
     * @param priority 优先级数值
     * @return 优先级文本
     */
    fun getPriorityText(priority: Int): String {
        return when (getPriorityLevel(priority)) {
            PriorityLevel.HIGH -> "高"
            PriorityLevel.MEDIUM -> "中"
            PriorityLevel.LOW -> "低"
            PriorityLevel.NONE -> "未设置"
        }
    }

    /**
     * 判断是否为高优先级
     * @param priority 优先级数值
     */
    fun isHighPriority(priority: Int): Boolean {
        return getPriorityLevel(priority) == PriorityLevel.HIGH
    }

    /**
     * 比较两个事件的优先级
     * @param a 第一个优先级
     * @param b 第二个优先级
     * @return 负数表示a优先级更高，正数表示b优先级更高
     */
    fun comparePriority(a: Int, b: Int): Int {
        val priorityA = if (a == 0) 10 else a // 未设置的优先级最低
        val priorityB = if (b == 0) 10 else b
        return priorityA - priorityB
    }
}
