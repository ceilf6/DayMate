package com.example.daymate.ui.importexport

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.viewModels
import com.example.daymate.R
import com.example.daymate.data.CalendarDatabase
import com.example.daymate.data.Event
import com.example.daymate.databinding.DialogImportExportBinding
import com.example.daymate.repository.EventRepository
import com.example.daymate.utils.FileManager
import com.example.daymate.viewmodel.CalendarViewModel
import com.example.daymate.viewmodel.CalendarViewModelFactory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ImportExportDialogFragment : DialogFragment() {
    
    private var _binding: DialogImportExportBinding? = null
    private val binding get() = _binding!!
    
    private val viewModel: CalendarViewModel by viewModels {
        val database = CalendarDatabase.getDatabase(requireContext())
        val repository = EventRepository(database.eventDao())
        CalendarViewModelFactory(repository, requireContext())
    }
    private val fileManager = FileManager(requireContext())
    
    private val importLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                importCalendar(uri)
            }
        }
    }
    
    private val exportLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                exportCalendar(uri)
            }
        }
    }
    
    companion object {
        fun newInstance(): ImportExportDialogFragment {
            return ImportExportDialogFragment()
        }
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogImportExportBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews()
        setupClickListeners()
    }
    
    private fun setupViews() {
        // 设置对话框标题
        binding.tvDialogTitle.text = "导入/导出日历"
        
        // 检查存储权限
        if (!fileManager.hasStoragePermission()) {
            binding.btnExport.isEnabled = false
            binding.btnExport.text = "需要存储权限"
        }
    }
    
    private fun setupClickListeners() {
        // 导入按钮
        binding.btnImport.setOnClickListener {
            openFilePicker()
        }
        
        // 导出按钮
        binding.btnExport.setOnClickListener {
            exportCalendar()
        }
        
        // 取消按钮
        binding.btnCancel.setOnClickListener {
            dismiss()
        }
    }
    
    private fun openFilePicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "*/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        
        try {
            importLauncher.launch(Intent.createChooser(intent, "选择日历文件"))
        } catch (e: Exception) {
            Toast.makeText(context, "无法打开文件选择器", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun exportCalendar() {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                binding.btnExport.isEnabled = false
                binding.btnExport.text = "导出中..."
                
                val events = getCurrentEvents()
                if (events.isEmpty()) {
                    Toast.makeText(context, "没有可导出的事件", Toast.LENGTH_SHORT).show()
                    return@launch
                }
                
                val uri = withContext(Dispatchers.IO) {
                    fileManager.exportCalendar(events)
                }
                
                // 分享文件
                shareFile(uri)
                
                Toast.makeText(context, "日历导出成功", Toast.LENGTH_SHORT).show()
                
            } catch (e: Exception) {
                Toast.makeText(context, "导出失败: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnExport.isEnabled = true
                binding.btnExport.text = "导出日历"
            }
        }
    }
    
    private fun exportCalendar(uri: Uri) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val events = getCurrentEvents()
                if (events.isEmpty()) {
                    Toast.makeText(context, "没有可导出的事件", Toast.LENGTH_SHORT).show()
                    return@launch
                }
                
                withContext(Dispatchers.IO) {
                    val simpleEvents = events.map { it.toSimpleCalendarEvent() }
                    val content = com.example.daymate.shared.core.utils.ICalendarUtils.exportToICalendar(simpleEvents)
                    requireContext().contentResolver.openOutputStream(uri)?.use { outputStream ->
                        outputStream.write(content.toByteArray())
                    }
                }
                
                Toast.makeText(context, "日历导出成功", Toast.LENGTH_SHORT).show()
                
            } catch (e: Exception) {
                Toast.makeText(context, "导出失败: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun importCalendar(uri: Uri) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                binding.btnImport.isEnabled = false
                binding.btnImport.text = "导入中..."
                
                val events = withContext(Dispatchers.IO) {
                    fileManager.importCalendar(uri)
                }
                
                if (events.isEmpty()) {
                    Toast.makeText(context, "文件中没有找到有效的事件", Toast.LENGTH_SHORT).show()
                    return@launch
                }
                
                // 批量添加事件
                events.forEach { event ->
                    viewModel.addEvent(event)
                }
                
                Toast.makeText(context, "成功导入 ${events.size} 个事件", Toast.LENGTH_SHORT).show()
                dismiss()
                
            } catch (e: Exception) {
                Toast.makeText(context, "导入失败: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnImport.isEnabled = true
                binding.btnImport.text = "导入日历"
            }
        }
    }
    
    private suspend fun getCurrentEvents(): List<Event> {
        return withContext(Dispatchers.IO) {
            try {
                val database = com.example.daymate.data.CalendarDatabase.getDatabase(requireContext())
                val repository = com.example.daymate.repository.EventRepository(database.eventDao())
                var result = emptyList<Event>()
                repository.getAllEvents().collect { events ->
                    result = events
                }
                result
            } catch (e: Exception) {
                emptyList()
            }
        }
    }
    
    private fun shareFile(uri: Uri) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/calendar"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        
        try {
            startActivity(Intent.createChooser(intent, "分享日历文件"))
        } catch (e: Exception) {
            Toast.makeText(context, "无法分享文件", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
