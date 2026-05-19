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
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class WeekView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {
    
    private var weekStartDate: LocalDate = LocalDate.now().minusDays(LocalDate.now().dayOfWeek.value.toLong() - 1)
    private var selectedDate: LocalDate? = null
    private var events: List<Event> = emptyList()
    
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val cellRect = Rect()
    private val gestureDetector = GestureDetector(context, WeekViewGestureListener())
    
    private val dayTextSize = 42f
    private val lunarTextSize = 20f
    private val eventTextSize = 32f
    private val padding = 16f
    
    private var cellWidth = 0f
    private var cellHeight = 0f
    private var hourHeight = 0f
    private val hourCount = 24
    private val headerHeight = 140f
    
    // 缓存时间标签，避免频繁创建对象
    private val timeLabels = Array(24) { hour -> String.format("%02d:00", hour) }
    private val weekDays = arrayOf("周日", "周一", "周二", "周三", "周四", "周五", "周六")
    
    var onDateSelected: ((LocalDate) -> Unit)? = null
    var onEventClicked: ((Event) -> Unit)? = null
    var onTimeSlotClicked: ((LocalDateTime) -> Unit)? = null
    var onWeekChanged: ((LocalDate) -> Unit)? = null
    
    init {
        paint.textAlign = Paint.Align.CENTER
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        // 清理回调，防止内存泄漏
        onDateSelected = null
        onEventClicked = null
        onTimeSlotClicked = null
        onWeekChanged = null
    }
    
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        cellWidth = (width - padding) / 7
        cellHeight = height - headerHeight
        hourHeight = cellHeight / hourCount
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        drawWeekHeader(canvas)
        drawTimeGrid(canvas)
        drawEvents(canvas)
        drawTimeLabels(canvas)
    }
    
    private fun drawWeekHeader(canvas: Canvas) {
        paint.textSize = dayTextSize
        
        for (i in 0..6) {
            val date = weekStartDate.plusDays(i.toLong())
            val x = padding + i * cellWidth
            
            cellRect.set(
                x.toInt(),
                0,
                (x + cellWidth).toInt(),
                headerHeight.toInt()
            )
            
            // 绘制日期背景
            val isSelected = selectedDate == date
            val isToday = date == LocalDate.now()
            
            if (isSelected) {
                paint.color = ContextCompat.getColor(context, R.color.primary)
                canvas.drawRect(cellRect, paint)
            } else if (isToday) {
                paint.color = ContextCompat.getColor(context, R.color.accent)
                canvas.drawRect(cellRect, paint)
            }
            
            // 绘制日期文字 - 根据是否有背景色设置合适的文字颜色
            paint.color = if (isSelected || isToday) {
                ContextCompat.getColor(context, android.R.color.white)
            } else {
                ContextCompat.getColor(context, R.color.primary_text)
            }
            
            canvas.drawText(
                date.dayOfMonth.toString(),
                cellRect.centerX().toFloat(),
                cellRect.centerY().toFloat() - 30f,
                paint
            )
            
            // 绘制星期标签 - 根据日期的实际星期获取
            val dayOfWeekIndex = date.dayOfWeek.value % 7  // 转换为周日=0, 周一=1, ..., 周六=6
            paint.textSize = 28f
            canvas.drawText(
                weekDays[dayOfWeekIndex],
                cellRect.centerX().toFloat(),
                cellRect.centerY().toFloat() + 5f,
                paint
            )
            
            // 绘制农历日期
            val lunarDate = LunarUtils.solarToLunar(date)
            val lunarHoliday = LunarUtils.getLunarHoliday(date)
            val solarHoliday = LunarUtils.getSolarHoliday(date)
            
            // 确定农历显示文字
            val lunarText: String = when {
                solarHoliday != null -> solarHoliday
                lunarHoliday != null -> lunarHoliday
                lunarDate.solarTerm != null -> lunarDate.solarTerm!!
                else -> lunarDate.dayStr
            }
            
            // 设置农历文字颜色
            paint.textSize = lunarTextSize
            paint.color = when {
                isSelected || isToday -> ContextCompat.getColor(context, android.R.color.white)
                solarHoliday != null || lunarHoliday != null -> ContextCompat.getColor(context, R.color.priority_high)
                lunarDate.solarTerm != null -> ContextCompat.getColor(context, R.color.accent)
                else -> ContextCompat.getColor(context, R.color.secondary_text)
            }
            
            canvas.drawText(
                lunarText,
                cellRect.centerX().toFloat(),
                cellRect.centerY().toFloat() + 35f,
                paint
            )
            
            paint.textSize = dayTextSize
        }
    }
    
    private fun drawTimeGrid(canvas: Canvas) {
        paint.color = ContextCompat.getColor(context, R.color.divider)
        paint.strokeWidth = 1f
        
        // 绘制垂直线
        for (i in 0..7) {
            val x = padding + i * cellWidth
            canvas.drawLine(
                x,
                headerHeight,
                x,
                height.toFloat(),
                paint
            )
        }
        
        // 绘制水平线
        for (i in 0..hourCount) {
            val y = headerHeight + i * hourHeight
            canvas.drawLine(
                padding,
                y,
                width.toFloat(),
                y,
                paint
            )
        }
    }
    
    private fun drawTimeLabels(canvas: Canvas) {
        paint.textSize = 24f
        paint.color = ContextCompat.getColor(context, R.color.secondary_text)
        paint.textAlign = Paint.Align.RIGHT
        
        for (hour in 0 until hourCount) {
            val y = headerHeight + hour * hourHeight + hourHeight / 2
            
            canvas.drawText(
                timeLabels[hour],
                padding - 10f,
                y + paint.textSize / 3,
                paint
            )
        }
        
        paint.textAlign = Paint.Align.CENTER
    }
    
    private fun drawEvents(canvas: Canvas) {
        if (events.isEmpty()) return
        
        // 直接遍历事件，避免groupBy创建额外的Map对象
        for (event in events) {
            val date = event.startTime.toLocalDate()
            val dayOffset = ChronoUnit.DAYS.between(weekStartDate, date).toInt()
            if (dayOffset in 0..6) {
                val x = padding + dayOffset * cellWidth
                drawEvent(canvas, event, x)
            }
        }
    }
    
    private fun drawEvent(canvas: Canvas, event: Event, x: Float) {
        val startHour = event.startTime.hour + event.startTime.minute / 60.0
        val endHour = event.endTime.hour + event.endTime.minute / 60.0
        
        val eventY = headerHeight + startHour * hourHeight
        val eventHeight = (endHour - startHour) * hourHeight
        
        cellRect.set(
            (x + 2).toInt(),
            eventY.toInt(),
            (x + cellWidth - 2).toInt(),
            (eventY + eventHeight).toInt()
        )
        
        // 根据优先级获取颜色
        val (backgroundColor, borderColor, isDarkTheme) = PriorityColorUtils.getPriorityColors(context, event.priority)

        // NONE优先级(0)不绘制背景、边框、条纹和阴影
        if (event.priority > 0) {
            // 绘制事件背景
            paint.color = backgroundColor
            paint.style = Paint.Style.FILL
            canvas.drawRect(cellRect, paint)

            // 绘制优先级条纹 (左侧彩色条)
            val stripeWidth = 6f
            paint.color = borderColor
            canvas.drawRect(
                cellRect.left.toFloat(),
                cellRect.top.toFloat(),
                cellRect.left + stripeWidth,
                cellRect.bottom.toFloat(),
                paint
            )

            // 绘制事件边框
            paint.color = borderColor
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = if (event.priority in 1..3) 3f else 2f
            canvas.drawRect(cellRect, paint)
            paint.style = Paint.Style.FILL

            // 添加阴影效果 (高优先级)
            if (event.priority in 1..3) {
                paint.color = ContextCompat.getColor(context, android.R.color.black)
                paint.alpha = 30
                canvas.drawRect(
                    cellRect.left + 3f,
                    cellRect.top + 3f,
                    cellRect.right + 3f,
                    cellRect.bottom + 3f,
                    paint
                )
                paint.alpha = 255
            }
        }
        
        // 绘制事件文字
        paint.color = if (isDarkTheme) {
            ContextCompat.getColor(context, android.R.color.white)
        } else {
            ContextCompat.getColor(context, R.color.primary_text)
        }
        
        // 绘制优先级指示器
        if (event.priority > 0 && eventHeight > 40f) {
            val priorityText = PriorityColorUtils.getPriorityIndicator(event.priority)
            
            if (priorityText.isNotEmpty()) {
                paint.textSize = 24f
                paint.color = borderColor
                canvas.drawText(
                    priorityText,
                    cellRect.right - 20f,
                    cellRect.top + 20f,
                    paint
                )
            }
        }
        
        // 绘制标题
        paint.textSize = if (event.priority in 1..3) eventTextSize + 2f else eventTextSize
        paint.color = if (isDarkTheme) {
            ContextCompat.getColor(context, android.R.color.white)
        } else {
            ContextCompat.getColor(context, R.color.primary_text)
        }
        
        val title = if (event.title.length > 15) {
            event.title.substring(0, 15) + "..."
        } else {
            event.title
        }

        canvas.drawText(
            title,
            cellRect.centerX().toFloat(),
            cellRect.centerY().toFloat(),
            paint
        )
    }
    
    override fun onTouchEvent(event: MotionEvent): Boolean {
        return gestureDetector.onTouchEvent(event)
    }
    
    private inner class WeekViewGestureListener : GestureDetector.SimpleOnGestureListener() {
        override fun onSingleTapUp(e: MotionEvent): Boolean {
            val col = ((e.x - padding) / cellWidth).toInt()
            
            if (col in 0..6) {
                val date = weekStartDate.plusDays(col.toLong())
                selectedDate = date
                onDateSelected?.invoke(date)
                invalidate()
                
                // 如果点击在时间区域，触发时间槽点击事件
                if (e.y > headerHeight) {
                    val hour = ((e.y - headerHeight) / hourHeight).toInt()
                    val dateTime = date.atTime(hour, 0)
                    onTimeSlotClicked?.invoke(dateTime)
                }
                return true
            }
            return false
        }
    }
    
    fun setWeekStartDate(date: LocalDate) {
        weekStartDate = date.minusDays(date.dayOfWeek.value.toLong() - 1)
        invalidate()
    }
    
    fun setWeekStartDateProgrammatically(date: LocalDate) {
        weekStartDate = date.minusDays(date.dayOfWeek.value.toLong() - 1)
        invalidate()
    }
    
    fun setSelectedDate(date: LocalDate?) {
        selectedDate = date
        invalidate()
    }
    
    fun setEvents(events: List<Event>) {
        this.events = events
        invalidate()
    }
    
    fun getCurrentWeekStartDate(): LocalDate = weekStartDate
    
    fun previousWeek() {
        weekStartDate = weekStartDate.minusWeeks(1)
        onWeekChanged?.invoke(weekStartDate)
        invalidate()
    }
    
    fun nextWeek() {
        weekStartDate = weekStartDate.plusWeeks(1)
        onWeekChanged?.invoke(weekStartDate)
        invalidate()
    }
}
