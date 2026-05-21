---
name: ai-dialogue-system-design
overview: 参考ex-skill项目的设计模式，为milk项目设计一个模块化的AI对话系统，包括对话式信息录入、人格分析、关系记忆分析和进化修正机制。
design:
  architecture:
    framework: html
  styleKeywords:
    - 温暖
    - 简约
    - 渐进式
    - 情感化
    - 模块化
  fontSystem:
    fontFamily: Noto-Serif-SC
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 18px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#FF6B6B"
      - "#4ECDC4"
      - "#45B7D1"
    background:
      - "#FFFFFF"
      - "#F8F9FA"
      - "#F0F2F5"
    text:
      - "#333333"
      - "#666666"
      - "#999999"
    functional:
      - "#28A745"
      - "#DC3545"
      - "#FFC107"
      - "#17A2B8"
todos:
  - id: setup-directory-structure
    content: 创建prompts/、memory/、persona/、skills/目录结构
    status: completed
  - id: create-persona-manager
    content: 创建persona-manager.js模块，实现5层人格结构数据管理
    status: completed
  - id: create-memory-manager
    content: 创建memory-manager.js模块，实现8个维度关系记忆管理
    status: completed
  - id: create-prompt-templates
    content: 创建intake.md、persona-analyzer.md、memory-analyzer.md、skill-builder.md模板
    status: completed
  - id: create-conversation-intake
    content: 创建conversation-intake.js模块，实现对话式信息录入流程
    status: completed
    dependencies:
      - create-prompt-templates
  - id: create-ai-analyzer
    content: 创建ai-analyzer.js模块，实现AI分析功能
    status: completed
    dependencies:
      - create-persona-manager
      - create-memory-manager
      - create-prompt-templates
  - id: create-skill-builder
    content: 创建skill-builder.js模块，实现Skill构建功能
    status: completed
    dependencies:
      - create-ai-analyzer
  - id: extend-ai-service
    content: 扩展ai-service.js，支持结构化人格和记忆数据
    status: completed
    dependencies:
      - create-skill-builder
  - id: add-features-entry
    content: 在features.js中添加AI对话管理功能入口
    status: completed
    dependencies:
      - create-conversation-intake
      - extend-ai-service
  - id: test-integration
    content: 测试AI对话功能集成效果
    status: completed
    dependencies:
      - add-features-entry
---

## 产品概述

参考ex-skill项目的设计模式，为milk聊天应用的AI对话功能进行模块化设计。将现有的简单AI对话功能升级为具有人格分析、关系记忆和进化修正能力的智能对话系统。

## 核心功能

- 对话式信息录入：通过友好的对话流程收集用户关于聊天对象的信息
- 人格分析系统：从聊天记录中提取5层人格结构（硬规则、身份、说话风格、情感模式、关系行为）
- 关系记忆系统：提取8个维度的关系记忆（时间线、日常模式、共同经历、饮食偏好、兴趣爱好、争吵模式、甜蜜瞬间、分手相关）
- 进化与修正机制：支持增量学习和对话纠正，持续优化AI对话质量
- 模块化文件结构：创建类似ex-skill的prompts/、tools/、memory/、persona/目录结构
- 与现有AI服务集成：扩展ai-service.js以支持结构化人格和记忆数据

## 技术栈选择

- 前端框架：原生JavaScript（与现有项目保持一致）
- 存储方案：LocalForage + localStorage（复用现有存储架构）
- AI服务：扩展现有ai-service.js模块
- UI组件：自定义模态框和对话式界面

## 实现方案

### 系统架构

采用模块化分层架构，将ex-skill的设计模式适配到milk项目的前端JavaScript环境中：

1. **数据层**：人格数据（persona）和关系记忆数据（memory）的结构化存储
2. **分析层**：从聊天记录中提取人格特征和关系记忆的分析模块
3. **对话层**：对话式信息录入和AI对话生成的Prompt模板
4. **UI层**：对话式信息录入界面、人格预览界面、记忆查看界面

