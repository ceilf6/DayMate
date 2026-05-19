package com.example.daymate.utils

import android.content.Context
import androidx.core.content.ContextCompat
import com.example.daymate.R
import com.example.daymate.shared.core.utils.PriorityUtils

/**
 * 事件优先级颜色工具类
 * Android UI 层的颜色处理，逻辑委托给 shared/core 的 PriorityUtils
 */
object PriorityColorUtils {

    /**
     * 根据优先级获取颜色资源
     * @param context 上下文
     * @param priority 优先级 (0=未设置, 1-3=高, 4-6=中, 7-9=低)
     * @return Triple<背景色, 边框色, 是否深色主题>
     */
    fun getPriorityColors(context: Context, priority: Int): Triple<Int, Int, Boolean> {
        return when (PriorityUtils.getPriorityLevel(priority)) {
            PriorityUtils.PriorityLevel.HIGH -> Triple(
                ContextCompat.getColor(context, R.color.priority_high),
                ContextCompat.getColor(context, R.color.priority_high_dark),
                true
            )
            PriorityUtils.PriorityLevel.MEDIUM -> Triple(
                ContextCompat.getColor(context, R.color.priority_medium),
                ContextCompat.getColor(context, R.color.priority_medium_dark),
                true
            )
            PriorityUtils.PriorityLevel.LOW -> Triple(
                ContextCompat.getColor(context, R.color.priority_low_light),
                ContextCompat.getColor(context, R.color.priority_low_dark),
                false
            )
            PriorityUtils.PriorityLevel.NONE -> Triple(
                android.graphics.Color.TRANSPARENT,
                android.graphics.Color.TRANSPARENT,
                false
            )
        }
    }

    /**
     * 根据优先级获取优先级指示符
     * 委托给 shared/core PriorityUtils
     */
    fun getPriorityIndicator(priority: Int): String = PriorityUtils.getPriorityIndicator(priority)

    /**
     * 根据优先级获取颜色资源ID
     */
    fun getPriorityColorRes(priority: Int): Int {
        return when (PriorityUtils.getPriorityLevel(priority)) {
            PriorityUtils.PriorityLevel.HIGH -> R.color.priority_high
            PriorityUtils.PriorityLevel.MEDIUM -> R.color.priority_medium
            PriorityUtils.PriorityLevel.LOW -> R.color.priority_low
            PriorityUtils.PriorityLevel.NONE -> R.color.priority_default
        }
    }

    /**
     * 根据优先级获取优先级文本
     * 委托给 shared/core PriorityUtils
     */
    fun getPriorityText(priority: Int): String = PriorityUtils.getPriorityText(priority)
}
