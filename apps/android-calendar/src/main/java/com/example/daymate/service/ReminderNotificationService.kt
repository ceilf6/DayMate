package com.example.daymate.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.daymate.MainActivity
import com.example.daymate.R
import com.example.daymate.data.Event
import com.example.daymate.utils.PermissionManager
import java.time.format.DateTimeFormatter

class ReminderNotificationService(private val context: Context) {
    
    companion object {
        private const val CHANNEL_ID = "calendar_reminders"
        private const val NOTIFICATION_ID_PREFIX = 1000
    }
    
    private val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    
    init {
        createNotificationChannel()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                context.getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = context.getString(R.string.notification_channel_description)
                enableVibration(true)
                enableLights(true)
            }

            notificationManager.createNotificationChannel(channel)
        }
    }
    
    fun showReminderNotification(event: Event, reminderMinutes: Int) {
        // 检查是否有通知权限
        if (!PermissionManager.hasNotificationPermission(context)) {
            return
        }
        
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("event_id", event.id)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            event.id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
        val dateFormatter = DateTimeFormatter.ofPattern("MM/dd")

        val timeText = if (event.allDay) {
            "${event.startTime.format(dateFormatter)} ${context.getString(R.string.notification_all_day)}"
        } else {
            "${event.startTime.format(dateFormatter)} ${event.startTime.format(timeFormatter)}"
        }

        val reminderText = when (reminderMinutes) {
            60 -> context.getString(R.string.notification_reminder_1hour)
            1440 -> context.getString(R.string.notification_reminder_tomorrow)
            else -> context.getString(R.string.notification_reminder_minutes, reminderMinutes)
        }
        
        try {
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(event.title)
                .setContentText("$timeText - $reminderText")
                .setStyle(NotificationCompat.BigTextStyle()
                    .bigText("${event.description ?: ""}\n\n${context.getString(R.string.notification_time_label)}：$timeText\n${if (!event.location.isNullOrEmpty()) "${context.getString(R.string.notification_location_label)}：${event.location}\n" else ""}${context.getString(R.string.notification_reminder_label)}：$reminderText"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()
            
            val notificationManagerCompat = NotificationManagerCompat.from(context)
            notificationManagerCompat.notify((NOTIFICATION_ID_PREFIX + event.id).toInt(), notification)
        } catch (e: SecurityException) {
            // 处理没有通知权限的情况
            e.printStackTrace()
        }
    }
    
    fun cancelReminderNotification(eventId: Long) {
        try {
            notificationManager.cancel((NOTIFICATION_ID_PREFIX + eventId).toInt())
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    fun cancelAllReminderNotifications() {
        try {
            notificationManager.cancelAll()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
