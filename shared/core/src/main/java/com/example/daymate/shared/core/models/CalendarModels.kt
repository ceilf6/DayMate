package com.example.daymate.shared.core.models

import java.time.LocalDate
import java.time.LocalDateTime

/**
 * 事件状态
 * 与 TypeScript EventStatus 保持一致
 */
enum class EventStatus {
    CONFIRMED,    // 已确认
    TENTATIVE,    // 暂定
    CANCELLED     // 已取消
}

/**
 * 事件透明度
 * 与 TypeScript EventTransparency 保持一致
 */
enum class Transparency {
    OPAQUE,       // 不透明（占用时间）
    TRANSPARENT   // 透明（不占用时间）
}

/**
 * 简化版日历事件数据模型
 * 与 TypeScript (@daymate/shared) 的 CalendarEvent 保持一致
 * 用于跨平台数据交换和 iCalendar 导入导出
 */
data class SimpleCalendarEvent(
    val id: String,
    val title: String,
    val description: String? = null,
    val location: String? = null,
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val allDay: Boolean = false,
    val recurrenceRule: String? = null,
    val reminderMinutes: Int? = null,
    val category: String? = null,
    val priority: Int = 0,              // 0-9, 0为未设置，1最高，9最低
    val status: EventStatus = EventStatus.CONFIRMED,
    val transparency: Transparency = Transparency.OPAQUE,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    /**
     * 获取日期字符串 (yyyy-MM-dd)
     */
    fun getDateString(): String = startTime.toLocalDate().toString()

    /**
     * 获取开始时间字符串 (HH:mm)
     */
    fun getStartTimeString(): String? {
        if (allDay) return null
        return String.format("%02d:%02d", startTime.hour, startTime.minute)
    }

    /**
     * 获取结束时间字符串 (HH:mm)
     */
    fun getEndTimeString(): String? {
        if (allDay) return null
        return String.format("%02d:%02d", endTime.hour, endTime.minute)
    }
}

/**
 * 创建事件的输入数据
 * 与 TypeScript 的 CreateCalendarEventInput 对应
 */
data class CreateSimpleCalendarEventInput(
    val date: String,
    val title: String,
    val startTime: String? = null,
    val endTime: String? = null,
    val notes: String? = null,
    val reminderMinutes: Int? = null
)

/**
 * 日历事件数据模型（完整版，用于 Android 原生应用）
 * 保留更丰富的字段以支持高级功能
 */
data class CalendarEvent(
    val id: String,
    val title: String,
    val description: String? = null,
    val startDateTime: LocalDateTime,
    val endDateTime: LocalDateTime,
    val isAllDay: Boolean = false,
    val location: String? = null,
    val recurrenceRule: String? = null,
    val reminders: List<ReminderConfig> = emptyList(),
    val color: String? = null,
    val calendarId: String? = null,
    val priority: Int = 0,
    val status: EventStatus = EventStatus.CONFIRMED,
    val transparency: Transparency = Transparency.OPAQUE,
    val category: String? = null,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    /**
     * 转换为简化版模型（用于跨平台数据交换）
     */
    fun toSimple(): SimpleCalendarEvent {
        return SimpleCalendarEvent(
            id = id,
            title = title,
            description = description,
            location = location,
            startTime = startDateTime,
            endTime = endDateTime,
            allDay = isAllDay,
            recurrenceRule = recurrenceRule,
            reminderMinutes = reminders.firstOrNull()?.minutesBefore,
            category = category,
            priority = priority,
            status = status,
            transparency = transparency,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}

/**
 * 提醒配置
 */
data class ReminderConfig(
    val minutesBefore: Int,
    val type: ReminderType = ReminderType.NOTIFICATION
)

enum class ReminderType {
    NOTIFICATION,
    EMAIL,
    SMS
}

/**
 * 农历日期信息
 * 与 TypeScript 的 LunarDate 对应
 */
data class LunarDate(
    val year: Int,                     // 农历年份
    val month: Int,                    // 农历月份（1-12）
    val day: Int,                      // 农历日期（1-30）
    val isLeapMonth: Boolean = false,  // 是否是闰月
    val yearGanZhi: String,            // 天干地支年（与 TS 的 yearGanZhi 对应）
    val yearShengXiao: String,         // 生肖（与 TS 的 yearShengXiao 对应）
    val monthStr: String,              // 月份中文（与 TS 的 monthStr 对应）
    val dayStr: String,                // 日期中文（与 TS 的 dayStr 对应）
    val solarTerm: String? = null      // 节气
)

/**
 * 日历视图类型
 */
enum class CalendarViewType {
    MONTH,
    WEEK,
    DAY,
    AGENDA
}
