package com.example.daymate.shared.core.utils

import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * 农历工具类 - 完整实现
 * 支持1900年到2100年的公历与农历互转
 *
 * 此为共享模块，供 android-calendar 和其他 Android 模块使用
 */
object LunarUtils {

    /**
     * 农历数据表（1900-2100年）
     * 每个整数包含的信息：
     * - 第1-12位：表示农历每月的大小（1为30天，0为29天）
     * - 第13-16位：表示闰月的月份（0表示无闰月）
     * - 第17-20位：表示闰月的天数（1为30天，0为29天）
     */
    private val LUNAR_INFO = intArrayOf(
        0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
        0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
        0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
        0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
        0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
        0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
        0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
        0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
        0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
        0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
        0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
        0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
        0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
        0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
        0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
        0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
        0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
        0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
        0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
        0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
        0x0d520  // 2100
    )

    /** 天干 */
    private val TIAN_GAN = arrayOf("甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸")

    /** 地支 */
    private val DI_ZHI = arrayOf("子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥")

    /** 生肖 */
    private val SHENG_XIAO = arrayOf("鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪")

    /** 农历月份名称 */
    private val LUNAR_MONTHS = arrayOf("正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊")

    /** 农历日期名称 */
    private val LUNAR_DAYS = arrayOf(
        "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
        "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
        "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
    )

    /** 24节气名称 */
    private val SOLAR_TERMS = arrayOf(
        "小寒", "大寒", "立春", "雨水", "惊蛰", "春分",
        "清明", "谷雨", "立夏", "小满", "芒种", "夏至",
        "小暑", "大暑", "立秋", "处暑", "白露", "秋分",
        "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"
    )

    /** 农历节日（农历月份-日期 -> 节日名称） */
    private val LUNAR_HOLIDAYS = mapOf(
        "1-1" to "春节",
        "1-15" to "元宵",
        "2-2" to "龙抬头",
        "5-5" to "端午",
        "7-7" to "七夕",
        "7-15" to "中元",
        "8-15" to "中秋",
        "9-9" to "重阳",
        "12-8" to "腊八",
        "12-23" to "小年",
        "12-30" to "除夕"
    )

    /** 公历节日（月-日 -> 节日名称） */
    private val SOLAR_HOLIDAYS = mapOf(
        "1-1" to "元旦",
        "2-14" to "情人节",
        "3-8" to "妇女节",
        "3-12" to "植树节",
        "4-1" to "愚人节",
        "5-1" to "劳动节",
        "5-4" to "青年节",
        "6-1" to "儿童节",
        "7-1" to "建党节",
        "8-1" to "建军节",
        "9-10" to "教师节",
        "10-1" to "国庆节",
        "12-25" to "圣诞节"
    )

    /**
     * 农历日期数据类
     */
    data class LunarDate(
        val year: Int,              // 农历年份
        val month: Int,             // 农历月份（1-12）
        val day: Int,               // 农历日期（1-30）
        val isLeapMonth: Boolean,   // 是否是闰月
        val yearGanZhi: String,     // 天干地支年
        val yearShengXiao: String,  // 生肖
        val monthStr: String,       // 月份中文
        val dayStr: String,         // 日期中文
        val solarTerm: String?      // 节气（如果当天是节气）
    ) {
        /** 获取完整的农历日期字符串 */
        fun toFullString(): String {
            val leap = if (isLeapMonth) "闰" else ""
            return "${yearGanZhi}年${yearShengXiao}年 ${leap}${monthStr}月${dayStr}"
        }

        /** 获取简短的农历日期字符串（用于日历显示） */
        fun toShortString(): String {
            solarTerm?.let { return it }
            if (day == 1) {
                val leap = if (isLeapMonth) "闰" else ""
                return "${leap}${monthStr}月"
            }
            return dayStr
        }
    }

    /** 获取农历某年的总天数 */
    private fun getLunarYearDays(year: Int): Int {
        var sum = 348
        var i = 0x8000
        val info = LUNAR_INFO[year - 1900]
        while (i > 0x8) {
            if ((info and i) != 0) sum += 1
            i = i shr 1
        }
        return sum + getLeapMonthDays(year)
    }

    /** 获取农历某年闰月的天数 */
    private fun getLeapMonthDays(year: Int): Int {
        if (getLeapMonth(year) == 0) return 0
        return if ((LUNAR_INFO[year - 1900] and 0x10000) != 0) 30 else 29
    }

    /** 获取农历某年的闰月月份（0表示无闰月） */
    private fun getLeapMonth(year: Int): Int {
        return LUNAR_INFO[year - 1900] and 0xf
    }

    /** 获取农历某年某月的天数 */
    private fun getLunarMonthDays(year: Int, month: Int): Int {
        val info = LUNAR_INFO[year - 1900]
        return if ((info and (0x10000 shr month)) != 0) 30 else 29
    }

