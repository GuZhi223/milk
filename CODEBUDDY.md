# CODEBUDDY.md
This file provides guidance to CodeBuddy when working with code in this repository.

## Common Commands

### Run the Application
This is a pure frontend project. Open `index.html` directly in a browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if http-server is installed)
npx http-server -p 8000
```
Then navigate to `http://localhost:8000` in your browser.

### Run Tests
Open `test-ai-dialogue.html` in a browser to run integration tests for the AI dialogue system.

### Build & Lint
No build or linting tools are configured. The project uses vanilla JavaScript without bundlers.

## Code Architecture

### Project Overview
"传讯" (ChuanXun) is a web-based AI dialogue system for character role‑playing. It runs entirely in the browser, storing data locally via `localforage` and `localStorage`. The UI is built with vanilla HTML, CSS, and JavaScript; no frameworks or bundlers are used.

### Module Structure
All JavaScript lives in `js/` and is loaded via `<script>` tags in `index.html`. The load order matters because modules depend on global variables defined earlier.

#### Core Modules
- **`config.js`** – Application constants, default data structures, and UI text (e.g., welcome messages, tarot cards). Defines the `APP_PREFIX` used for all localStorage keys.
- **`state.js`** – Declares all mutable application state variables (messages, settings, UI flags) and a `DOMElements` object caching references to frequently accessed DOM nodes.
- **`core.js`** – Central business logic: data loading/saving (with debounced persistence), message rendering, session management, history pagination, and the emergency backup/recovery system.
- **`app.js`** – Entry point called on `DOMContentLoaded`. Orchestrates initialization: loads data, sets up event listeners, starts the welcome animation, and registers visibility‑change handlers for auto‑save.

#### AI Integration
- **`ai-service.js`** – Encapsulates calls to OpenAI‑compatible APIs. Supports streaming (SSE) and non‑streaming responses. Contains preset configurations for DeepSeek, Mimo (MiniMax), and GLM (Zhipu). Builds context messages from recent chat history and a system prompt.
- **`ai-analyzer.js`** – Uses the AI service to analyze chat transcripts and extract structured data (persona traits, relationship memories).
- **`conversation-intake.js`** – Implements a conversational onboarding flow that collects persona and memory data through guided dialogue.
- **`skill-builder.js`** – Generates AI dialogue “skills” by combining persona, memory, and prompt templates into a runnable configuration.

#### Data Management
- **`persona-manager.js`** – CRUD operations for persona data (identity, speaking style, emotional patterns). Reads/writes Markdown files under `persona/`.
- **`memory-manager.js`** – CRUD operations for relationship memory data (timeline, shared experiences, preferences). Reads/writes Markdown files under `memory/`.
- **`backup-engine.js`** – Handles full‑app and chat‑only backups using JSZip. Provides import/export via JSON files.
- **`data.js`** – Implements the data‑management modal UI (storage stats, backup/restore buttons, danger‑zone actions).

#### UI & Features
- **`features.js`** – Miscellaneous UI features (custom replies, poke actions, status groups, anniversary tracking, theme management).
- **`listeners.js`** – Binds DOM event listeners for chat input, message actions, modals, and keyboard shortcuts.
- **`onboarding.js`** – First‑run tutorial and disclaimer flow.
- **`games.js`** – Mini‑games (coin toss, tarot, fortune) embedded in the chat interface.
- **`utils.js`** – Pure utility functions (date formatting, image optimization, notification display, debounce/throttle).

### Data Directories
- **`memory/`** – Stores relationship memory Markdown files organized by partner name.
- **`persona/`** – Stores persona trait Markdown files organized by partner name.
- **`prompts/`** – Contains Markdown templates used by the AI analyzer and skill builder.
- **`skills/`** – Stores generated dialogue skills (Markdown + JSON) per partner.