### 模块划分

- **persona-manager.js**：人格数据管理模块，负责5层人格结构的存储、读取、更新
- **memory-manager.js**：关系记忆管理模块，负责8个维度记忆数据的管理
- **conversation-intake.js**：对话式信息录入模块，实现分阶段引导式工作流
- **ai-analyzer.js**：AI分析模块，调用现有AI服务进行人格和记忆分析
- **skill-builder.js**：Skill构建模块，将分析结果整合为可对话的AI Skill
- **prompts/**：Prompt模板目录，存放各种分析和对话模板

### 数据流

用户输入聊天记录 → AI分析提取人格和记忆 → 结构化存储 → 构建系统提示词 → AI对话生成

### 性能考虑

- 使用Web Workers进行耗时的分析任务，避免阻塞UI
- 实现增量更新机制，避免重复分析整个聊天记录
- 使用缓存机制存储分析结果，减少AI API调用

## 实现细节

### 核心目录结构

```
d:/Code/milk-main/
├── js/
│   ├── persona-manager.js      # [NEW] 人格数据管理模块
│   ├── memory-manager.js       # [NEW] 关系记忆管理模块
│   ├── conversation-intake.js  # [NEW] 对话式信息录入模块
│   ├── ai-analyzer.js          # [NEW] AI分析模块
│   ├── skill-builder.js        # [NEW] Skill构建模块
│   ├── ai-service.js           # [MODIFY] 扩展AI服务以支持结构化数据
│   └── features.js             # [MODIFY] 添加AI对话管理功能入口
├── prompts/                    # [NEW] Prompt模板目录
│   ├── intake.md               # 对话式信息录入模板
│   ├── persona-analyzer.md     # 人格分析模板
│   ├── memory-analyzer.md      # 关系记忆分析模板
│   └── skill-builder.md        # Skill构建模板
├── memory/                     # [NEW] 关系记忆数据目录
│   └── {partner-name}/         # 按聊天对象组织记忆数据
│       └── memory.md
├── persona/                    # [NEW] 人格数据目录
│   └── {partner-name}/         # 按聊天对象组织人格数据
│       └── persona.md
└── skills/                     # [NEW] 生成的Skill目录
    └── {partner-name}/         # 按聊天对象组织Skill
        ├── SKILL.md
        ├── memory.md
        ├── persona.md
        └── meta.json
```

## 设计风格

采用现代简约设计风格，与milk应用现有的温馨、情感化设计保持一致。设计重点在于创建友好的对话式交互体验，让用户能够轻松地录入信息、查看分析结果和管理AI对话。

### 设计原则

1. **渐进式引导**：通过分步骤的对话流程降低用户输入压力
2. **可视化反馈**：使用进度条、状态指示器等元素提供清晰的反馈
3. **情感化设计**：使用温暖的色彩和柔和的动画营造舒适的交互氛围
4. **模块化布局**：将复杂功能拆分为独立的模块，便于用户理解和使用

### 页面规划

1. **信息录入页面**：分阶段引导用户输入聊天对象的基本信息
2. **聊天记录导入页面**：支持多种格式的聊天记录导入和解析
3. **人格分析预览页面**：展示从聊天记录中提取的人格特征
4. **关系记忆预览页面**：展示提取的关系记忆和共同经历
5. **AI对话测试页面**：测试生成的AI对话效果
6. **Skill管理页面**：管理已生成的AI Skill

## Agent Extensions

### Skill

- **skill-creator**
- Purpose: 创建和更新AI对话技能，扩展CodeBuddy的能力
- Expected outcome: 生成结构化的AI对话技能文件，包括SKILL.md、persona.md、memory.md等

### SubAgent

- **code-explorer**
- Purpose: 搜索和探索milk项目的代码库，了解现有架构和模式
- Expected outcome: 提供准确的代码位置和现有实现模式参考