# Skills 目录

此目录存放生成的AI对话Skill，按聊天对象组织。

## 目录结构

```
skills/
├── {partner-name}/          # 按聊天对象名称组织
│   ├── SKILL.md            # Skill入口文件
│   ├── memory.md           # 关系记忆数据
│   ├── persona.md          # 人格特征数据
│   ├── meta.json           # 结构化元数据
│   └── versions/           # 历史版本
│       ├── memory_v1.md
│       └── persona_v1.md
└── README.md
```

## 文件说明

- **SKILL.md** - Skill的入口文件，包含运行规则和对话逻辑
- **memory.md** - 从聊天记录中提取的关系记忆
- **persona.md** - 从聊天记录中提取的人格特征
- **meta.json** - 结构化元数据（版本、时间戳、标签等）

## 使用方式

由skill-builder.js模块生成，用于AI对话系统的运行。