### Key Patterns
1. **Global State** – The app uses a handful of global variables (`messages`, `settings`, `sessionList`, etc.) declared in `state.js`. Most modules read/write these directly.
2. **Debounced Persistence** – `core.js` implements `throttledSaveData()` to batch writes to `localforage`, reducing I/O overhead.
3. **Emergency Backup** – Critical data is periodically snapshot‑ed to `localStorage` as `BACKUP_V1_critical`. On visibility change or page hide, the app attempts recovery if the primary data appears corrupted or missing.
4. **Context Window** – `ai-service.js` limits the context sent to the AI to the most recent `aiMaxContextMessages` (default 20) messages, prepended with a system prompt built from persona and user names.
5. **Modular UI** – Each modal (settings, data, anniversary, etc.) is defined in a separate file or section, injecting its HTML into the DOM on initialization.

### Testing
The `test-ai-dialogue.html` file runs a browser‑based integration test suite that:
1. Verifies all core modules (`PersonaManager`, `MemoryManager`, `ConversationIntake`, `AIAnalyzer`, `SkillBuilder`) load correctly.
2. Tests creating persona, memory, and skill data.
3. Tests system‑prompt generation.
4. Tests the conversational intake flow.

To add new tests, append test functions to the `<script>` block in `test-ai-dialogue.html` and register them in `testAll()`.

## Optimization Notes (参考ex-skill项目)

### 优化方向
参考了 [ex-skill](https://github.com/therealXiaomanChu/ex-skill) 项目，对AI辅助创建对话伙伴功能进行了以下优化：

1. **丰富标签系统**：增加了爱的语言、星座、MBTI、性格标签等维度
2. **实现对话纠正机制**：用户可以纠正AI的表现，系统会记住纠正内容
3. **支持增量记忆追加**：后续可补充更多记忆和人格信息

### 五层人格结构
参考ex-skill项目的五层结构，将人格数据组织为：
- **Layer 0：硬规则** - 不可违背的核心特征
- **Layer 1：身份锚定** - 基本信息和关系定位
- **Layer 2：说话风格** - 语言习惯和表达方式
- **Layer 3：情感模式** - 情绪反应模式和依恋类型
- **Layer 4：关系行为** - 互动模式和边界感

### 标签翻译表
将模糊的性格标签翻译为具体的行为规则：
- **话痨** → 消息密度高，经常连发多条，话题跳跃快
- **冷暴力** → 生气时沉默不语，已读不回，需要对方主动破冰
- **粘人** → 高频联系，时刻想知道对方在干嘛
- **嘴硬心软** → 说话语气硬，但行为上会默默关心

### 修改文件清单
1. **`js/persona-manager.js`** - 扩展标签常量定义和persona_tags字段
2. **`js/skill-builder.js`** - 实现对话纠正机制和标签翻译表
3. **`js/memory-manager.js`** - 实现增量记忆追加功能
4. **`js/ai-analyzer.js`** - 更新分析提示词，参考ex-skill的五层结构
5. **`js/conversation-intake.js`** - 扩展录入界面，增加标签收集步骤
6. **`js/features.js`** - 更新AI分析性格印象的提示词，参考五层结构
7. **`test-ai-dialogue.html`** - 添加新的测试用例

### 系统提示词生成
`generateSystemPrompt` 函数现在：
1. 遵循五层结构组织内容
2. 将标签翻译为具体行为规则
3. 包含对话纠正记录（优先级最高）
4. 提供更自然的对话指令

### Ex-Skill提示词开关
在设置界面中添加了"Ex-Skill 智能提示词"开关：
- **功能**：启用后将使用五层人格结构和标签翻译表生成提示词
- **效果**：禁用原有的"角色设定"输入框，系统自动使用Ex-Skill风格的提示词
- **设置项**：`settings.useExSkillPrompt`（布尔值）
- **UI提示**：启用时显示提示信息，说明原有输入框被禁用

### 导入Ex-Skill功能
在对话伙伴管理界面添加了"导入Skill"按钮：
- **功能**：导入ex-skill格式的JSON文件
- **支持格式**：包含meta对象的JSON文件，包含name、profile、impression等字段
- **导入内容**：自动转换为项目所需的persona和memory数据结构
- **测试文件**：`test-ex-skill.json`（郑惠欣的skill数据）