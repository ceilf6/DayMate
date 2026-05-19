package com.example.daymate.ui.calendar

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Rect
import android.util.AttributeSet
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.View
import androidx.core.content.ContextCompat
import com.example.daymate.R
import com.example.daymate.data.Event
import com.example.daymate.shared.core.utils.LunarUtils
import com.example.daymate.utils.PriorityColorUtils
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class MonthView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    private var yearMonth: YearMonth = YearMonth.now()
    private var selectedDate: LocalDate? = null
    private var events: List<Event> = emptyList()
    
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val cellRect = Rect()
    private val gestureDetector = GestureDetector(context, MonthViewGestureListener())
    
    private val dayTextSize = 42f
    private val lunarTextSize = 22f
    private val eventTextSize = 32f
    private val padding = 16f
    
    private var cellWidth = 0f
    private var cellHeight = 0f
    
    var onDateSelected: ((LocalDate) -> Unit)? = null
    var onEventClicked: ((Event) -> Unit)? = null
    var onMonthChanged: ((YearMonth) -> Unit)? = null
    var onDateDoubleClicked: ((LocalDate) -> Unit)? = null
    
    init {
        paint.textAlign = Paint.Align.CENTER
        // 确保View可以接收触摸事件
        isClickable = true
        isFocusable = true
    }
    
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        cellWidth = (width - 2 * padding) / 7
        cellHeight = (height - 2 * padding) / 6
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        drawWeekHeaders(canvas)
        drawCalendarGrid(canvas)
        drawEvents(canvas)
    }
    
    private fun drawWeekHeaders(canvas: Canvas) {
        paint.textSize = dayTextSize
        paint.color = ContextCompat.getColor(context, R.color.primary_text)
        
        val weekDays = arrayOf("日", "一", "二", "三", "四", "五", "六")
        
        for (i in weekDays.indices) {
            val x = padding + i * cellWidth + cellWidth / 2
            val y = padding + cellHeight / 2 + paint.textSize / 3
            
            canvas.drawText(weekDays[i], x, y, paint)
        }
    }
    
    private fun drawCalendarGrid(canvas: Canvas) {
        val firstDayOfMonth = yearMonth.atDay(1)
        val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value % 7 // 转换为周日至周六
        val daysInMonth = yearMonth.lengthOfMonth()
        
        paint.textSize = dayTextSize
        
        var day = 1
        var row = 1
        
        // 绘制上个月的日期（灰色）
        val prevMonth = yearMonth.minusMonths(1)
        val daysInPrevMonth = prevMonth.lengthOfMonth()
        var prevDay = daysInPrevMonth - firstDayOfWeek + 1
        
        paint.color = ContextCompat.getColor(context, R.color.secondary_text)
        for (col in 0 until firstDayOfWeek) {
            val date = prevMonth.atDay(prevDay)
            drawDayCell(canvas, row, col, prevDay, date, false)
            prevDay++
        }
        
        // 绘制当月日期
        paint.color = ContextCompat.getColor(context, R.color.primary_text)
        for (dayOfMonth in 1..daysInMonth) {
            val col = (firstDayOfWeek + dayOfMonth - 1) % 7
            val currentRow = (firstDayOfWeek + dayOfMonth - 1) / 7 + 1
            
            val date = yearMonth.atDay(dayOfMonth)
            val isSelected = selectedDate == date
            val isToday = date == LocalDate.now()
            
            drawDayCell(canvas, currentRow, col, dayOfMonth, date, isSelected, isToday)
        }
        
        // 绘制下个月的日期（灰色）
        paint.color = ContextCompat.getColor(context, R.color.secondary_text)
        var nextDay = 1
        val nextMonth = yearMonth.plusMonths(1)
        val totalCells = 42 // 6行 x 7列
        val usedCells = firstDayOfWeek + daysInMonth
        
        for (cell in usedCells until totalCells) {
            val row = cell / 7 + 1
            val col = cell % 7
            val date = nextMonth.atDay(nextDay)
            drawDayCell(canvas, row, col, nextDay, date, false)
            nextDay++
        }
    }
    
    private fun drawDayCell(
        canvas: Canvas,
        row: Int,
        col: Int,
        day: Int,
        date: LocalDate,
        isSelected: Boolean = false,
        isToday: Boolean = false
    ) {
        val x = padding + col * cellWidth
        val y = padding + row * cellHeight
        
        cellRect.set(
            x.toInt(),
            y.toInt(),
            (x + cellWidth).toInt(),
            (y + cellHeight).toInt()
        )
        
        // 获取农历信息
        val lunarDate = LunarUtils.solarToLunar(date)
        val lunarHoliday = LunarUtils.getLunarHoliday(date)
        val solarHoliday = LunarUtils.getSolarHoliday(date)
        val isHoliday = lunarHoliday != null || solarHoliday != null || lunarDate.solarTerm != null
        
        // 绘制选中背景
        if (isSelected) {
            paint.color = ContextCompat.getColor(context, R.color.primary)
            canvas.drawCircle(
                cellRect.centerX().toFloat(),
                cellRect.centerY().toFloat() - 8f,
                cellWidth / 3,
                paint
            )
        }
        
        // 绘制今日背景
        if (isToday && !isSelected) {
            paint.color = ContextCompat.getColor(context, R.color.accent)
            canvas.drawCircle(
                cellRect.centerX().toFloat(),
                cellRect.centerY().toFloat() - 8f,
                cellWidth / 4,
                paint
            )
        }
        
        // 绘制日期文字
        paint.textSize = dayTextSize
        paint.color = if (isSelected || isToday) {
            ContextCompat.getColor(context, android.R.color.white)
        } else {
            ContextCompat.getColor(context, R.color.primary_text)
        }
        
        canvas.drawText(
            day.toString(),
            cellRect.centerX().toFloat(),
            cellRect.centerY().toFloat() - 8f + paint.textSize / 3,
            paint
        )
        
        // 绘制农历日期
        paint.textSize = lunarTextSize
        
        // 确定农历显示文字和颜色
        val lunarText: String = when {
            solarHoliday != null -> solarHoliday
            lunarHoliday != null -> lunarHoliday
            lunarDate.solarTerm != null -> lunarDate.solarTerm!!
            lunarDate.day == 1 -> {
                val leap = if (lunarDate.isLeapMonth) "闰" else ""
                "${leap}${lunarDate.monthStr}月"
            }
            else -> lunarDate.dayStr
        }
        
        // 设置农历文字颜色
        paint.color = when {
            isSelected || isToday -> ContextCompat.getColor(context, android.R.color.white)
            solarHoliday != null -> ContextCompat.getColor(context, R.color.priority_high)
            lunarHoliday != null -> ContextCompat.getColor(context, R.color.priority_high)
            lunarDate.solarTerm != null -> ContextCompat.getColor(context, R.color.accent)
            lunarDate.day == 1 -> ContextCompat.getColor(context, R.color.primary)
            else -> ContextCompat.getColor(context, R.color.secondary_text)
        }
        
        // 绘制农历文字
        canvas.drawText(
            lunarText,
            cellRect.centerX().toFloat(),
            cellRect.centerY().toFloat() + dayTextSize / 2 + 8f,
            paint
        )
    }
    
    private fun drawEvents(canvas: Canvas) {
        if (events.isEmpty()) return
        
        paint.textSize = eventTextSize
        
        val firstDayOfMonth = yearMonth.atDay(1)
        val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value % 7
        
        // 使用HashMap来聚合同一天的事件，避免多次groupBy
        val eventsByDate = hashMapOf<LocalDate, MutableList<Event>>()
        for (event in events) {
            val date = event.startTime.toLocalDate()
            if (YearMonth.from(date) == yearMonth) {
                eventsByDate.getOrPut(date) { mutableListOf() }.add(event)
            }
        }
        
        eventsByDate.forEach { (date, dayEvents) ->
            val dayOfMonth = date.dayOfMonth
            val col = (firstDayOfWeek + dayOfMonth - 1) % 7
            val row = (firstDayOfWeek + dayOfMonth - 1) / 7 + 1
            
            val x = padding + col * cellWidth
            val y = padding + row * cellHeight
            
            // 按优先级排序事件，高优先级在前
            val sortedEvents = dayEvents.sortedBy { 
                when {
                    it.priority == 0 -> 10  // 无优先级排在最后
                    else -> it.priority     // 优先级1最高，排在最前
                }
            }
                
                // 绘制最多3个事件指示器
                val maxIndicators = minOf(3, sortedEvents.size)
                for (i in 0 until maxIndicators) {
                    val event = sortedEvents[i]
                    val (backgroundColor, borderColor, _) = PriorityColorUtils.getPriorityColors(context, event.priority)

                    val indicatorX = x + cellWidth - 25f - (i * 15f)
                    val indicatorY = y + 15f + (i * 8f)

                    // NONE优先级(0)只绘制简单的灰色圆点，不绘制彩色边框
                    if (event.priority > 0) {
                        // 绘制事件指示器背景
                        paint.color = backgroundColor
                        paint.style = Paint.Style.FILL
                        canvas.drawCircle(indicatorX, indicatorY, 8f, paint)

                        // 绘制边框
                        paint.color = borderColor
                        paint.style = Paint.Style.STROKE
                        paint.strokeWidth = if (event.priority in 1..3) 2f else 1f
                        canvas.drawCircle(indicatorX, indicatorY, 8f, paint)
                        paint.style = Paint.Style.FILL

                        // 高优先级添加内部标记
                        if (event.priority in 1..3) {
                            paint.color = ContextCompat.getColor(context, android.R.color.white)
                            canvas.drawCircle(indicatorX, indicatorY, 3f, paint)
                        }
                    } else {
                        // 无优先级：简单灰色圆点
                        paint.color = ContextCompat.getColor(context, R.color.secondary_text)
                        paint.style = Paint.Style.FILL
                        canvas.drawCircle(indicatorX, indicatorY, 4f, paint)
                    }
                }
                
                // 如果有超过3个事件，显示总数
                if (dayEvents.size > 3) {
                    val totalX = x + cellWidth - 15f
                    val totalY = y + cellHeight - 15f
                    
                    // 绘制数字背景
                    paint.color = ContextCompat.getColor(context, R.color.primary)
                    canvas.drawCircle(totalX, totalY, 12f, paint)
                    
                    // 绘制总数
                    paint.color = ContextCompat.getColor(context, android.R.color.white)
                    paint.textSize = 20f
                    canvas.drawText(
                        dayEvents.size.toString(),
                        totalX,
                        totalY + paint.textSize / 3,
                        paint
                    )
                }
                
                // 在日期下方显示高优先级事件的简短标题
                val highPriorityEvents = sortedEvents.filter { it.priority in 1..3 }
                if (highPriorityEvents.isNotEmpty()) {
                    paint.textSize = 20f
                    paint.color = ContextCompat.getColor(context, R.color.priority_high)
                    val title = if (highPriorityEvents[0].title.length > 8) {
                        highPriorityEvents[0].title.substring(0, 8) + "..."
                    } else {
                        highPriorityEvents[0].title
                    }
                    
                    canvas.drawText(
                        title,
                        x + cellWidth / 2,
                        y + cellHeight - 8f,
                        paint
                    )
                }
            }
        }
    
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val handled = gestureDetector.onTouchEvent(event)
        return handled || super.onTouchEvent(event)
    }
    
    private inner class MonthViewGestureListener : GestureDetector.SimpleOnGestureListener() {
        override fun onSingleTapUp(e: MotionEvent): Boolean {
            val col = ((e.x - padding) / cellWidth).toInt()
            val row = ((e.y - padding) / cellHeight).toInt()
            
            // 第0行是星期头，第1-6行是日期
            if (col in 0..6 && row in 1..6) {
                handleCellClick(col, row - 1) // 减1因为我们的处理函数期望从0开始的行
                return true
            }
            return false
        }
        
        override fun onDoubleTap(e: MotionEvent): Boolean {
            val col = ((e.x - padding) / cellWidth).toInt()
            val row = ((e.y - padding) / cellHeight).toInt()
            
            // 第0行是星期头，第1-6行是日期
            if (col in 0..6 && row in 1..6) {
                handleCellDoubleClick(col, row - 1) // 减1因为我们的处理函数期望从0开始的行
                return true
            }
            return false
        }
    }
    
    private fun handleCellClick(col: Int, row: Int) {
        val firstDayOfMonth = yearMonth.atDay(1)
        val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value % 7
        val daysInMonth = yearMonth.lengthOfMonth()
        
        val cellIndex = row * 7 + col
        
        when {
            cellIndex < firstDayOfWeek -> {
                // 上个月的日期
                val prevMonth = yearMonth.minusMonths(1)
                val daysInPrevMonth = prevMonth.lengthOfMonth()
                val day = daysInPrevMonth - firstDayOfWeek + 1 + cellIndex
                val date = prevMonth.atDay(day)
                selectedDate = date
                onDateSelected?.invoke(date)
                yearMonth = prevMonth
                invalidate()
            }
            cellIndex < firstDayOfWeek + daysInMonth -> {
                // 当月的日期
                val day = cellIndex - firstDayOfWeek + 1
                val date = yearMonth.atDay(day)
                selectedDate = date
                onDateSelected?.invoke(date)
                invalidate()
            }
            else -> {
                // 下个月的日期
                val nextMonth = yearMonth.plusMonths(1)
                val day = cellIndex - firstDayOfWeek - daysInMonth + 1
                val date = nextMonth.atDay(day)
                selectedDate = date
                onDateSelected?.invoke(date)
                yearMonth = nextMonth
                invalidate()
            }
        }
    }
    
    private fun handleCellDoubleClick(col: Int, row: Int) {
        val firstDayOfMonth = yearMonth.atDay(1)
        val firstDayOfWeek = firstDayOfMonth.dayOfWeek.value % 7
        val daysInMonth = yearMonth.lengthOfMonth()
        
        val cellIndex = row * 7 + col
        
        when {
            cellIndex < firstDayOfWeek -> {
                // 上个月的日期
                val prevMonth = yearMonth.minusMonths(1)
                val daysInPrevMonth = prevMonth.lengthOfMonth()
                val day = daysInPrevMonth - firstDayOfWeek + 1 + cellIndex
                val date = prevMonth.atDay(day)
                onDateDoubleClicked?.invoke(date)
            }
            cellIndex < firstDayOfWeek + daysInMonth -> {
                // 当月的日期
                val day = cellIndex - firstDayOfWeek + 1
                val date = yearMonth.atDay(day)
                onDateDoubleClicked?.invoke(date)
            }
            else -> {
                // 下个月的日期
                val nextMonth = yearMonth.plusMonths(1)
                val day = cellIndex - firstDayOfWeek - daysInMonth + 1
                val date = nextMonth.atDay(day)
                onDateDoubleClicked?.invoke(date)
            }
        }
    }
    
    fun setYearMonth(yearMonth: YearMonth) {
        this.yearMonth = yearMonth
        invalidate()
    }
    
    fun setYearMonthProgrammatically(yearMonth: YearMonth) {
        this.yearMonth = yearMonth
        invalidate()
    }
    
    fun setSelectedDate(date: LocalDate?) {
        this.selectedDate = date
        invalidate()
    }
    
    fun setEvents(events: List<Event>) {
        this.events = events
        invalidate()
    }
    
    fun getCurrentYearMonth(): YearMonth = yearMonth
    
    fun previousMonth() {
        yearMonth = yearMonth.minusMonths(1)
        onMonthChanged?.invoke(yearMonth)
        invalidate()
    }
    
    fun nextMonth() {
        yearMonth = yearMonth.plusMonths(1)
        onMonthChanged?.invoke(yearMonth)
        invalidate()
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        // 清理回调，防止内存泄漏
        onDateSelected = null
        onEventClicked = null
        onMonthChanged = null
        onDateDoubleClicked = null
    }
}
