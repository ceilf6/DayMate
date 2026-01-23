# DayMate — 你的日程小帮手

<div align="center">
  <img src="../assets/DayMate.png" alt="DayMate Logo" width="200"/>
</div>

[English](../README.md)

一个面向日常与专业场景的跨平台日历应用。DayMate 采用 Monorepo 架构，同时支持 Android 原生和 React Native 跨平台应用，以清晰直观的日历视图和灵活的事件管理为核心。

> **说明**：目前开发以 React Native 侧为主。Android 原生应用共享核心模块（事件模型、农历等），但 UI 功能暂未完全同步。

## 架构概览

DayMate 采用 Monorepo 架构，包含以下模块：

```
DayMate/
├── apps/
│   ├── android-calendar/    # Android 原生应用
│   └── rn-calendar/         # React Native 跨平台应用
├── shared/
│   ├── core/                # 共享核心业务逻辑
│   └── ui-android/          # Android UI 组件库
├── packages/                # 共享包（农历等）
└── docs/                    # 项目文档
```

## 产品截图

<div align="center">
  <img src="./assets/紫色-背景图片.PNG" alt="Theme Background" width="250"/>
  <img src="./assets/灰色-设置页面.PNG" alt="Settings" width="250"/>
  <img src="./assets/橙色-主页面.PNG" alt="Home Screen" width="250"/>
  <img src="./assets/粉色-日程区域和待完成事项双区域.PNG" alt="Schedule and Todo" width="250"/>
  <img src="./assets/蓝色-订阅功能.PNG" alt="Subscription Feature" width="250"/>
  <img src="./assets/绿色-导入导出功能.PNG" alt="Import Export" width="250"/>
</div>
## 核心特性

### 多平台支持
- **Android 原生**：完整的 Material Design 体验
- **React Native**：iOS / Android 跨平台支持
- **共享核心**：统一的业务逻辑和数据模型

### 丰富的日历视图
- 月视图：查看整月日程安排
- 周视图：专注本周计划
- 日视图：详细的单日时间线
- 快速切换，聚焦你关心的时间范围

### 智能提醒
- 本地通知提醒
- 多次提前提醒选项
- 设备重启后自动重建提醒

### 垃圾桶功能
- 删除的事项进入垃圾桶而非永久删除
- 30 天后自动清理
- 随时恢复或永久删除

### 日历订阅
- 通过 webcal:// 或 https:// 订阅外部日历
- 支持 ICS 格式日历源
- 可配置同步频率
- 订阅后自动添加事件

### 深浅色模式
- 跟随系统模式
- 手动浅色模式
- 手动深色模式
- 主题色自定义

### 标准兼容
- 支持 RFC5545/ICS 导入导出
- 与 Google Calendar、Outlook 等互通
- 网络订阅支持（webcal/https）

### 农历支持
- 内置农历日期显示
- 节气和传统节日
- 面向中文用户优化

### 国际化
- 完整的 i18n 支持
- 中英文界面
- 易于扩展其他语言

## 快速开始

### 环境要求

- **Android 开发**：JDK 17+, Android Studio Hedgehog+, Android SDK 34
- **React Native**：Node.js 16+, npm/yarn/pnpm
- **iOS 开发**：Xcode 14+, CocoaPods

### 构建 Android 应用

```bash
# 克隆仓库
git clone https://github.com/ceilf6/DayMate.git
cd DayMate

# 构建并安装
./gradlew :apps:android-calendar:installDebug
```

### 运行 React Native 应用

```bash
# 进入 RN 目录
cd apps/rn-calendar

# 安装依赖
npm install

# 运行 Android
npm run android

# 运行 iOS
npm run ios
```

## 文档

- [架构文档](./ARCHITECTURE.md) - 了解 Monorepo 架构设计
- [开发指南](./DEVELOPMENT.md) - 开发环境配置和工作流
- [迁移指南](./MIGRATION.md) - 从单应用迁移到 Monorepo
- [国际化指南](./I18N_GUIDE.md) - 国际化开发指南
- [使用指南](./USAGE_GUIDE.md) - 用户使用指南

