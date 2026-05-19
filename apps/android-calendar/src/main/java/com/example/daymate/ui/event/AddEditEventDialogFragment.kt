package com.example.daymate.ui.event

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.viewModels
import com.example.daymate.R
import com.example.daymate.data.CalendarDatabase
import com.example.daymate.data.Event
import com.example.daymate.shared.core.models.EventStatus
import com.example.daymate.shared.core.models.Transparency
import com.example.daymate.databinding.DialogAddEditEventBinding
import com.example.daymate.repository.EventRepository
import com.example.daymate.utils.PriorityColorUtils
import com.example.daymate.viewmodel.CalendarViewModel
import com.example.daymate.viewmodel.CalendarViewModelFactory
import com.example.daymate.shared.core.utils.LunarUtils
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*

class AddEditEventDialogFragment : DialogFragment() {
    
    private var _binding: DialogAddEditEventBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: CalendarViewModel by viewModels {
        val database = CalendarDatabase.getDatabase(requireContext())
        val repository = EventRepository(database.eventDao())
        CalendarViewModelFactory(repository, requireContext())
    }
    
    private var event: Event? = null
    private var selectedStartDateTime: LocalDateTime = LocalDateTime.now()
    private var selectedEndDateTime: LocalDateTime = LocalDateTime.now().plusHours(1)
    
