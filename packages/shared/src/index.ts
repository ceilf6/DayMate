/**
 * @daymate/shared
 * 共享的日历工具库
 */

// Models
export * from './models/CalendarEvent';

// Utils - Lunar
export {
    solarToLunar,
    getLunarDateString,
    getLunarShortString,
    getFullLunarDateString,
    getLunarHoliday,
    getSolarHoliday,
    getSolarTerm,
    getAllHolidays,
    getLunarYear,
    getLunarMonthInfo,
    getShengXiao,
    getGanZhi,
    type LunarDate
} from './utils/LunarUtils';

// Utils - Date
export {
    formatDate,
    parseDate,
    getToday,
    isToday,
    isSameWeek,
    isSameMonth,
    getDatesForMonthView,
    getDatesForWeekView,
    daysBetween,
    addDays,
    addMonths,
    formatTime,
    parseTime,
    generateId
} from './utils/DateUtils';

// Utils - Priority
export {
    PRIORITY_RANGES,
    PRIORITY_COLORS,
    getPriorityLevel,
    getPriorityColors,
    getPriorityIndicator,
    getPriorityText,
    isHighPriority,
    comparePriority
} from './utils/PriorityUtils';

// Utils - ICalendar
export {
    exportToICalendar,
    importFromICalendar
} from './utils/ICalendarUtils';
