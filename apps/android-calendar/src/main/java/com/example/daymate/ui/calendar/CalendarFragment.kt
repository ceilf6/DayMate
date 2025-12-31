package com.example.daymate.ui.calendar

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import com.example.daymate.R
import com.example.daymate.data.CalendarDatabase
import com.example.daymate.databinding.FragmentCalendarBinding
import com.example.daymate.repository.EventRepository
import com.example.daymate.ui.dialog.DailyEventsDialogFragment
import com.example.daymate.ui.event.AddEditEventDialogFragment
import com.example.daymate.ui.event.EventDetailsDialogFragment
import com.example.daymate.ui.importexport.ImportExportDialogFragment
import com.example.daymate.shared.core.utils.LunarUtils
import com.example.daymate.viewmodel.CalendarViewModel
import com.example.daymate.viewmodel.CalendarViewModelFactory
import com.example.daymate.viewmodel.CalendarViewMode
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.YearMonth
import java.time.format.DateTimeFormatter

class CalendarFragment : Fragment() {
    
    private var _binding: FragmentCalendarBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: CalendarViewModel by viewModels {
        val database = CalendarDatabase.getDatabase(requireContext())
        val repository = EventRepository(database.eventDao())
        CalendarViewModelFactory(repository, requireContext())
    }
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy年MM月")
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCalendarBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews()
        observeViewModel()
    }
    
    private fun setupViews() {
        // 设置视图模式切换
        binding.btnMonthView.setOnClickListener {
            viewModel.setViewMode(CalendarViewMode.MONTH)
            updateViewMode(CalendarViewMode.MONTH)
        }
        
        binding.btnWeekView.setOnClickListener {
            viewModel.setViewMode(CalendarViewMode.WEEK)
            updateViewMode(CalendarViewMode.WEEK)
        }
        
        binding.btnDayView.setOnClickListener {
            viewModel.setViewMode(CalendarViewMode.DAY)
            updateViewMode(CalendarViewMode.DAY)
        }
        
        // 设置导航按钮
        binding.btnPrevious.setOnClickListener {
            when (viewModel.viewMode.value) {
                CalendarViewMode.MONTH -> {
                    binding.monthView.previousMonth()
                    // 日期显示会通过onMonthChanged回调自动更新
                }
                CalendarViewMode.WEEK -> {
                    binding.weekView.previousWeek()
                    // 日期显示会通过onWeekChanged回调自动更新
                }
                CalendarViewMode.DAY -> {
                    binding.dayView.previousDay()
                    // 日期显示会通过onDayChanged回调自动更新
                }
            }
        }
        
        binding.btnNext.setOnClickListener {
            when (viewModel.viewMode.value) {
                CalendarViewMode.MONTH -> {
                    binding.monthView.nextMonth()
                    // 日期显示会通过onMonthChanged回调自动更新
                }
                CalendarViewMode.WEEK -> {
                    binding.weekView.nextWeek()
                    // 日期显示会通过onWeekChanged回调自动更新
                }
                CalendarViewMode.DAY -> {
                    binding.dayView.nextDay()
                    // 日期显示会通过onDayChanged回调自动更新
                }
            }
        }
        
        // 设置日历视图回调
        setupCalendarCallbacks()
        
        // 添加事件按钮
        binding.fabAddEvent.setOnClickListener {
            showAddEventDialog()
        }
        
        // 导入导出按钮
        binding.btnImportExport.setOnClickListener {
            showImportExportDialog()
        }
        
        // 默认显示月视图
        updateViewMode(CalendarViewMode.MONTH)
    }
    
    private fun setupCalendarCallbacks() {
        // 月视图回调
        binding.monthView.onDateSelected = { date ->
            viewModel.setSelectedDate(date.atStartOfDay())
        }
        binding.monthView.onMonthChanged = { yearMonth ->
            updateDateDisplayForMonth(yearMonth)
        }
        binding.monthView.onDateDoubleClicked = { date ->
            showDailyEventsDialog(date)
        }
        
        // 周视图回调
        binding.weekView.onDateSelected = { date ->
            viewModel.setSelectedDate(date.atStartOfDay())
        }
        binding.weekView.onTimeSlotClicked = { dateTime ->
            viewModel.setSelectedDate(dateTime)
            showAddEventDialog(dateTime)
        }
        binding.weekView.onWeekChanged = { weekStartDate ->
            updateDateDisplayForWeek(weekStartDate)
        }
        
        // 日视图回调
        binding.dayView.onTimeSlotClicked = { dateTime ->
            viewModel.setSelectedDate(dateTime)
            showAddEventDialog(dateTime)
        }
        binding.dayView.onEventClicked = { event ->
            viewModel.selectEvent(event)
            showEventDetailsDialog(event)
        }
        binding.dayView.onDayChanged = { date ->
            updateDateDisplayForDay(date)
        }
    }
    
    private fun observeViewModel() {
        // 使用viewLifecycleOwner.lifecycleScope确保在Fragment销毁时自动取消
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.viewMode.collect { mode ->
                updateViewMode(mode)
            }
        }
        
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.selectedDate.collect { dateTime ->
                updateDateDisplay(dateTime)
            }
        }
        
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.events.collect { events ->
                updateEventsDisplay(events)
            }
        }
    }
    
    private fun updateViewMode(mode: CalendarViewMode) {
        // 隐藏所有视图
        binding.monthView.visibility = View.GONE
        binding.weekView.visibility = View.GONE
        binding.dayView.visibility = View.GONE
        
        // 显示对应视图并更新日期显示
        when (mode) {
            CalendarViewMode.MONTH -> {
                binding.monthView.visibility = View.VISIBLE
                binding.btnMonthView.isSelected = true
                binding.btnWeekView.isSelected = false
                binding.btnDayView.isSelected = false
                // 立即更新月视图的日期显示
                updateDateDisplayForMonth(binding.monthView.getCurrentYearMonth())
            }
            CalendarViewMode.WEEK -> {
                binding.weekView.visibility = View.VISIBLE
                binding.btnMonthView.isSelected = false
                binding.btnWeekView.isSelected = true
                binding.btnDayView.isSelected = false
                // 立即更新周视图的日期显示
                updateDateDisplayForWeek(binding.weekView.getCurrentWeekStartDate())
            }
            CalendarViewMode.DAY -> {
                binding.dayView.visibility = View.VISIBLE
                binding.btnMonthView.isSelected = false
                binding.btnWeekView.isSelected = false
                binding.btnDayView.isSelected = true
                // 立即更新日视图的日期显示
                updateDateDisplayForDay(binding.dayView.getCurrentDate())
            }
        }
    }
    
    private fun updateDateDisplay(dateTime: LocalDateTime) {
        val date = dateTime.toLocalDate()
        
        when (viewModel.viewMode.value) {
            CalendarViewMode.MONTH -> {
                val yearMonth = YearMonth.from(date)
                binding.monthView.setYearMonthProgrammatically(yearMonth)
                binding.monthView.setSelectedDate(date)
                binding.tvCurrentDate.text = yearMonth.format(dateFormatter)
                // 更新农历信息
                val lunarDate = LunarUtils.solarToLunar(date)
                binding.tvLunarDate.text = "${lunarDate.yearGanZhi}${lunarDate.yearShengXiao}年 ${LunarUtils.getLunarMonthInfo(date)}"
            }
            CalendarViewMode.WEEK -> {
                binding.weekView.setWeekStartDateProgrammatically(date)
                binding.weekView.setSelectedDate(date)
                val weekStart = binding.weekView.getCurrentWeekStartDate()
                val weekEnd = weekStart.plusDays(6)
                binding.tvCurrentDate.text = "${weekStart.monthValue}/${weekStart.dayOfMonth} - ${weekEnd.monthValue}/${weekEnd.dayOfMonth}"
                // 更新农历信息
                val lunarDate = LunarUtils.solarToLunar(date)
                binding.tvLunarDate.text = "${lunarDate.yearGanZhi}${lunarDate.yearShengXiao}年 ${LunarUtils.getLunarMonthInfo(date)}"
            }
            CalendarViewMode.DAY -> {
                binding.dayView.setSelectedDateProgrammatically(date)
                binding.tvCurrentDate.text = date.format(DateTimeFormatter.ofPattern("yyyy年MM月dd日 EEEE"))
                // 更新农历信息（显示完整的农历日期）
                val lunarDate = LunarUtils.solarToLunar(date)
                val leap = if (lunarDate.isLeapMonth) "闰" else ""
                val holidays = LunarUtils.getAllHolidays(date)
                val holidayStr = if (holidays.isNotEmpty()) " ${holidays.joinToString(" ")}" else ""
                binding.tvLunarDate.text = "${lunarDate.yearGanZhi}年 ${leap}${lunarDate.monthStr}月${lunarDate.dayStr}$holidayStr"
            }
        }
    }
    
    private fun updateEventsDisplay(events: List<com.example.daymate.data.Event>) {
        binding.monthView.setEvents(events)
        binding.weekView.setEvents(events)
        
        // 过滤当日事件
        val selectedDate = viewModel.selectedDate.value.toLocalDate()
        val todayEvents = events.filter { event ->
            event.startTime.toLocalDate() == selectedDate
        }
        binding.dayView.setEvents(todayEvents)
    }
    
    private fun updateDateDisplayForMonth(yearMonth: YearMonth) {
        binding.tvCurrentDate.text = yearMonth.format(dateFormatter)
        // 更新农历信息（使用月份中旬的日期来获取农历月份）
        val midMonthDate = yearMonth.atDay(15)
        val lunarDate = LunarUtils.solarToLunar(midMonthDate)
        binding.tvLunarDate.text = "${lunarDate.yearGanZhi}${lunarDate.yearShengXiao}年 ${LunarUtils.getLunarMonthInfo(midMonthDate)}"
    }
    
    private fun updateDateDisplayForWeek(weekStartDate: LocalDate) {
        val weekEndDate = weekStartDate.plusDays(6)
        binding.tvCurrentDate.text = "${weekStartDate.monthValue}/${weekStartDate.dayOfMonth} - ${weekEndDate.monthValue}/${weekEndDate.dayOfMonth}"
        // 更新农历信息（使用周中的日期）
        val midWeekDate = weekStartDate.plusDays(3)
        val lunarDate = LunarUtils.solarToLunar(midWeekDate)
        binding.tvLunarDate.text = "${lunarDate.yearGanZhi}${lunarDate.yearShengXiao}年 ${LunarUtils.getLunarMonthInfo(midWeekDate)}"
    }
    
    private fun updateDateDisplayForDay(date: LocalDate) {
        binding.tvCurrentDate.text = date.format(DateTimeFormatter.ofPattern("yyyy年MM月dd日 EEEE"))
        // 更新农历信息（显示完整的农历日期）
        val lunarDate = LunarUtils.solarToLunar(date)
        val leap = if (lunarDate.isLeapMonth) "闰" else ""
        val holidays = LunarUtils.getAllHolidays(date)
        val holidayStr = if (holidays.isNotEmpty()) " ${holidays.joinToString(" ")}" else ""
        binding.tvLunarDate.text = "${lunarDate.yearGanZhi}年 ${leap}${lunarDate.monthStr}月${lunarDate.dayStr}$holidayStr"
    }
    
    private fun showAddEventDialog(selectedDateTime: LocalDateTime? = null) {
        val dialog = AddEditEventDialogFragment.newInstance(selectedDateTime = selectedDateTime)
        dialog.show(parentFragmentManager, "AddEventDialog")
    }
    
    private fun showEventDetailsDialog(event: com.example.daymate.data.Event) {
        val dialog = EventDetailsDialogFragment.newInstance(event)
        dialog.show(parentFragmentManager, "EventDetailsDialog")
    }
    
    private fun showDailyEventsDialog(date: LocalDate) {
        // 添加Toast来确认双击被检测到
        // android.widget.Toast.makeText(
        //     requireContext(), 
        //     "双击日期: ${date}", 
        //     android.widget.Toast.LENGTH_SHORT
        // ).show()
        
        val dialog = DailyEventsDialogFragment.newInstance(date)
        dialog.show(parentFragmentManager, "DailyEventsDialog")
    }
    
    private fun showImportExportDialog() {
        val dialog = ImportExportDialogFragment.newInstance()
        dialog.show(parentFragmentManager, "ImportExportDialog")
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        // 清理所有View的回调，防止内存泄漏
        binding.monthView.onDateSelected = null
        binding.monthView.onMonthChanged = null
        binding.monthView.onDateDoubleClicked = null
        
        binding.weekView.onDateSelected = null
        binding.weekView.onTimeSlotClicked = null
        binding.weekView.onWeekChanged = null
        binding.weekView.onEventClicked = null
        
        binding.dayView.onTimeSlotClicked = null
        binding.dayView.onEventClicked = null
        binding.dayView.onDayChanged = null
        
        _binding = null
    }
    
    companion object {
        fun newInstance(): CalendarFragment {
            return CalendarFragment()
        }
    }
}