    companion object {
        private const val ARG_EVENT = "event"
        private const val ARG_SELECTED_DATE_TIME = "selected_date_time"
        
        fun newInstance(event: Event? = null, selectedDateTime: LocalDateTime? = null): AddEditEventDialogFragment {
            val fragment = AddEditEventDialogFragment()
            val args = Bundle()
            event?.let { args.putSerializable(ARG_EVENT, it) }
            selectedDateTime?.let { args.putString(ARG_SELECTED_DATE_TIME, it.toString()) }
            fragment.arguments = args
            return fragment
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            @Suppress("DEPRECATION")
            event = it.getSerializable(ARG_EVENT) as? Event
            val dateTimeString = it.getString(ARG_SELECTED_DATE_TIME)
            dateTimeString?.let { dtStr ->
                val dateTime = LocalDateTime.parse(dtStr)
                selectedStartDateTime = dateTime
                selectedEndDateTime = dateTime.plusHours(1)
            }
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogAddEditEventBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews()
        setupClickListeners()
        loadEventData()
    }
    
    private fun setupViews() {
        // 设置优先级下拉菜单
        val priorities = arrayOf("未设置", "高", "中", "低")
        val priorityAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, priorities)
        priorityAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerPriority.adapter = priorityAdapter
        
        // 为优先级选择器添加监听器，实时预览颜色
        binding.spinnerPriority.setOnItemSelectedListener(object : android.widget.AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: android.widget.AdapterView<*>?, view: android.view.View?, position: Int, id: Long) {
                updatePriorityPreview(position)
            }
            override fun onNothingSelected(parent: android.widget.AdapterView<*>?) {}
        })
        
        // 设置状态下拉菜单
        val statuses = arrayOf("已确认", "暂定", "已取消")
        val statusAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, statuses)
        statusAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerStatus.adapter = statusAdapter
        
        // 设置透明度下拉菜单
        val transparencies = arrayOf("不透明", "透明")
        val transparencyAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, transparencies)
        transparencyAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerTransparency.adapter = transparencyAdapter
        
        // 设置提醒时间下拉菜单
        val reminderOptions = arrayOf("无提醒", "5分钟前", "15分钟前", "30分钟前", "1小时前", "1天前")
        val reminderAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, reminderOptions)
        reminderAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerReminder.adapter = reminderAdapter

        // 设置农历月下拉菜单
        val lunarMonths = arrayOf("正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊")
        val lunarMonthAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, lunarMonths)
        lunarMonthAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerLunarMonth.adapter = lunarMonthAdapter

        // 设置农历日下拉菜单
        val lunarDays = (1..30).map { it.toString() }.toTypedArray()
        val lunarDayAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, lunarDays)
        lunarDayAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        binding.spinnerLunarDay.adapter = lunarDayAdapter
        
        // 设置对话框标题
        binding.tvDialogTitle.text = if (event != null) "编辑事件" else "添加事件"
        binding.btnSave.text = if (event != null) "更新" else "保存"
        
        // 初始化优先级预览 (默认为"未设置")
        updatePriorityPreview(0)
    }
    
    private fun setupClickListeners() {
        // 开始日期选择
        binding.btnStartDate.setOnClickListener {
            showDatePicker(selectedStartDateTime) { date ->
                selectedStartDateTime = selectedStartDateTime.withYear(date.year)
                    .withMonth(date.monthValue)
                    .withDayOfMonth(date.dayOfMonth)
                updateDateTimeDisplay()
            }
        }
        
        // 开始时间选择
        binding.btnStartTime.setOnClickListener {
            showTimePicker(selectedStartDateTime) { time ->
                selectedStartDateTime = selectedStartDateTime.withHour(time.hour)
                    .withMinute(time.minute)
                updateDateTimeDisplay()
            }
        }
        
        // 结束日期选择
        binding.btnEndDate.setOnClickListener {
            showDatePicker(selectedEndDateTime) { date ->
                selectedEndDateTime = selectedEndDateTime.withYear(date.year)
                    .withMonth(date.monthValue)
                    .withDayOfMonth(date.dayOfMonth)
                updateDateTimeDisplay()
            }
        }
        
        // 结束时间选择
        binding.btnEndTime.setOnClickListener {
            showTimePicker(selectedEndDateTime) { time ->
                selectedEndDateTime = selectedEndDateTime.withHour(time.hour)
                    .withMinute(time.minute)
                updateDateTimeDisplay()
            }
        }
        
        // 全天事件切换
        binding.switchAllDay.setOnCheckedChangeListener { _, isChecked ->
            binding.layoutEndTime.visibility = if (isChecked) View.GONE else View.VISIBLE
            if (isChecked) {
                selectedStartDateTime = selectedStartDateTime.withHour(0).withMinute(0)
                selectedEndDateTime = selectedStartDateTime.withHour(23).withMinute(59)
            }
            updateDateTimeDisplay()
        }

        // 农历事件切换
        binding.switchLunarEvent.setOnCheckedChangeListener { _, isChecked ->
            binding.layoutLunarDate.visibility = if (isChecked) View.VISIBLE else View.GONE
        }
        
        // 保存按钮
        binding.btnSave.setOnClickListener {
            saveEvent()
        }
        
        // 取消按钮
        binding.btnCancel.setOnClickListener {
            dismiss()
        }
    }
    
    private fun loadEventData() {
        event?.let { event ->
            binding.etTitle.setText(event.title)
            binding.etDescription.setText(event.description)
            binding.etLocation.setText(event.location)
            binding.etCategory.setText(event.category)
            
            selectedStartDateTime = event.startTime
            selectedEndDateTime = event.endTime
            
            binding.switchAllDay.isChecked = event.allDay
            
            // 设置优先级
            val prioritySelection = when (event.priority) {
                in 1..3 -> 1 // 高
                in 4..6 -> 2 // 中
                in 7..9 -> 3 // 低
                else -> 0 // 未设置
            }
            binding.spinnerPriority.setSelection(prioritySelection)
            updatePriorityPreview(prioritySelection)
            
            // 设置状态
            binding.spinnerStatus.setSelection(when (event.status) {
                EventStatus.CONFIRMED -> 0
                EventStatus.TENTATIVE -> 1
                EventStatus.CANCELLED -> 2
            })
            
            // 设置透明度
            binding.spinnerTransparency.setSelection(when (event.transparency) {
                Transparency.OPAQUE -> 0
                Transparency.TRANSPARENT -> 1
            })
            
            // 设置提醒
            binding.spinnerReminder.setSelection(when (event.reminderMinutes) {
                null -> 0 // 无提醒
                5 -> 1
                15 -> 2
                30 -> 3
                60 -> 4
                1440 -> 5
                else -> 0
            })

            // 设置农历事件
            binding.switchLunarEvent.isChecked = event.isLunarEvent
            binding.layoutLunarDate.visibility = if (event.isLunarEvent) View.VISIBLE else View.GONE
            if (event.isLunarEvent && event.lunarDate != null) {
                val parts = event.lunarDate!!.split("-")
                if (parts.size >= 2) {
                    val lunarMonth = parts[0].toIntOrNull() ?: 1
                    val lunarDay = parts[1].toIntOrNull() ?: 1
                    val isLeap = parts.size >= 3 && parts[2] == "L"
                    binding.spinnerLunarMonth.setSelection(lunarMonth - 1)
                    binding.spinnerLunarDay.setSelection(lunarDay - 1)
                    binding.cbLeapMonth.isChecked = isLeap
                }
            }
        }
        
        updateDateTimeDisplay()
    }
    
    private fun updateDateTimeDisplay() {
        val dateFormatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日")
        val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
        
        binding.btnStartDate.text = selectedStartDateTime.format(dateFormatter)
        binding.btnStartTime.text = selectedStartDateTime.format(timeFormatter)
        binding.btnEndDate.text = selectedEndDateTime.format(dateFormatter)
        binding.btnEndTime.text = selectedEndDateTime.format(timeFormatter)
    }
    
    private fun showDatePicker(currentDate: LocalDateTime, onDateSelected: (LocalDateTime) -> Unit) {
        val datePickerDialog = DatePickerDialog(
            requireContext(),
            { _, year, month, dayOfMonth ->
                val selectedDate = LocalDateTime.of(year, month + 1, dayOfMonth, 0, 0)
                onDateSelected(selectedDate)
            },
            currentDate.year,
            currentDate.monthValue - 1,
            currentDate.dayOfMonth
        )
        datePickerDialog.show()
    }
    
    private fun showTimePicker(currentTime: LocalDateTime, onTimeSelected: (LocalDateTime) -> Unit) {
        val timePickerDialog = TimePickerDialog(
            requireContext(),
            { _, hourOfDay, minute ->
                val selectedTime = LocalDateTime.of(0, 1, 1, hourOfDay, minute)
                onTimeSelected(selectedTime)
            },
            currentTime.hour,
            currentTime.minute,
            true
        )
        timePickerDialog.show()
    }
    
    private fun saveEvent() {
        val title = binding.etTitle.text.toString().trim()
        if (title.isEmpty()) {
            binding.etTitle.error = "请输入事件标题"
            return
        }
        
        val description = binding.etDescription.text.toString().trim()
        val location = binding.etLocation.text.toString().trim()
        val category = binding.etCategory.text.toString().trim()
        val allDay = binding.switchAllDay.isChecked
        
        val priority = when (binding.spinnerPriority.selectedItemPosition) {
            1 -> 2 // 高 (使用1-3范围内的中值)
            2 -> 5 // 中 (使用4-6范围内的中值)
            3 -> 8 // 低 (使用7-9范围内的中值)
            else -> 0 // 未设置
        }
        
        val status = when (binding.spinnerStatus.selectedItemPosition) {
            0 -> EventStatus.CONFIRMED
            1 -> EventStatus.TENTATIVE
            2 -> EventStatus.CANCELLED
            else -> EventStatus.CONFIRMED
        }
        
        val transparency = when (binding.spinnerTransparency.selectedItemPosition) {
            0 -> Transparency.OPAQUE
            1 -> Transparency.TRANSPARENT
            else -> Transparency.OPAQUE
        }
        
        val reminderMinutes = when (binding.spinnerReminder.selectedItemPosition) {
            0 -> null // 无提醒
            1 -> 5
            2 -> 15
            3 -> 30
            4 -> 60
            5 -> 1440
            else -> null
        }

        // 农历事件信息
        val isLunarEvent = binding.switchLunarEvent.isChecked
        val lunarDate = if (isLunarEvent) {
            val lunarMonth = binding.spinnerLunarMonth.selectedItemPosition + 1
            val lunarDay = binding.spinnerLunarDay.selectedItemPosition + 1
            val leapSuffix = if (binding.cbLeapMonth.isChecked) "-L" else ""
            "$lunarMonth-$lunarDay$leapSuffix"
        } else {
            null
        }
        
        val eventToSave = if (event != null) {
            event!!.copy(
                title = title,
                description = if (description.isEmpty()) null else description,
                location = if (location.isEmpty()) null else location,
                category = if (category.isEmpty()) null else category,
                startTime = selectedStartDateTime,
                endTime = selectedEndDateTime,
                allDay = allDay,
                priority = priority,
                status = status,
                transparency = transparency,
                reminderMinutes = reminderMinutes,
                lunarDate = lunarDate,
                isLunarEvent = isLunarEvent,
                updatedAt = LocalDateTime.now()
            )
        } else {
            Event(
                title = title,
                description = if (description.isEmpty()) null else description,
                location = if (location.isEmpty()) null else location,
                category = if (category.isEmpty()) null else category,
                startTime = selectedStartDateTime,
                endTime = selectedEndDateTime,
                allDay = allDay,
                priority = priority,
                status = status,
                transparency = transparency,
                reminderMinutes = reminderMinutes,
                lunarDate = lunarDate,
                isLunarEvent = isLunarEvent
            )
        }
        
        if (event != null) {
            viewModel.updateEvent(eventToSave)
        } else {
            viewModel.addEvent(eventToSave)
        }
        
        dismiss()
    }
    
    private fun updatePriorityPreview(priorityPosition: Int) {
        val priority = when (priorityPosition) {
            1 -> 2 // 高
            2 -> 5 // 中  
            3 -> 8 // 低
            else -> 0 // 未设置
        }
        
        val colorRes = PriorityColorUtils.getPriorityColorRes(priority)
        binding.viewPriorityPreview.setBackgroundColor(
            androidx.core.content.ContextCompat.getColor(requireContext(), colorRes)
        )
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