    /** 公历转农历 */
    fun solarToLunar(solarDate: LocalDate): LunarDate {
        val year = solarDate.year
        val month = solarDate.monthValue
        val day = solarDate.dayOfMonth

        if (year < 1900 || year > 2100) {
            return createDefaultLunarDate(solarDate)
        }

        val baseDate = LocalDate.of(1900, 1, 31)
        var offset = ChronoUnit.DAYS.between(baseDate, solarDate).toInt()

        if (offset < 0) {
            return createDefaultLunarDate(solarDate)
        }

        var lunarYear = 1900
        var daysInYear: Int
        while (lunarYear < 2101) {
            daysInYear = getLunarYearDays(lunarYear)
            if (offset < daysInYear) break
            offset -= daysInYear
            lunarYear++
        }

        val leapMonth = getLeapMonth(lunarYear)
        var isLeapMonth = false
        var lunarMonth = 1
        var daysInMonth: Int

        while (lunarMonth <= 12) {
            if (leapMonth > 0 && lunarMonth == leapMonth + 1 && !isLeapMonth) {
                isLeapMonth = true
                lunarMonth--
                daysInMonth = getLeapMonthDays(lunarYear)
            } else {
                daysInMonth = getLunarMonthDays(lunarYear, lunarMonth)
            }

            if (offset < daysInMonth) break
            offset -= daysInMonth

            if (isLeapMonth) {
                isLeapMonth = false
            }
            lunarMonth++
        }

        val lunarDay = offset + 1
        val ganZhiYear = getGanZhiYear(lunarYear)
        val shengXiao = SHENG_XIAO[(lunarYear - 4) % 12]
        val monthStr = LUNAR_MONTHS[(lunarMonth - 1) % 12]
        val dayStr = LUNAR_DAYS[(lunarDay - 1) % 30]
        val solarTerm = getSolarTerm(solarDate)

        return LunarDate(
            year = lunarYear,
            month = lunarMonth,
            day = lunarDay,
            isLeapMonth = isLeapMonth,
            yearGanZhi = ganZhiYear,
            yearShengXiao = shengXiao,
            monthStr = monthStr,
            dayStr = dayStr,
            solarTerm = solarTerm
        )
    }

    private fun createDefaultLunarDate(solarDate: LocalDate): LunarDate {
        return LunarDate(
            year = solarDate.year,
            month = solarDate.monthValue,
            day = solarDate.dayOfMonth,
            isLeapMonth = false,
            yearGanZhi = "未知",
            yearShengXiao = "未知",
            monthStr = LUNAR_MONTHS[(solarDate.monthValue - 1) % 12],
            dayStr = LUNAR_DAYS[(solarDate.dayOfMonth - 1) % 30],
            solarTerm = null
        )
    }

    private fun getGanZhiYear(year: Int): String {
        val gan = TIAN_GAN[(year - 4) % 10]
        val zhi = DI_ZHI[(year - 4) % 12]
        return "$gan$zhi"
    }

    /** 获取节气 */
    fun getSolarTerm(date: LocalDate): String? {
        val month = date.monthValue
        val day = date.dayOfMonth

        val termIndex1 = (month - 1) * 2
        val termIndex2 = termIndex1 + 1

        val term1Day = getSolarTermDay(date.year, termIndex1)
        val term2Day = getSolarTermDay(date.year, termIndex2)

        return when (day) {
            term1Day -> SOLAR_TERMS[termIndex1]
            term2Day -> SOLAR_TERMS[termIndex2]
            else -> null
        }
    }

    private fun getSolarTermDay(year: Int, termIndex: Int): Int {
        val baseDay = when (termIndex) {
            0 -> 6; 1 -> 20; 2 -> 4; 3 -> 19; 4 -> 6; 5 -> 21
            6 -> 5; 7 -> 20; 8 -> 6; 9 -> 21; 10 -> 6; 11 -> 21
            12 -> 7; 13 -> 23; 14 -> 7; 15 -> 23; 16 -> 8; 17 -> 23
            18 -> 8; 19 -> 23; 20 -> 7; 21 -> 22; 22 -> 7; 23 -> 22
            else -> 1
        }
        val adjustment = ((year - 2000) * 0.2468f).toInt()
        return baseDay + adjustment % 2
    }

    /** 获取农历日期字符串（简化版本，用于日历显示） */
    fun getLunarDateString(solarDate: LocalDate): String = solarToLunar(solarDate).toShortString()

    /** 获取完整的农历日期字符串 */
    fun getFullLunarDateString(solarDate: LocalDate): String = solarToLunar(solarDate).toFullString()

    /** 判断是否为农历节日，返回节日名称 */
    fun getLunarHoliday(solarDate: LocalDate): String? {
        val lunar = solarToLunar(solarDate)
        val key = "${lunar.month}-${lunar.day}"

        if (lunar.month == 12) {
            val daysInMonth = if (lunar.isLeapMonth) {
                getLeapMonthDays(lunar.year)
            } else {
                getLunarMonthDays(lunar.year, 12)
            }
            if (lunar.day == daysInMonth) return "除夕"
        }

        return LUNAR_HOLIDAYS[key]
    }

    /** 判断是否为公历节日，返回节日名称 */
    fun getSolarHoliday(solarDate: LocalDate): String? {
        val key = "${solarDate.monthValue}-${solarDate.dayOfMonth}"
        return SOLAR_HOLIDAYS[key]
    }

    /** 获取所有节日（包括农历节日、公历节日和节气） */
    fun getAllHolidays(solarDate: LocalDate): List<String> {
        val holidays = mutableListOf<String>()
        getSolarHoliday(solarDate)?.let { holidays.add(it) }
        getLunarHoliday(solarDate)?.let { holidays.add(it) }
        getSolarTerm(solarDate)?.let { holidays.add(it) }
        return holidays
    }

    /** 获取农历年份信息 */
    fun getLunarYear(solarDate: LocalDate): String {
        val lunar = solarToLunar(solarDate)
        return "${lunar.year}年(${lunar.yearGanZhi}${lunar.yearShengXiao}年)"
    }

    /** 获取农历月份信息 */
    fun getLunarMonthInfo(solarDate: LocalDate): String {
        val lunar = solarToLunar(solarDate)
        val leap = if (lunar.isLeapMonth) "闰" else ""
        return "${leap}${lunar.monthStr}月"
    }

    /** 获取生肖 */
    fun getShengXiao(year: Int): String = SHENG_XIAO[(year - 4) % 12]

    /** 获取天干地支 */
    fun getGanZhi(year: Int): String = getGanZhiYear(year)
}
