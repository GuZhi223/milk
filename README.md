# 传讯 (Milk)

> 从固定话术到 AI 驱动的数字分身对话系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于 [aielin17/milk](https://github.com/aielin17/milk) 二次开发，将原项目的预置固定话术随机回复升级为 **AI 驱动的个性化实时对话引擎**，引入 ex-skill 五层人格架构，打造有温度、会学习的数字分身。

---

## 为什么有这个项目

原项目 aielin17/milk 的角色对话采用**预置固定话术随机选取**的方式——同一个问题只能从有限模板中随机选一个回复，本质上是一个"随机语录播放器"，无法还原特定个体的说话风格、情感模式和关系行为。

本项目使用 AI Agent 辅助开发，彻底重构对话引擎：

| | 原项目 | 传讯 (Milk) |
|---|---|---|
| 回复方式 | 固定话术随机选取 | AI 实时生成 |
| 人格深度 | 无 | 五层人格结构 |
| 记忆能力 | 无 | 增量记忆 + 纠正反馈 |
| 角色创建 | 手动填写 | AI 分析聊天记录自动生成 |

---

## 核心逻辑流（长链推理）

整个系统运行依赖一条完整的 **6 步推理闭环**：

```
聊天记录导入 → AI 语义分析 → Persona 自动生成 → 上下文检索 → AI 实时回复 → 用户纠正反馈
      ↑                                                                              |
      └────────────────────────── 增量记忆写入，持续优化 ─────────────────────────────┘
```

1. **聊天记录导入** — 用户上传微信/QQ 等原始对话数据
2. **AI 语义分析** — AI 分析器逐条解析，提取性格特征、常用措辞、情绪模式、关系线索
3. **Persona 自动生成** — 按 ex-skill 五层人格架构自动生成 persona 文件
4. **上下文检索** — 记忆管理器从历史记忆中检索相关片段，注入当前 prompt
5. **AI 实时生成回复** — 结合 persona + 记忆 + 当前语境，生成符合目标人物风格的回复
6. **用户纠正反馈** — "ta 不会这样说" → 语义比对 → 差异定位 → 增量记忆写入 → 下次自动修正

---

## 功能特性

- **AI 角色对话** — 支持 DeepSeek、MiMo (MiniMax)、GLM (智谱) 等 OpenAI 兼容 API
- **流式响应** — 实时打字效果，支持 SSE 流式输出
- **五层人格结构** — 硬规则 → 身份锚定 → 说话风格 → 情感模式 → 关系行为
- **关系记忆** — 记录共同经历、时间线、偏好，让对话有深度
- **对话纠正** — 实时纠正 AI 表现，系统自动更新记忆持续优化
- **聊天记录导入** — 导入微信等聊天记录，AI 自动分析生成 persona
- **标签系统** — 爱的语言、星座、MBTI、性格标签等多维度
- **Ex-Skill 智能提示词** — 参考 [ex-skill](https://github.com/therealXiaomanChu/ex-skill) 的五层人格结构
- **数据备份** — 完整备份和聊天记录备份，支持 JSON 导入导出
- **迷你游戏** — 硬币翻转、塔罗牌、运势等
- **主题切换** — 自定义主题和深色模式
- **纪念日追踪** — 记录重要日期和里程碑

---

## 多 Agent 协作开发

本项目使用多个 AI Agent 分工协作完成，充分发挥各模型优势：

| Agent | 分工 | 优势 |
|---|---|---|
| **GPT** | 画布与 UI 交互设计 | Canvas 渲染、动画逻辑、视觉布局 |
| **Claude** | 架构设计与核心代码生成 | 结构化思维、五层人格架构拆分 |
| **Gemini** | 多模态 UI 校验与跨端适配 | 移动端/桌面端一致性检查 |
| **MiMo** | 最终整合与运行底座 | 作为完整项目交付和运行平台 |

UI 风格融合了 Claude 的简洁克制和 Gemini 的卡片化信息呈现。

---

## 技术栈

- **前端**：原生 HTML + CSS + JavaScript（无框架）
- **数据存储**：localforage + localStorage（数据完全本地，无需后端）
- **备份**：JSZip
- **AI API**：OpenAI 兼容接口（DeepSeek / MiMo / GLM）

---

## 快速开始

这是一个纯前端项目，直接在浏览器中打开 `index.html` 即可使用。

或使用本地服务器：

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

然后访问 `http://localhost:8000`。

### 运行测试

在浏览器中打开 `test-ai-dialogue.html` 运行 AI 对话系统集成测试。

---

## 项目结构

```
milk/
├── index.html                  # 主页面入口
├── css/
│   └── styles.css              # 样式文件
├── js/
│   ├── config.js               # 应用常量和默认配置
│   ├── state.js                # 全局状态变量
│   ├── core.js                 # 核心业务逻辑
│   ├── app.js                  # 应用入口和初始化
│   ├── ai-service.js           # AI API 调用封装（SSE 流式）
│   ├── ai-analyzer.js          # AI 分析器（提取人格和记忆）
│   ├── conversation-intake.js  # 对话式引导录入
│   ├── skill-builder.js        # 技能构建器
│   ├── persona-manager.js      # 人格数据管理
│   ├── memory-manager.js       # 关系记忆管理
│   ├── backup-engine.js        # 备份引擎
│   ├── data.js                 # 数据管理界面
│   ├── features.js             # UI 功能模块
│   ├── listeners.js            # 事件监听器
│   ├── onboarding.js           # 首次使用引导
│   ├── games.js                # 迷你游戏
│   └── utils.js                # 工具函数
├── memory/                     # 关系记忆数据
├── persona/                    # 人格特征数据
├── prompts/                    # AI 提示词模板
├── skills/                     # 生成的对话技能
├── test-ai-dialogue.html       # 集成测试
└── test-ex-skill.json          # 示例 Skill 数据
```

---

## 五层人格结构

参考 [ex-skill](https://github.com/therealXiaomanChu/ex-skill) 项目设计：

| 层级 | 名称 | 说明 |
|:---:|------|------|
| Layer 0 | 硬规则 | 不可违背的核心特征 |
| Layer 1 | 身份锚定 | 基本信息和关系定位 |
| Layer 2 | 说话风格 | 语言习惯和表达方式 |
| Layer 3 | 情感模式 | 情绪反应模式和依恋类型 |
| Layer 4 | 关系行为 | 互动模式和边界感 |

### 标签翻译表

将模糊的性格标签翻译为具体的行为规则：

| 标签 | 行为规则 |
|------|----------|
| 话痨 | 消息密度高，经常连发多条，话题跳跃快 |
| 冷暴力 | 生气时沉默不语，已读不回，需要对方主动破冰 |
| 粘人 | 高频联系，时刻想知道对方在干嘛 |
| 嘴硬心软 | 说话语气硬，但行为上会默默关心 |

---

## 相关链接

- 原项目：[aielin17/milk](https://github.com/aielin17/milk)
- 人格框架参考：[ex-skill](https://github.com/therealXiaomanChu/ex-skill)
- 数字分身方案参考：[WeClone-Skills](https://github.com/xming521/WeClone-Skills)

---

## 许可证

MIT License © 2025

本项目 Fork 自 [aielin17/milk](https://github.com/aielin17/milk)，在此基础上进行了 AI 对话系统的二次开发。
