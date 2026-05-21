---
name: fix-ai-dialogue-skill
overview: 修复AI对话系统中Skill提示词未被使用、记忆重复、冗余代码等问题。
todos:
  - id: explore-impact
    content: 使用 [subagent:code-explorer] 确认修改影响范围
    status: completed
  - id: modify-core-js
    content: 修改js/core.js第1690行，获取当前Skill并调用buildContextMessagesWithSkill
    status: completed
    dependencies:
      - explore-impact
  - id: cleanup-features-js
    content: 移除js/features.js中冗余的getSystemPrompt方法
    status: completed
    dependencies:
      - modify-core-js
  - id: add-ai-service-comments
    content: 为js/ai-service.js中buildContextMessagesWithMemory添加用途注释
    status: completed
    dependencies:
      - modify-core-js
  - id: test-skill-integration
    content: 测试Skill系统提示词是否正确生效
    status: completed
    dependencies:
      - cleanup-features-js
      - add-ai-service-comments
---

## 产品概述

修复AI对话系统的业务逻辑问题，确保Skill系统提示词被正确使用，避免记忆重复，清理冗余代码，修复引导创建按钮无响应问题。

## 核心功能

- 启用Skill系统提示词：修改core.js调用buildContextMessagesWithSkill替代buildContextMessages
- 解决记忆重复：统一记忆信息来源，避免generateSystemPrompt和buildContextMessagesWithMemory重复包含记忆
- 清理冗余代码：移除未使用的getSystemPrompt方法和未调用的buildContextMessagesWithMemory
- 明确优先级：Skill提示词 > 用户自定义提示词 > 默认提示词
- 修复引导创建按钮：添加缺失的容器元素，使对话式信息录入功能正常工作

## 技术栈

- 项目类型：前端JavaScript应用（milk聊天应用）
- 代码风格：原生JavaScript，无框架依赖
- 存储方案：localStorage + localforage

## 问题分析

### 问题1：Skill系统提示词未被使用

**位置**：`js/core.js` 第1690行

```javascript
// 当前代码
var contextMsgs = AIService.buildContextMessages(settings, messages);
// 应改为
var contextMsgs = AIService.buildContextMessagesWithSkill(settings, messages, skillName);
```

**原因**：`AIService`模块已导出`buildContextMessagesWithSkill`和`buildContextMessagesWithMemory`，但`core.js`从未调用。

### 问题2：记忆重复

**位置**：

- `js/skill-builder.js` 第286-317行：`generateSystemPrompt`已包含记忆
- `js/ai-service.js` 第407-440行：`buildContextMessagesWithMemory`还会追加记忆

**解决方案**：使用`buildContextMessagesWithSkill`（不含记忆追加），因为`generateSystemPrompt`已包含完整记忆。

### 问题3：冗余代码

**位置**：`js/features.js` 第2063-2069行

- `AIDialogueManager.getSystemPrompt()`从未被调用，可安全移除
- `buildContextMessagesWithMemory`未被调用，可标记为备用或移除

### 问题4：引导创建按钮无响应

**位置**：

- `js/features.js` 第1992行：`window.ConversationIntake.start('ai-intake-container', callback)`
- `js/conversation-intake.js` 第346-351行：`startIntake`函数查找容器
- `index.html`：缺少id为`ai-intake-container`的容器元素

**原因**：

1. `features.js`调用`ConversationIntake.start('ai-intake-container', callback)`
2. `startIntake`函数尝试`document.getElementById('ai-intake-container')`
3. HTML中不存在该容器，函数直接return，按钮无任何响应

**解决方案**：在`ai-dialogue-modal`中添加`ai-intake-container`容器元素

## 修复方案

### 核心修改

1. **修改`core.js`**：获取当前激活的Skill名称，调用`buildContextMessagesWithSkill`
2. **保留`generateSystemPrompt`**：它已包含完整的人格和记忆信息，无需修改
3. **标记`buildContextMessagesWithMemory`**：保留函数但添加注释说明其用途
4. **移除`getSystemPrompt`**：清理冗余代码
5. **修复引导创建按钮**：在HTML中添加`ai-intake-container`容器

### 优先级逻辑

```
如果有Skill → 使用Skill的generateSystemPrompt（包含人格+记忆）
如果没有Skill → 使用settings.aiSystemPrompt
如果没有自定义 → 使用默认提示词
```

## 实现细节

### 核心文件修改

- `js/core.js` 第1690行：获取Skill名称并调用带Skill版本
- `js/features.js` 第2063-2069行：移除getSystemPrompt方法
- `js/ai-service.js` 第407-440行：添加注释说明buildContextMessagesWithMemory用途
- `index.html` 第897行附近：在`ai-dialogue-modal`中添加`ai-intake-container`容器元素

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 探索代码库，确认修改影响范围和现有模式
- Expected outcome: 提供准确的文件位置和依赖关系分析