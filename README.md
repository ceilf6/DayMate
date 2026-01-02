# DayMate — 你的日程小帮手

Calender+todos: 在日历应用中便捷进行事项管理  

一个面向日常与专业场景的跨平台日历产品。DayMate 采用 Monorepo 架构，同时支持 Android 原生和 React Native 跨平台应用，以清晰直观的日历视图和灵活的事件管理为核心。

## 🏗️ 架构概览

DayMate 采用 Monorepo 架构，包含以下模块：

```
DayMate/
├── apps/
│   ├── android-calendar/    # Android 原生应用
│   └── rn-calendar/          # React Native 跨平台应用
├── shared/
│   ├── core/                 # 共享核心业务逻辑
│   └── ui-android/           # Android UI 组件库
└── docs/                     # 项目文档
```

## ✨ 核心特性

### 🎨 多平台支持
- **Android 原生**: 完整的 Material Design 体验
- **React Native**: iOS / Android 跨平台支持
- **共享核心**: 统一的业务逻辑和数据模型

### 📅 丰富的日历视图
- 月视图：查看整月日程安排
- 周视图：专注本周计划
- 日视图：详细的单日时间线
- 快速切换，聚焦你关心的时间范围

### 🔔 智能提醒
- 本地通知提醒
- 多次提前提醒
- 开机后自动重建提醒

### 🌏 标准兼容
- 支持 RFC5545/ICS 导入导出
- 与 Google Calendar、Outlook 等互通
- 网络订阅支持（webcal/https）

### 🎑 农历支持
- 内置农历日期显示
- 节气和传统节日
- 面向中文用户优化

## 🚀 快速开始

### 环境要求

- **Android 开发**: JDK 17+, Android Studio Hedgehog+, Android SDK 34
- **React Native**: Node.js 16+, npm/yarn
- **iOS 开发**: Xcode 14+, CocoaPods

### 构建 Android 应用

```bash
# 克隆仓库
git clone https://github.com/ceilf6/Android_DayMate.git
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

## 📖 文档

- [架构文档](./docs/ARCHITECTURE.md) - 了解 Monorepo 架构设计
- [开发指南](./docs/DEVELOPMENT.md) - 开发环境配置和工作流
- [迁移指南](./docs/MIGRATION.md) - 从单应用迁移到 Monorepo

## 🎯 适用场景
- 个人时间管理：安排会议、任务与待办
- 家庭共享日历：导出/订阅日历分享给家人
- 跨平台使用：在 Android 和 iOS 设备间无缝切换
- 导入历史日程：从 ICS 文件批量导入事件

## 🛠️ 技术栈

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
- Kotlin (共享核心逻辑)
- Gradle Multi-Project
- Room Database

## 🧪 测试

```bash
# Android 单元测试
./gradlew :shared:core:test
./gradlew :apps:android-calendar:test

# React Native 测试
cd apps/rn-calendar
npm test
```

## 📱 主要功能一览

- 日历视图
    - 月视图 / 周视图 / 日视图切换
    - 支持事件预览、长期事件与全天事件展示

- 事件管理
    - 新建 / 编辑 / 删除事件
    - 支持重复规则（常见模式）与结束条件
    - 多条提醒规则（例如：提前 30 分钟、10 分钟）

- 导入与导出
    - ICS 文件导入（解析 RFC5545）
    - ICS 导出以便在其他应用中导入

- 网络订阅
    - 支持 webcal:// 和 https:// 的日历订阅
    - 后台定期同步订阅源（可配置）

- 农历与本地化
    - 中文农历日期与节气显示
    - 本地化的时间/日期格式与语言支持

## 架构与实现（高层概述）

- 平台：Android（基于 Kotlin 与 AndroidX 组件）
- 数据存储：本地数据库（例如 Room）用于持久化事件与订阅元数据
- 后台任务：使用 WorkManager 或等效方案做订阅同步与提醒重建
- 通知：使用系统 Notification/Foreground Service（按 Android 版本适配 POST_NOTIFICATIONS 等权限）

（注：具体实现细节请参考项目源码）

## 权限与隐私

- 常见需要的权限：
    - INTERNET：用于订阅日历与网络导入
    - POST_NOTIFICATIONS（Android 13+）：发送本地提醒通知
    - RECEIVE_BOOT_COMPLETED：设备重启后重建提醒（可选，可通过 WorkManager 实现无需显式广播权限）
    - 存储访问：当导入导出需要访问设备文件时，使用 SAF（Storage Access Framework）以遵循现代权限模型

- 隐私说明：
    - 默认情况下数据保存在本地设备，不会自动发送到第三方服务器。
    - 订阅功能会连接订阅源的 URL 以获取日程数据；如果使用需要验证的私有订阅，凭证只保存在本地（请勿将敏感凭证明文提交到仓库）。

## 导入/导出与订阅 指南

- 导入 ICS 文件：
    1. 在“设置/导入”中选择 ICS 文件。
    2. 应用会解析 RFC5545 事件，并提示冲突与重复事件策略。

- 导出为 ICS：选择一个日历或事件集导出为标准 ICS 文件，方便备份或导入到其他日历服务。

- 订阅 URL：
    1. 在“订阅”中填入 webcal:// 或 https:// 链接。
    2. 配置同步频率（例如每日 / 每小时）。

## 快速开始（开发者/测试）

在 macOS 或其他开发环境中使用 Android Studio 打开本项目目录，然后运行或调试应用：

```bash
# 使用 Gradle Wrapper 构建（在项目根目录）：
./gradlew assembleDebug

# 直接运行（需连接设备或启用模拟器）：
./gradlew installDebug
```

更多调试与测试步骤请参见项目内的模块说明与注释。

## 屏幕与演示

（仓库可添加 `screenshots/` 文件夹并放置演示图片）

## 常见问题（FAQ）

- 问：导入后时间出现偏移？
    - 答：请检查导入文件的时区声明（VTIMEZONE）与设备时区设置，导入时可选择是否强制使用设备时区。

- 问：订阅为什么会不更新？
    - 答：检查订阅源是否有效、同步频率设置，以及是否存在网络连接问题或认证失败。

## 贡献与反馈

欢迎提 Issue、PR 或功能建议。若需贡献代码：

1. Fork 仓库
2. 新建分支实现功能或修复 bug
3. 提交 PR 并描述变更与测试步骤

请在 PR 中附上可复现步骤与相关日志（如有）。

## 许可

请参阅仓库根目录的 `LICENSE` 文件了解本项目的许可证条款。

## Roadmap（示例）

- 短期：完善重复规则编辑 UI、增强 ICS 导入兼容性、增加主题与深色模式支持
- 中期：云同步选项（可选）、共享日历编辑权限、更多第三方集成
- 长期：智能日程推荐、日程冲突自动调度

---

感谢使用 DayMate！如需演示或定制化功能，欢迎在 Issue 中留言。
