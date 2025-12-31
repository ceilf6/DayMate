package com.example.daymate.ui.event

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.viewModels
import com.example.daymate.R
import com.example.daymate.data.CalendarDatabase
import com.example.daymate.data.Event
import com.example.daymate.databinding.DialogEventDetailsBinding
import com.example.daymate.repository.EventRepository
import com.example.daymate.utils.PriorityColorUtils
import com.example.daymate.viewmodel.CalendarViewModel
import com.example.daymate.viewmodel.CalendarViewModelFactory
import java.time.format.DateTimeFormatter

class EventDetailsDialogFragment : DialogFragment() {
    
    private var _binding: DialogEventDetailsBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: CalendarViewModel by viewModels {
        val database = CalendarDatabase.getDatabase(requireContext())
        val repository = EventRepository(database.eventDao())
        CalendarViewModelFactory(repository, requireContext())
    }
    
    private lateinit var event: Event
    
    companion object {
        private const val ARG_EVENT = "event"
        
        fun newInstance(event: Event): EventDetailsDialogFragment {
            val fragment = EventDetailsDialogFragment()
            val args = Bundle()
            args.putSerializable(ARG_EVENT, event)
            fragment.arguments = args
            return fragment
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            @Suppress("DEPRECATION")
            event = it.getSerializable(ARG_EVENT) as Event
        }
    }
    
    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val dialog = super.onCreateDialog(savedInstanceState)
        dialog.setCanceledOnTouchOutside(true)
        return dialog
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogEventDetailsBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews()
        setupClickListeners()
        loadEventData()
    }
    
    private fun setupViews() {
        // 设置对话框标题
        binding.tvEventTitle.text = event.title
    }
    
    private fun setupClickListeners() {
        // 编辑按钮
        binding.btnEdit.setOnClickListener {
            dismiss()
            val editDialog = AddEditEventDialogFragment.newInstance(event)
            editDialog.show(parentFragmentManager, "EditEventDialog")
        }
        
        // 删除按钮
        binding.btnDelete.setOnClickListener {
            showDeleteConfirmation()
        }
        
        // 关闭按钮
        binding.btnClose.setOnClickListener {
            dismiss()
        }
    }
    
    private fun loadEventData() {
        val dateFormatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日")
        val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
        
        // 基本信息
        binding.tvEventTitle.text = event.title
        
        // 描述
        if (!event.description.isNullOrEmpty()) {
            binding.tvDescription.text = event.description
            binding.layoutDescription.visibility = View.VISIBLE
        } else {
            binding.layoutDescription.visibility = View.GONE
        }
        
        // 地点
        if (!event.location.isNullOrEmpty()) {
            binding.tvLocation.text = event.location
            binding.layoutLocation.visibility = View.VISIBLE
        } else {
            binding.layoutLocation.visibility = View.GONE
        }
        
        // 分类
        if (!event.category.isNullOrEmpty()) {
            binding.tvCategory.text = event.category
            binding.layoutCategory.visibility = View.VISIBLE
        } else {
            binding.layoutCategory.visibility = View.GONE
        }
        
        // 时间
        if (event.allDay) {
            binding.tvStartTime.text = event.startTime.format(dateFormatter)
            binding.tvEndTime.text = "全天"
            binding.layoutEndTime.visibility = View.GONE
        } else {
            binding.tvStartTime.text = "${event.startTime.format(dateFormatter)} ${event.startTime.format(timeFormatter)}"
            binding.tvEndTime.text = "${event.endTime.format(dateFormatter)} ${event.endTime.format(timeFormatter)}"
            binding.layoutEndTime.visibility = View.VISIBLE
        }
        
        // 优先级
        val priorityText = PriorityColorUtils.getPriorityText(event.priority)
        binding.tvPriority.text = priorityText
        
        // 设置优先级视觉指示器
        val colorRes = PriorityColorUtils.getPriorityColorRes(event.priority)
        
        // 设置优先级指示器背景色
        val priorityIndicator = binding.viewPriorityIndicator
        priorityIndicator.setBackgroundResource(colorRes)
        
        // 设置优先级符号
        val prioritySymbol = PriorityColorUtils.getPriorityIndicator(event.priority)
        
        if (prioritySymbol.isNotEmpty()) {
            binding.tvPrioritySymbol.text = prioritySymbol
            binding.tvPrioritySymbol.setTextColor(androidx.core.content.ContextCompat.getColor(requireContext(), colorRes))
            binding.tvPrioritySymbol.visibility = View.VISIBLE
        } else {
            binding.tvPrioritySymbol.visibility = View.GONE
        }
        
        // 为高优先级事件的标题添加强调色
        if (event.priority in 1..3) {
            binding.tvEventTitle.setTextColor(androidx.core.content.ContextCompat.getColor(requireContext(), R.color.priority_high))
        }
        
        // 状态
        val statusText = when (event.status) {
            com.example.daymate.shared.core.models.EventStatus.CONFIRMED -> "已确认"
            com.example.daymate.shared.core.models.EventStatus.TENTATIVE -> "暂定"
            com.example.daymate.shared.core.models.EventStatus.CANCELLED -> "已取消"
        }
        binding.tvStatus.text = statusText

        // 透明度
        val transparencyText = when (event.transparency) {
            com.example.daymate.shared.core.models.Transparency.OPAQUE -> "不透明"
            com.example.daymate.shared.core.models.Transparency.TRANSPARENT -> "透明"
        }
        binding.tvTransparency.text = transparencyText
        
        // 提醒
        if (event.reminderMinutes != null) {
            val reminderText = when (event.reminderMinutes) {
                5 -> "5分钟前"
                15 -> "15分钟前"
                30 -> "30分钟前"
                60 -> "1小时前"
                1440 -> "1天前"
                else -> "${event.reminderMinutes}分钟前"
            }
            binding.tvReminder.text = reminderText
            binding.layoutReminder.visibility = View.VISIBLE
        } else {
            binding.layoutReminder.visibility = View.GONE
        }
        
        // 农历信息
        if (event.isLunarEvent && !event.lunarDate.isNullOrEmpty()) {
            binding.tvLunarDate.text = event.lunarDate
            binding.layoutLunarDate.visibility = View.VISIBLE
        } else {
            binding.layoutLunarDate.visibility = View.GONE
        }
        
        // 创建时间
        binding.tvCreatedAt.text = event.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
        binding.tvUpdatedAt.text = event.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
    }
    
    private fun showDeleteConfirmation() {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("删除事件")
            .setMessage("确定要删除这个事件吗？")
            .setPositiveButton("删除") { _, _ ->
                viewModel.deleteEvent(event)
                dismiss()
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
