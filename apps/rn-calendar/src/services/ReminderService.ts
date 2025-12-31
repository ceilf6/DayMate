import { Platform } from 'react-native';
import notifee, {
    AndroidImportance,
    AuthorizationStatus,
    TimestampTrigger,
    TriggerType,
} from '@notifee/react-native';

import type { CalendarEvent } from '@daymate/shared';

const ANDROID_CHANNEL_ID = 'daymate-reminders';

const ensureAndroidChannel = async () => {
    if (Platform.OS !== 'android') return;

    await notifee.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: '日程提醒',
        importance: AndroidImportance.DEFAULT,
    });
};

export class ReminderService {
    static async ensurePermissions(): Promise<boolean> {
        await ensureAndroidChannel();

        const settings = await notifee.getNotificationSettings();
        if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
            return true;
        }

        const status = await notifee.requestPermission();
        return status.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }

    static async scheduleReminder(event: CalendarEvent): Promise<string | null> {
        const reminderMinutes = event.reminderMinutes;
        const startTime = event.startTime;
        if (!reminderMinutes || reminderMinutes <= 0) return null;
        if (!startTime) return null;

        const permitted = await ReminderService.ensurePermissions();
        if (!permitted) return null;

        const [hourStr, minuteStr] = startTime.split(':');
        const hour = Number(hourStr);
        const minute = Number(minuteStr);
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

        const [yearStr, monthStr, dayStr] = event.date.split('-');
        const year = Number(yearStr);
        const month = Number(monthStr);
        const day = Number(dayStr);
        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;

        const eventStart = new Date(year, month - 1, day, hour, minute, 0, 0);
        const triggerTime = new Date(eventStart.getTime() - reminderMinutes * 60 * 1000);
        if (triggerTime.getTime() <= Date.now()) return null;

        await ensureAndroidChannel();

        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: triggerTime.getTime(),
            alarmManager: {
                allowWhileIdle: true,
            },
        };

        const id = await notifee.createTriggerNotification(
            {
                title: '日程提醒',
                body: `${event.title} 将于 ${event.startTime} 开始`,
                android: {
                    channelId: ANDROID_CHANNEL_ID,
                    pressAction: { id: 'default' },
                },
            },
            trigger,
        );

        return id;
    }

    static async cancelReminder(notificationId: string): Promise<void> {
        if (!notificationId) return;

        try {
            await notifee.cancelTriggerNotification(notificationId);
        } catch {
            // ignore
        }

        try {
            await notifee.cancelNotification(notificationId);
        } catch {
            // ignore
        }
    }
}
