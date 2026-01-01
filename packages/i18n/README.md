# i18n Package

DayMate 的国际化支持包。

## 支持的语言

- 简体中文 (zh-CN)
- 繁体中文 (zh-TW)
- 英文 (en)

## 使用方法

### 安装

```bash
pnpm install
```

### 在 React Native 中使用

```typescript
import { initI18n, t, changeLanguage } from '@daymate/i18n';

// 初始化（应用启动时调用一次）
initI18n('zh-CN');

// 使用翻译
const title = t('event.addEvent'); // "添加日程"

// 带参数的翻译
const eventsOnDate = t('event.eventsOnDate', { date: '2024-01-01' });

// 切换语言
changeLanguage('en');
```

### 翻译键结构

```
common.*          - 通用文本（取消、保存、删除等）
calendar.*        - 日历相关（月、周、日等）
event.*           - 日程相关（标题、时间等）
priority.*        - 优先级（高、中、低）
placeholder.*     - 输入框提示文本
validation.*      - 表单验证错误信息
error.*           - 错误信息
success.*         - 成功提示
importExport.*    - 导入导出相关
reminder.*        - 提醒相关
lunar.*           - 农历相关
```

## 管理翻译

项目根目录下提供了管理工具：

```bash
# 检查翻译完整性
node scripts/manage-i18n.js check

# 列出所有翻译键
node scripts/manage-i18n.js list

# 显示统计信息
node scripts/manage-i18n.js stats
```

## 添加新翻译

1. 在 `src/locales/zh-CN.json` 中添加新的键值对
2. 在其他语言文件中添加对应的翻译
3. 运行 `node scripts/manage-i18n.js check` 检查完整性
4. 重新构建：`pnpm build`

## 构建

```bash
pnpm build
```
