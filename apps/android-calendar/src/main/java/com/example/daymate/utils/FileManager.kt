package com.example.daymate.utils

import android.content.Context
import android.net.Uri
import android.os.Environment
import androidx.core.content.FileProvider
import com.example.daymate.data.Event
import com.example.daymate.shared.core.utils.ICalendarUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.*
import java.text.SimpleDateFormat
import java.util.*

class FileManager(private val context: Context) {

    companion object {
        private const val AUTHORITY = "com.example.daymate.fileprovider"
        private const val FILE_NAME_PREFIX = "daymate_calendar"
    }

    /**
     * 导出日历到文件
     */
    suspend fun exportCalendar(events: List<Event>, fileName: String? = null): Uri = withContext(Dispatchers.IO) {
        // 转换为 SimpleCalendarEvent 并使用 shared/core 的 ICalendarUtils
        val simpleEvents = events.map { it.toSimpleCalendarEvent() }
        val iCalendarContent = ICalendarUtils.exportToICalendar(simpleEvents)

        val actualFileName = fileName ?: generateFileName()
        val file = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), actualFileName)

        file.writeText(iCalendarContent, Charsets.UTF_8)

        FileProvider.getUriForFile(context, AUTHORITY, file)
    }

    /**
     * 从URI导入日历
     */
    suspend fun importCalendar(uri: Uri): List<Event> = withContext(Dispatchers.IO) {
        val inputStream = context.contentResolver.openInputStream(uri)
        val content = inputStream?.bufferedReader()?.use { it.readText() } ?: ""

        // 使用 shared/core 的 ICalendarUtils 并转换回 Event
        val simpleEvents = ICalendarUtils.importFromICalendar(content)
        simpleEvents.map { Event.fromSimpleCalendarEvent(it) }
    }

    /**
     * 从文件路径导入日历
     */
    suspend fun importCalendarFromFile(filePath: String): List<Event> = withContext(Dispatchers.IO) {
        val file = File(filePath)
        val content = file.readText(Charsets.UTF_8)

        // 使用 shared/core 的 ICalendarUtils 并转换回 Event
        val simpleEvents = ICalendarUtils.importFromICalendar(content)
        simpleEvents.map { Event.fromSimpleCalendarEvent(it) }
    }

    /**
     * 生成默认文件名
     */
    private fun generateFileName(): String {
        val dateFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault())
        val timestamp = dateFormat.format(Date())
        return "${FILE_NAME_PREFIX}_${timestamp}.ics"
    }

    /**
     * 获取导出目录的文件列表
     */
    fun getExportFiles(): List<File> {
        val exportDir = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS)
        return exportDir?.listFiles { file ->
            file.isFile && file.name.startsWith(FILE_NAME_PREFIX) && file.name.endsWith(".ics")
        }?.toList() ?: emptyList()
    }

    /**
     * 删除导出文件
     */
    fun deleteExportFile(file: File): Boolean {
        return try {
            file.delete()
        } catch (e: Exception) {
            false
        }
    }

    /**
     * 检查存储权限
     */
    fun hasStoragePermission(): Boolean {
        return Environment.getExternalStorageState() == Environment.MEDIA_MOUNTED
    }
}
