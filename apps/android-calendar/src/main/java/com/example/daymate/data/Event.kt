package com.example.daymate.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.daymate.shared.core.models.EventStatus
import com.example.daymate.shared.core.models.Transparency
import com.example.daymate.shared.core.models.SimpleCalendarEvent
import java.io.Serializable
import java.time.LocalDateTime

/**
 * 日历事件实体类
 * 基于RFC5545标准的iCalendar格式设计
 */
@Entity(
    tableName = "events",
    indices = [
        androidx.room.Index(value = ["startTime"]),
        androidx.room.Index(value = ["endTime"]),
        androidx.room.Index(value = ["category"]),
        androidx.room.Index(value = ["reminderMinutes"])
    ]
)
data class Event(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    // 基本信息
    val title: String,
    val description: String? = null,
    val location: String? = null,

    // 时间信息
    val startTime: LocalDateTime,
    val endTime: LocalDateTime,
    val allDay: Boolean = false,

    // 重复规则 (RRULE)
    val recurrenceRule: String? = null,
    val recurrenceId: Long? = null, // 用于标识重复事件的实例

    // 提醒设置
    val reminderMinutes: Int? = null, // 提前多少分钟提醒

    // 分类和优先级
    val category: String? = null,
    val priority: Int = 0, // 0-9, 0为未设置，1最高，9最低

    // 状态 (使用 shared/core 的枚举)
    val status: EventStatus = EventStatus.CONFIRMED,

    // 透明度 (使用 shared/core 的枚举)
    val transparency: Transparency = Transparency.OPAQUE,

    // 创建和更新时间
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now(),

    // 外部日历支持
    val calendarId: String? = null, // 用于支持多个日历
    val externalId: String? = null, // 外部日历系统的事件ID

    // 农历相关
    val lunarDate: String? = null, // 农历日期
    val isLunarEvent: Boolean = false // 是否为农历事件
) : Serializable {

    /**
     * 转换为 SimpleCalendarEvent (用于 iCalendar 导入导出)
     */
    fun toSimpleCalendarEvent(): SimpleCalendarEvent {
        return SimpleCalendarEvent(
            id = id.toString(),
            title = title,
            description = description,
            location = location,
            startTime = startTime,
            endTime = endTime,
            allDay = allDay,
            recurrenceRule = recurrenceRule,
            reminderMinutes = reminderMinutes,
            category = category,
            priority = priority,
            status = status,
            transparency = transparency,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    companion object {
        /**
         * 从 SimpleCalendarEvent 创建 Event
         */
        fun fromSimpleCalendarEvent(simple: SimpleCalendarEvent): Event {
            return Event(
                id = simple.id.toLongOrNull() ?: 0,
                title = simple.title,
                description = simple.description,
                location = simple.location,
                startTime = simple.startTime,
                endTime = simple.endTime,
                allDay = simple.allDay,
                recurrenceRule = simple.recurrenceRule,
                reminderMinutes = simple.reminderMinutes,
                category = simple.category,
                priority = simple.priority,
                status = simple.status,
                transparency = simple.transparency,
                createdAt = simple.createdAt,
                updatedAt = simple.updatedAt
            )
        }
    }
}
