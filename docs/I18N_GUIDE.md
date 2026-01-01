# DayMate 国际化集成指南

## 概述

本项目已集成国际化支持，支持简体中文、繁体中文和英文三种语言。

## 文件结构

```
packages/i18n/                  # 国际化包
  ├── src/
  │   ├── locales/
  │   │   ├── zh-CN.json       # 简体中文翻译
  │   │   ├── zh-TW.json       # 繁体中文翻译
  │   │   └── en.json          # 英文翻译
  │   └── index.ts             # 主入口
  ├── package.json
  └── README.md

apps/rn-calendar/src/
  ├── services/
  │   └── i18nService.ts       # i18n React Hook
  └── components/
      └── LanguageSelector.tsx  # 语言选择器组件

scripts/
  └── manage-i18n.js           # 翻译管理工具
```

## 使用方法

### 1. 在组件中使用

```tsx
import React from 'react';
import { Text, Button } from 'react-native';
import { useI18n } from '../services/i18nService';

const MyComponent = () => {
  const { t, currentLanguage, changeLanguage } = useI18n();

  return (
    <>
      {/* 简单翻译 */}
      <Text>{t('event.addEvent')}</Text>
      
      {/* 带参数的翻译 */}
      <Text>{t('event.eventsOnDate', { date: '2024-01-01' })}</Text>
      
      {/* 切换语言 */}
      <Button 
        title="切换到英文" 
        onPress={() => changeLanguage('en')} 
      />
      
      {/* 显示当前语言 */}
      <Text>Current: {currentLanguage}</Text>
    </>
  );
};
```

### 2. 添加语言选择器

在你的设置页面或其他地方添加语言选择器：

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

### 3. 现有代码迁移示例

**迁移前：**
```tsx
<Text>添加日程</Text>
```

**迁移后：**
```tsx
const { t } = useI18n();
<Text>{t('event.addEvent')}</Text>
```

## 翻译键组织

所有翻译键按功能组织：

- `common.*` - 通用文本（取消、保存等）
- `calendar.*` - 日历相关
- `event.*` - 日程相关
- `priority.*` - 优先级
- `placeholder.*` - 输入提示
- `validation.*` - 验证错误
- `error.*` - 错误消息
- `success.*` - 成功消息
- `importExport.*` - 导入导出
- `reminder.*` - 提醒

## 管理翻译

### 检查翻译完整性

```bash
pnpm i18n:check
```

### 列出所有翻译键

```bash
pnpm i18n:list
```

### 显示统计信息

```bash
pnpm i18n:stats
```

## 添加新翻译

1. 在 `packages/i18n/src/locales/zh-CN.json` 中添加键值对
2. 在 `zh-TW.json` 和 `en.json` 中添加对应翻译
3. 运行 `pnpm i18n:check` 验证
4. 运行 `pnpm build:i18n` 重新构建

## 示例翻译

### 简体中文 (zh-CN)
```json
{
  "event": {
    "addEvent": "添加日程",
    "eventsOnDate": "{{date}} 的日程"
  }
}
```

### 繁体中文 (zh-TW)
```json
{
  "event": {
    "addEvent": "新增日程",
    "eventsOnDate": "{{date}} 的日程"
  }
}
```

### 英文 (en)
```json
{
  "event": {
    "addEvent": "Add Event",
    "eventsOnDate": "Events on {{date}}"
  }
}
```

## 自动语言检测

应用启动时会自动检测系统语言：
- 系统语言为中文（中国大陆）→ 简体中文
- 系统语言为中文（台湾/香港）→ 繁体中文
- 其他 → 英文

用户可以手动切换语言，选择会被保存。

## 下一步

现在你可以开始将现有的硬编码文本替换为国际化调用了。建议从以下文件开始：

1. `apps/rn-calendar/src/components/AddEventModal.tsx`
2. `apps/rn-calendar/src/components/EventDetailModal.tsx`
3. `apps/rn-calendar/src/components/ImportExportModal.tsx`
4. `apps/rn-calendar/src/screens/HomeScreen.tsx`
