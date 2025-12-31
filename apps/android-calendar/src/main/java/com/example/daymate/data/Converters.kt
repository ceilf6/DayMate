package com.example.daymate.data

import androidx.room.TypeConverter
import com.example.daymate.shared.core.models.EventStatus
import com.example.daymate.shared.core.models.Transparency
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class Converters {

    private val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    @TypeConverter
    fun fromLocalDateTime(value: LocalDateTime?): String? {
        return value?.format(formatter)
    }

    @TypeConverter
    fun toLocalDateTime(value: String?): LocalDateTime? {
        return value?.let { LocalDateTime.parse(it, formatter) }
    }

    @TypeConverter
    fun fromEventStatus(value: EventStatus): String {
        return value.name
    }

    @TypeConverter
    fun toEventStatus(value: String): EventStatus {
        return EventStatus.valueOf(value)
    }

    @TypeConverter
    fun fromTransparency(value: Transparency): String {
        return value.name
    }

    @TypeConverter
    fun toTransparency(value: String): Transparency {
        return Transparency.valueOf(value)
    }
}
