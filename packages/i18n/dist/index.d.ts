import i18next from 'i18next';
export type Language = 'zh-CN' | 'zh-TW' | 'en';
export declare const resources: {
    'zh-CN': {
        translation: {
            common: {
                appName: string;
                cancel: string;
                save: string;
                delete: string;
                close: string;
                confirm: string;
                back: string;
                ok: string;
            };
            calendar: {
                month: string;
                week: string;
                day: string;
                monthView: string;
                weekView: string;
                dayView: string;
                today: string;
                allDay: string;
                previousDay: string;
                nextDay: string;
                previousWeek: string;
                nextWeek: string;
                monthNames: string[];
                monthNamesShort: string[];
                dayNames: string[];
                dayNamesShort: string[];
            };
            event: {
                title: string;
                startTime: string;
                endTime: string;
                notes: string;
                reminder: string;
                priority: string;
                addEvent: string;
                eventDetail: string;
                eventsOnDate: string;
                noEvents: string;
                deleteEvent: string;
                deleteConfirm: string;
                time: string;
                location: string;
                incompleteEvents: string;
                noIncompleteEvents: string;
                completed: string;
                incomplete: string;
                markComplete: string;
                markIncomplete: string;
            };
            priority: {
                none: string;
                high: string;
                medium: string;
                low: string;
            };
            placeholder: {
                titleRequired: string;
                startTimeHint: string;
                endTimeHint: string;
                notesOptional: string;
                reminderHint: string;
                pasteICalendar: string;
            };
            validation: {
                noDateSelected: string;
                titleRequired: string;
                invalidTimeFormat: string;
                endTimeBeforeStart: string;
                invalidReminderMinutes: string;
                reminderNeedsStartTime: string;
            };
            success: {
                exportSuccess: string;
                copiedToClipboard: string;
                importSuccess: string;
                importedCount: string;
            };
            importExport: {
                title: string;
                export: string;
                import: string;
                share: string;
                copy: string;
                importFromClipboard: string;
                importButton: string;
            };
            reminder: {
                minutesBefore: string;
                none: string;
            };
            lunar: {
                leapMonth: string;
            };
            settings: {
                title: string;
                selectLanguage: string;
                language: string;
                themeColor: string;
                backgroundImage: string;
                selectImage: string;
                changeImage: string;
                clearBackground: string;
                clearBackgroundConfirm: string;
                backgroundOpacity: string;
                restoreDefault: string;
                cropImage: string;
            };
            error: {
                title: string;
                saveFailed: string;
                deleteFailed: string;
                reminderFailed: string;
                importFailed: string;
                noValidData: string;
                noClipboardData: string;
                enterICalendarData: string;
                selectImageFailed: string;
            };
            themes: {
                blue: string;
                green: string;
                purple: string;
                orange: string;
                pink: string;
                gray: string;
            };
            splash: {
                subtitle: string;
                date: string;
            };
        };
    };
    'zh-TW': {
        translation: {
            common: {
                appName: string;
                cancel: string;
                save: string;
                delete: string;
                close: string;
                confirm: string;
                back: string;
                ok: string;
            };
            calendar: {
                month: string;
                week: string;
                day: string;
                monthView: string;
                weekView: string;
                dayView: string;
                today: string;
                allDay: string;
                previousDay: string;
                nextDay: string;
                previousWeek: string;
                nextWeek: string;
                monthNames: string[];
                monthNamesShort: string[];
                dayNames: string[];
                dayNamesShort: string[];
            };
            event: {
                title: string;
                startTime: string;
                endTime: string;
                notes: string;
                reminder: string;
                priority: string;
                addEvent: string;
                eventDetail: string;
                eventsOnDate: string;
                noEvents: string;
                deleteEvent: string;
                deleteConfirm: string;
                time: string;
                location: string;
                incompleteEvents: string;
                noIncompleteEvents: string;
                completed: string;
                incomplete: string;
                markComplete: string;
                markIncomplete: string;
            };
            priority: {
                none: string;
                high: string;
                medium: string;
                low: string;
            };
            placeholder: {
                titleRequired: string;
                startTimeHint: string;
                endTimeHint: string;
                notesOptional: string;
                reminderHint: string;
                pasteICalendar: string;
            };
            validation: {
                noDateSelected: string;
                titleRequired: string;
                invalidTimeFormat: string;
                endTimeBeforeStart: string;
                invalidReminderMinutes: string;
                reminderNeedsStartTime: string;
            };
            success: {
                exportSuccess: string;
                copiedToClipboard: string;
                importSuccess: string;
                importedCount: string;
            };
            importExport: {
                title: string;
                export: string;
                import: string;
                share: string;
                copy: string;
                importFromClipboard: string;
                importButton: string;
            };
            reminder: {
                minutesBefore: string;
                none: string;
            };
            lunar: {
                leapMonth: string;
            };
            settings: {
                title: string;
                selectLanguage: string;
                language: string;
                themeColor: string;
                backgroundImage: string;
                selectImage: string;
                changeImage: string;
                clearBackground: string;
                clearBackgroundConfirm: string;
                backgroundOpacity: string;
                restoreDefault: string;
                cropImage: string;
            };
            error: {
                title: string;
                saveFailed: string;
                deleteFailed: string;
                reminderFailed: string;
                importFailed: string;
                noValidData: string;
                noClipboardData: string;
                enterICalendarData: string;
                selectImageFailed: string;
            };
            themes: {
                blue: string;
                green: string;
                purple: string;
                orange: string;
                pink: string;
                gray: string;
            };
            splash: {
                subtitle: string;
                date: string;
            };
        };
    };
    en: {
        translation: {
            common: {
                appName: string;
                cancel: string;
                save: string;
                delete: string;
                close: string;
                confirm: string;
                back: string;
                ok: string;
            };
            calendar: {
                month: string;
                week: string;
                day: string;
                monthView: string;
                weekView: string;
                dayView: string;
                today: string;
                allDay: string;
                previousDay: string;
                nextDay: string;
                previousWeek: string;
                nextWeek: string;
                monthNames: string[];
                monthNamesShort: string[];
                dayNames: string[];
                dayNamesShort: string[];
            };
            event: {
                title: string;
                startTime: string;
                endTime: string;
                notes: string;
                reminder: string;
                priority: string;
                addEvent: string;
                eventDetail: string;
                eventsOnDate: string;
                noEvents: string;
                deleteEvent: string;
                deleteConfirm: string;
                time: string;
                location: string;
                incompleteEvents: string;
                noIncompleteEvents: string;
                completed: string;
                incomplete: string;
                markComplete: string;
                markIncomplete: string;
            };
            priority: {
                none: string;
                high: string;
                medium: string;
                low: string;
            };
            placeholder: {
                titleRequired: string;
                startTimeHint: string;
                endTimeHint: string;
                notesOptional: string;
                reminderHint: string;
                pasteICalendar: string;
            };
            validation: {
                noDateSelected: string;
                titleRequired: string;
                invalidTimeFormat: string;
                endTimeBeforeStart: string;
                invalidReminderMinutes: string;
                reminderNeedsStartTime: string;
            };
            success: {
                exportSuccess: string;
                copiedToClipboard: string;
                importSuccess: string;
                importedCount: string;
            };
            importExport: {
                title: string;
                export: string;
                import: string;
                share: string;
                copy: string;
                importFromClipboard: string;
                importButton: string;
            };
            reminder: {
                minutesBefore: string;
                none: string;
            };
            lunar: {
                leapMonth: string;
            };
            settings: {
                title: string;
                selectLanguage: string;
                language: string;
                themeColor: string;
                backgroundImage: string;
                selectImage: string;
                changeImage: string;
                clearBackground: string;
                clearBackgroundConfirm: string;
                backgroundOpacity: string;
                restoreDefault: string;
                cropImage: string;
            };
            error: {
                title: string;
                saveFailed: string;
                deleteFailed: string;
                reminderFailed: string;
                importFailed: string;
                noValidData: string;
                noClipboardData: string;
                enterICalendarData: string;
                selectImageFailed: string;
            };
            themes: {
                blue: string;
                green: string;
                purple: string;
                orange: string;
                pink: string;
                gray: string;
            };
            splash: {
                subtitle: string;
                date: string;
            };
        };
    };
};
export declare const initI18n: (language?: Language) => import("i18next").i18n;
export declare const t: (key: string, defaultValueOrOptions?: string | any, options?: {
    returnObjects?: boolean;
}) => string | object;
export declare const changeLanguage: (language: Language) => Promise<import("i18next").TFunction<"translation", undefined>>;
export declare const getCurrentLanguage: () => Language;
export default i18next;
