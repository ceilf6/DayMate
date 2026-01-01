# DayMate 国际化 - 快速开始

本项目已完成国际化基础设施搭建，支持**简体中文**、**繁体中文**和**英文**。

## 📦 已创建的文件

### 核心包
- `packages/i18n/` - 国际化包
  - `src/locales/zh-CN.json` - 简体中文翻译（已收集所有现有文本）
  - `src/locales/zh-TW.json` - 繁体中文翻译
  - `src/locales/en.json` - 英文翻译
  - `src/index.ts` - 主入口文件

### React Native 集成
- `apps/rn-calendar/src/services/i18nService.ts` - i18n React Hook
- `apps/rn-calendar/src/components/LanguageSelector.tsx` - 语言选择器组件
- `apps/rn-calendar/App.i18n-example.tsx` - App.tsx 集成示例

### 工具和文档
- `scripts/manage-i18n.js` - 翻译管理工具
- `scripts/setup-i18n.sh` - i18n 包安装脚本
- `docs/I18N_GUIDE.md` - 详细使用指南

## 🚀 开始使用

### 1. 安装依赖

```bash
# 项目根目录
pnpm install

# 或使用安装脚本
bash scripts/setup-i18n.sh
```

### 2. 构建 i18n 包

```bash
pnpm build:i18n
```

### 3. 检查翻译完整性

```bash
pnpm i18n:check
```

## 📝 在代码中使用

### 基本用法

```tsx
import { useI18n } from '../services/i18nService';

function MyComponent() {
  const { t } = useI18n();
  
  return (
    <View>
      <Text>{t('event.addEvent')}</Text>
      <Text>{t('event.eventsOnDate', { date: '2024-01-01' })}</Text>
    </View>
  );
}
```

### 集成到 App.tsx

参考 `apps/rn-calendar/App.i18n-example.tsx` 文件，主要改动：

```tsx
import { useI18n } from './src/services/i18nService';

function App() {
  const { isReady } = useI18n();
  
  if (!isReady) {
    return <LoadingScreen />;
  }
  
  return <NavigationContainer>...</NavigationContainer>;
}
```

### 添加语言选择器

```tsx
import { LanguageSelector } from '../components/LanguageSelector';

function SettingsScreen() {
  return (
    <View>
      <LanguageSelector />
    </View>
  );
}
```

## 🔧 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm build:i18n` | 构建 i18n 包 |
| `pnpm i18n:check` | 检查翻译完整性 |
| `pnpm i18n:list` | 列出所有翻译键 |
| `pnpm i18n:stats` | 显示统计信息 |

## 📋 已收集的文本

所有现有的中文文本已经提取并组织到翻译文件中，包括：

### 通用文本
- 取消、保存、删除、关闭等按钮文本

### 日历相关
- 月、周、日视图切换
- 上一天、下一天导航

### 日程管理
- 添加日程、日程详情
- 标题、开始时间、结束时间、备注
- 提醒、优先级

### 表单验证
- 所有错误提示信息
- 成功提示信息

### 导入导出
- 导入/导出界面所有文本

## 📖 翻译键结构

```
common.*          通用（取消、保存等）
calendar.*        日历
event.*           日程
priority.*        优先级
placeholder.*     输入提示
validation.*      验证错误
error.*           错误信息
success.*         成功提示
importExport.*    导入导出
reminder.*        提醒
lunar.*           农历
```

## 🌟 特性

✅ 自动检测系统语言  
✅ 记住用户语言选择  
✅ 支持参数化翻译（如日期、数字）  
✅ 翻译完整性检查工具  
✅ TypeScript 类型支持  
✅ 热更新支持（开发模式）

## 📚 更多信息

详细使用指南请查看 [I18N_GUIDE.md](./I18N_GUIDE.md)

## ⚠️ 注意事项

1. **农历功能**：农历相关的节日、节气等文本暂未完全国际化，因为它们主要针对中文用户
2. **Android 应用**：Android 原生部分的国际化需要单独处理（使用 Android strings.xml）
3. **第三方库**：react-native-calendars 等库的内置文本需要通过库的配置进行国际化

## 🎯 下一步

1. 运行 `pnpm install` 安装依赖
2. 运行 `pnpm build:i18n` 构建 i18n 包
3. 按照 [I18N_GUIDE.md](./I18N_GUIDE.md) 开始迁移现有代码
4. 测试所有三种语言的显示效果

## 🤝 贡献翻译

如果发现翻译问题：
1. 修改对应的 JSON 文件（zh-CN.json, zh-TW.json, en.json）
2. 运行 `pnpm i18n:check` 验证
3. 运行 `pnpm build:i18n` 重新构建
