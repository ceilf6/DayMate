package com.example.daymate.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.daymate.R
import com.example.daymate.data.Event
import com.example.daymate.shared.core.models.EventStatus
import com.example.daymate.databinding.ItemDailyEventBinding
import com.example.daymate.utils.PriorityColorUtils
import java.time.format.DateTimeFormatter

class DailyEventsAdapter(
    private val events: List<Event>,
    private val onEventClick: (Event) -> Unit
) : RecyclerView.Adapter<DailyEventsAdapter.EventViewHolder>() {

    private val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): EventViewHolder {
        val binding = ItemDailyEventBinding.inflate(
            LayoutInflater.from(parent.context), 
            parent, 
            false
        )
        return EventViewHolder(binding)
    }

    override fun onBindViewHolder(holder: EventViewHolder, position: Int) {
        holder.bind(events[position])
    }

    override fun getItemCount(): Int = events.size

    inner class EventViewHolder(
        private val binding: ItemDailyEventBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        init {
            binding.root.setOnClickListener {
                val position = adapterPosition
                if (position != RecyclerView.NO_POSITION) {
                    onEventClick(events[position])
                }
            }
        }

        fun bind(event: Event) {
            // 设置标题
            binding.tvEventTitle.text = event.title

            // 设置时间
            if (event.allDay) {
                binding.tvEventTime.text = "全天"
            } else {
                val startTime = event.startTime.format(timeFormatter)
                val endTime = event.endTime.format(timeFormatter)
                binding.tvEventTime.text = "$startTime - $endTime"
            }

            // 设置地点
            if (!event.location.isNullOrEmpty()) {
                binding.tvEventLocation.text = event.location
                binding.tvEventLocation.visibility = View.VISIBLE
            } else {
                binding.tvEventLocation.visibility = View.GONE
            }

            // 设置优先级指示器（NONE优先级隐藏）
            if (event.priority > 0) {
                val priorityColorRes = PriorityColorUtils.getPriorityColorRes(event.priority)
                binding.viewPriorityIndicator.setBackgroundColor(
                    ContextCompat.getColor(binding.root.context, priorityColorRes)
                )
                binding.viewPriorityIndicator.visibility = View.VISIBLE
            } else {
                binding.viewPriorityIndicator.visibility = View.GONE
            }

            // 设置优先级符号
            val prioritySymbol = PriorityColorUtils.getPriorityIndicator(event.priority)
            if (prioritySymbol.isNotEmpty()) {
                binding.tvPrioritySymbol.text = prioritySymbol
                binding.tvPrioritySymbol.setTextColor(
                    ContextCompat.getColor(binding.root.context, priorityColorRes)
                )
                binding.tvPrioritySymbol.visibility = View.VISIBLE
            } else {
                binding.tvPrioritySymbol.visibility = View.GONE
            }

            // 设置事件状态
            val (statusIcon, statusColor) = when (event.status) {
                EventStatus.CONFIRMED -> Pair(R.drawable.ic_check_circle, R.color.event_confirmed)
                EventStatus.TENTATIVE -> Pair(R.drawable.ic_help_outline, R.color.event_tentative)
                EventStatus.CANCELLED -> Pair(R.drawable.ic_cancel, R.color.event_cancelled)
            }
            
            binding.ivEventStatus.setImageResource(statusIcon)
            binding.ivEventStatus.setColorFilter(
                ContextCompat.getColor(binding.root.context, statusColor)
            )

            // 所有优先级使用相同的文本颜色（左侧指示条和右侧感叹号已有颜色区分）
            binding.tvEventTitle.setTextColor(
                ContextCompat.getColor(binding.root.context, R.color.primary_text)
            )
        }
    }
}