## 适用场景

- 个人时间管理：安排会议、任务与待办
- 家庭共享日历：导出/订阅日历分享给家人
- 跨平台使用：在 Android 和 iOS 设备间无缝切换
- 导入历史日程：从 ICS 文件批量导入事件
- 订阅外部日历：公共节假日、团队日程等

## 技术栈

### Android 原生
- Kotlin
- Jetpack (Room, ViewModel, LiveData, Navigation, WorkManager)
- Material Design 3
- Coroutines & Flow

### React Native
- TypeScript
- React Navigation
- AsyncStorage / SQLite
- React Native Calendars

### 共享层
- Kotlin（共享核心逻辑）
- Gradle Multi-Project
- Room Database

## 测试

```bash
# Android 单元测试
./gradlew :shared:core:test
./gradlew :apps:android-calendar:test

# React Native 测试
cd apps/rn-calendar
npm test
```

## 功能一览

### 日历视图
- 月视图 / 周视图 / 日视图切换
- 支持事件预览、长期事件与全天事件展示

### 事件管理
- 新建 / 编辑 / 删除事件
- 支持重复规则（常见模式）与结束条件
- 多条提醒规则（例如：提前 30 分钟、10 分钟）
- 滑动完成或删除事件
- 垃圾桶功能支持恢复已删除事件

### 导入与导出
- ICS 文件导入（解析 RFC5545）
- ICS 导出以便在其他应用中导入

### 日历订阅
- 支持 webcal:// 和 https:// 的日历订阅
- 后台定期同步订阅源（可配置）
- 订阅事件自动添加到日历

### 本地化
- 中文农历日期与节气显示
- 本地化的时间/日期格式
- 多语言界面支持

## 架构与实现

- **平台**：Android (Kotlin + AndroidX) / React Native (TypeScript)
- **数据存储**：本地数据库（Room / AsyncStorage）用于持久化事件与订阅元数据
- **后台任务**：使用 WorkManager 做订阅同步与提醒重建
- **通知**：系统通知，适配 Android 13+ 权限要求

## 权限与隐私

### 所需权限
- **INTERNET**：用于订阅日历与网络导入
- **POST_NOTIFICATIONS**（Android 13+）：发送本地提醒通知
- **RECEIVE_BOOT_COMPLETED**：设备重启后重建提醒
- **存储访问**：使用 SAF（Storage Access Framework）进行导入导出

### 隐私说明
- 默认情况下数据保存在本地设备，不会自动发送到第三方服务器
- 订阅功能仅连接用户提供的 URL
- 私有订阅的凭证仅保存在本地

## 导入/导出与订阅指南

### 导入 ICS 文件
1. 在"设置/导入"中选择 ICS 文件
2. 应用会解析 RFC5545 事件，并提示冲突与重复事件策略

### 导出为 ICS
选择事件或日历导出为标准 ICS 文件，方便备份或分享。

### 订阅日历
1. 在"订阅"设置中填入 webcal:// 或 https:// 链接
2. 配置同步频率
3. 事件自动同步到你的日历

## 常见问题

**问：导入后时间出现偏移？**
答：请检查导入文件的时区声明（VTIMEZONE）与设备时区设置。

**问：订阅为什么会不更新？**
答：检查订阅源是否有效、同步频率设置，以及是否存在网络连接问题。

**问：如何恢复已删除的事件？**
答：打开设置中的垃圾桶，找到事件后点击恢复。

## 贡献与反馈

欢迎提 Issue、PR 或功能建议！

1. Fork 仓库
2. 新建分支实现功能或修复 bug
3. 提交 PR 并描述变更与测试步骤

## 许可

请参阅仓库根目录的 `LICENSE` 文件了解本项目的许可证条款。

## 路线图

- 完善重复规则编辑 UI
- 增强 ICS 导入兼容性
- 云同步选项（可选）
- 共享日历编辑权限
- 智能日程推荐

---

感谢使用 DayMate！如需演示或定制化功能，欢迎在 Issue 中留言。
