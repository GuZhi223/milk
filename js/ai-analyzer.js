/**
 * ai-analyzer.js - AI分析模块
 * 实现人格分析和关系记忆分析功能
 */

(function() {
    'use strict';

    /* ── 分析状态 ── */
    var ANALYSIS_STATES = {
        IDLE: 'idle',
        ANALYZING_PERSONA: 'analyzing_persona',
        ANALYZING_MEMORY: 'analyzing_memory',
        COMPLETED: 'completed',
        ERROR: 'error'
    };

    /* ── 当前状态 ── */
    var currentState = ANALYSIS_STATES.IDLE;
    var analysisProgress = 0;
    var analysisResults = {};
    var onProgressCallback = null;
    var onCompleteCallback = null;
    var onErrorCallback = null;

    /* ── 分析配置 ── */
    var ANALYSIS_CONFIG = {
        maxTokens: 4096,
        temperature: 0.7,
        batchSize: 10, // 每批处理的消息数量
        delayBetweenBatches: 1000 // 批次间延迟（毫秒）
    };

    /* ── 状态管理 ── */
    function _setState(newState) {
        currentState = newState;
        if (onProgressCallback) {
            onProgressCallback({
                state: currentState,
                progress: analysisProgress,
                results: analysisResults
            });
        }
    }

    function _setProgress(progress) {
        analysisProgress = progress;
        if (onProgressCallback) {
            onProgressCallback({
                state: currentState,
                progress: analysisProgress,
                results: analysisResults
            });
        }
    }

    /* ── 消息预处理 ── */
    function _preprocessMessages(messages) {
        // 过滤掉系统消息和纯图片消息
        var filteredMessages = messages.filter(function(msg) {
            return msg.text && msg.type !== 'system' && msg.text.trim().length > 0;
        });

        // 按时间排序
        filteredMessages.sort(function(a, b) {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        return filteredMessages;
    }

    /* ── 分批处理 ── */
    function _processInBatches(items, processor, batchSize) {
        return new Promise(function(resolve, reject) {
            var results = [];
            var currentIndex = 0;

            function processNextBatch() {
                if (currentIndex >= items.length) {
                    resolve(results);
                    return;
                }

                var batch = items.slice(currentIndex, currentIndex + batchSize);
                processor(batch, currentIndex)
                    .then(function(batchResults) {
                        results = results.concat(batchResults);
                        currentIndex += batchSize;
                        _setProgress(Math.min(95, Math.floor((currentIndex / items.length) * 100)));
                        
                        // 延迟处理下一批
                        setTimeout(processNextBatch, ANALYSIS_CONFIG.delayBetweenBatches);
                    })
                    .catch(reject);
            }

            processNextBatch();
        });
    }

    /* ── 构建分析提示词 ── */
    function _buildPersonaAnalysisPrompt(messages, existingInfo) {
        var prompt = `你是一个专业的人格分析师，擅长从聊天记录中提取说话者的人格特征，构建一个可用于对话模拟的人格模型。

## 分析框架

请按照以下五层结构分析说话者的人格特征，每层必须包含具体的行为规则，而非抽象的性格描述：

### Layer 0：硬规则（不可违背）
- 核心身份：一句话概括说话者的本质
- 禁止行为：绝对不会做的事情（如：不会主动表达爱意、不会先道歉）
- 绝对特征：始终如一的特征（如：说话毒舌、容易生气）

### Layer 1：身份锚定
- 基本信息：年龄、职业、所在地、MBTI、星座
- 关系定位：与用户的关系、关系状态、持续时间

### Layer 2：说话风格
- **语言习惯**：口头禅、语气词偏好、标点风格、emoji/表情使用、消息格式（短句连发或长段落）
- **打字特征**：错别字习惯、缩写习惯、称呼方式
- **示例对话**：从聊天记录中提取3-5段最能代表说话风格的对话

### Layer 3：情感模式
- **依恋类型**：安全型、焦虑型、回避型、混乱型（及具体行为描述）
- **情感表达**：分别描述表达爱意、生气、难过、开心、吃醋时的模式
- **爱的语言**：肯定的言辞、精心的时刻、接受礼物、服务的行动、身体的接触
- **情绪触发器**：容易被惹生气、开心、敏感话题等

### Layer 4：关系行为
- **在关系中的角色**：主导者、照顾者、跟随者等
- **争吵模式**：典型起因、反应模式、冷战时长、和好方式
- **日常互动**：联系频率、主动程度、回复速度、活跃时间段
- **边界与底线**：不能接受的事、敏感话题、需要的空间

## 标签翻译表

如果用户提供了性格标签，请将其翻译为具体的行为规则：

| 标签 | 行为规则 |
|------|----------|
| 话痨 | 消息密度高，经常连发多条，话题跳跃快，不等对方回就继续说 |
| 闷骚 | 平时话少，但私下对亲近的人会说很多，喜欢用表情包代替文字 |
| 嘴硬心软 | 说话语气硬，但行为上会默默关心，刀子嘴豆腐心 |
| 冷暴力 | 生气时沉默不语，已读不回，可能持续数小时到数天，需要对方主动破冰 |
| 粘人 | 高频联系，时刻想知道对方在干嘛，不喜欢独处，分开就想视频 |
| 独立 | 不喜欢被束缚，需要个人空间，不会时刻查岗，尊重对方自由 |
| 大男/女子主义 | 喜欢主导关系，做决定时比较强势，但也会照顾对方 |
| 顺从型 | 不喜欢冲突，倾向于妥协，容易被说服，需要对方做决定 |
| 浪漫型 | 注重仪式感，喜欢制造惊喜，善于表达爱意，重视纪念日 |
| 务实型 | 不喜欢花哨的东西，更看重实际行动，礼物偏好实用型 |
| 乐观派 | 遇事往好处想，不容易沮丧，喜欢鼓励他人，笑容常挂脸上 |
| 悲观派 | 容易往坏处想，需要更多 reassurance，对关系缺乏安全感 |
| 冒险型 | 喜欢尝试新事物，讨厌一成不变，计划多变，喜欢惊喜 |
| 谨慎型 | 做事前会三思，不喜欢 surprises，需要计划，讨厌风险 |

## 分析方法

1. **识别反复出现的行为模式**：寻找聊天记录中的重复行为
2. **注意绝对性表述**：关注"总是"、"永远"、"绝不"等表述
3. **分析在不同情境下的一致性行为**：观察在压力、开心、生气等不同情境下的表现
4. **从上下文推断关系状态**：通过对话内容判断关系亲密度和阶段
5. **统计语言特征**：分析标点、表情、消息长度等统计特征
6. **从互动模式推断爱的语言和性格标签**：观察如何表达爱意和处理冲突
7. **提取典型对话**：选择最能代表说话风格的对话片段

## 输出格式

请以JSON格式输出分析结果：

\`\`\`json
{
  "hard_rules": {
    "core_identity": "一句话概括（如：一个刀子嘴豆腐心的人）",
    "forbidden_behaviors": ["绝对不会做的事情1", "绝对不会做的事情2"],
    "absolute_traits": ["始终如一的特征1", "始终如一的特征2"]
  },
  "identity": {
    "name": "对方名称",
    "age": "年龄或年龄段",
    "gender": "性别",
    "occupation": "职业",
    "location": "所在地",
    "mbti": "MBTI类型",
    "zodiac": "星座",
    "relationship_to_user": "与用户的关系",
    "relationship_duration": "关系持续时间",
    "relationship_status": "关系状态"
  },
  "speaking_style": {
    "language_habits": ["语言习惯1", "语言习惯2"],
    "punctuation_style": "标点风格描述",
    "emoji_usage": "表情使用习惯",
    "message_length": "消息长度倾向",
    "response_speed": "回复速度倾向",
    "vocabulary_level": "词汇水平",
    "common_phrases": ["常用短语1", "常用短语2"],
    "forbidden_phrases": ["禁止使用的短语"],
    "typing_habits": ["打字习惯1", "打字习惯2"],
    "example_dialogues": [
      {"context": "情境", "quote": "原话"},
      {"context": "情境", "quote": "原话"}
    ]
  },
  "emotional_pattern": {
    "attachment_type": "依恋类型",
    "attachment_behaviors": "具体行为描述",
    "emotional_expressions": {
      "love": "表达爱意的方式",
      "anger": "生气时的表现",
      "happiness": "开心时的表现",
      "sadness": "难过时的表现",
      "jealousy": "吃醋时的表现"
    },
    "emotional_triggers": ["触发点1", "触发点2"],
    "comfort_methods": ["安慰方式1", "安慰方式2"],
    "love_language": "主要爱的语言",
    "love_language_details": "具体表现"
  },
  "relationship_behavior": {
    "role_in_relationship": "在关系中的角色",
    "argument_pattern": {
      "typical_causes": ["典型起因1", "典型起因2"],
      "reaction_pattern": "反应模式",
      "cold_war_duration": "冷战时长",
      "reconciliation_method": "和好方式"
    },
    "daily_interaction": {
      "contact_frequency": "联系频率",
      "initiative_level": "主动程度",
      "response_speed": "回复速度",
      "active_hours": "活跃时间段"
    },
    "boundaries": {
      "unacceptable_things": ["不能接受的事1", "不能接受的事2"],
      "sensitive_topics": ["敏感话题1", "敏感话题2"],
      "needed_space": "需要的个人空间"
    }
  },
  "persona_tags": {
    "love_languages": ["words_of_affirmation", "quality_time"],
    "zodiac": "aries",
    "mbti": "INFP",
    "personality_tags": ["romantic", "clingy"]
  }
}
\`\`\`

## 标签选项说明

- **love_languages** 可选值：words_of_affirmation（肯定的言辞）, quality_time（精心的时刻）, receiving_gifts（接受礼物）, acts_of_service（服务的行动）, physical_touch（身体的接触）
- **zodiac** 可选值：aries（白羊座）, taurus（金牛座）, gemini（双子座）, cancer（巨蟹座）, leo（狮子座）, virgo（处女座）, libra（天秤座）, scorpio（天蝎座）, sagittarius（射手座）, capricorn（摩羯座）, aquarius（水瓶座）, pisces（双鱼座）
- **mbti** 可选值：INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP, ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP
- **personality_tags** 可选值：talkative（话痨）, secretive（闷骚）, tough_love（嘴硬心软）, cold_war（冷暴力）, clingy（粘人）, independent（独立）, dominant（大男/女子主义）, submissive（顺从型）, romantic（浪漫型）, pragmatic（务实型）, optimistic（乐观派）, pessimistic（悲观派）, adventurous（冒险型）, cautious（谨慎型）

## 已有信息

${existingInfo ? '以下是用户提供的基本信息：\n' + JSON.stringify(existingInfo, null, 2) : '暂无额外信息'}

## 聊天记录

以下是需要分析的聊天记录（共${messages.length}条）：

`;

        // 添加聊天记录
        messages.forEach(function(msg, index) {
            var sender = msg.sender === 'user' ? '用户' : '对方';
            var time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
            prompt += `[${index + 1}] ${sender} (${time}): ${msg.text}\n`;
        });

        prompt += '\n请基于以上聊天记录，分析说话者的人格特征。';

        return prompt;
    }

    function _buildMemoryAnalysisPrompt(messages, existingInfo) {
        var prompt = `你是一个专业的关系记忆分析师，擅长从聊天记录中提取关系记忆，构建结构化的记忆知识库。你的目标是提取具体、真实、有时间线的记忆片段，而非抽象概括。

## 提取维度

请从以下8个维度提取关系记忆，每个维度都需要提取具体、有细节的信息：

### 1. 关系时间线
- 认识时间和方式（如何相遇）
- 确定关系的时间
- 关键节点（第一次约会、第一次吵架、第一次旅行、纪念日等）
- 分手时间和原因（如适用）
- 分手后的互动（如有）

### 2. 日常模式
- 联系频率和时间段（早安晚安？深夜聊天？上班摸鱼聊天？）
- 谁主动联系得多？
- 约会频率和偏好（周末见面？工作日午饭？）
- 日常话题分布

### 3. 共同经历
- 一起去过的地方（餐厅、景点、城市）
- 一起做过的事（看电影、打游戏、健身、做饭等）
- 旅行记忆（目的地、时间、亮点）
- Inside jokes / 只有两个人懂的梗
- 难忘事件

### 4. 饮食偏好
- ta爱吃什么 / 不吃什么
- 常去的餐厅
- 做饭习惯（谁做饭？做什么？）
- 约会吃饭的模式

### 5. 兴趣爱好
- ta喜欢的音乐/电影/书/游戏
- ta的日常爱好
- 你们共同的爱好
- ta会主动分享什么内容

### 6. 争吵模式 ⚡
- 常见的吵架原因
- ta吵架时的典型反应（冷暴力？激烈争吵？讲道理？委屈哭？）
- 谁先道歉？怎么和好？
- 冷战持续时间
- 吵架时的经典台词

### 7. 甜蜜瞬间 💕
- 最让你心动的时刻
- ta表达爱意的方式
- 日常小甜蜜（起昵称？买礼物？做饭？接送？）
- 特别的纪念日/仪式感

### 8. 分手相关 💔
- 分手原因（双方视角）
- 最后一次对话
- 分手后的状态
- 未说出口的话

## 分析原则

1. **事实优先**：聊天记录中的事实优先于用户口述（口述可能被美化或恶化）
2. **保留真实**：同时保留好的记忆和不好的记忆，不做美化
3. **提取模式**：注意提取"反复出现"的模式，而不是一次性事件
4. **时间精确**：时间信息尽量精确（从聊天记录时间戳推断）
5. **具体细节**：提取具体的对话、地点、事件，而非抽象概括

## 输出格式

请以JSON格式输出分析结果：

\`\`\`json
{
  "timeline": {
    "first_met": {
      "time": "YYYY-MM-DD 或大致时间",
      "how": "如何认识的"
    },
    "relationship_start": "YYYY-MM-DD 或大致时间",
    "important_milestones": [
      {"date": "YYYY-MM-DD", "event": "事件描述", "details": "具体细节"}
    ],
    "breakup": {
      "date": "YYYY-MM-DD 或 null",
      "reason": "分手原因",
      "initiated_by": "谁提的"
    }
  },
  "daily_patterns": {
    "contact_frequency": "联系频率描述",
    "initiator": "谁更主动",
    "active_hours": "活跃时间段",
    "greeting_habits": "早安晚安习惯",
    "date_frequency": "约会频率",
    "date_preferences": "约会偏好"
  },
  "shared_experiences": {
    "places_visited": [
      {"place": "地点", "memory": "相关记忆"}
    ],
    "activities_done": [
      {"activity": "活动", "frequency": "频率", "details": "细节"}
    ],
    "trips_together": [
      {"destination": "目的地", "time": "时间", "highlights": ["亮点1", "亮点2"]}
    ],
    "inside_jokes": [
      {"joke": "梗的内容", "origin": "来源"}
    ]
  },
  "food_preferences": {
    "loves": ["喜欢的食物1", "食物2"],
    "dislikes": ["不喜欢的食物"],
    "favorite_restaurants": ["餐厅1"],
    "dining_habits": ["习惯1"],
    "cooking": "做饭习惯描述"
  },
  "interests": {
    "their_hobbies": ["爱好1", "爱好2"],
    "shared_hobbies": ["共同爱好1"],
    "their_favorites": {
      "music": ["音乐1"],
      "movies": ["电影1"],
      "books": ["书籍1"],
      "games": ["游戏1"]
    },
    "sharing_habits": "ta会主动分享什么"
  },
  "argument_patterns": {
    "common_causes": ["原因1", "原因2"],
    "their_reaction": "ta吵架时的典型反应",
    "reconciliation": {
      "who_apologizes": "谁先道歉",
      "how_make_up": "怎么和好",
      "cold_war_duration": "冷战时长"
    },
    "classic_quotes": ["吵架时的经典台词1", "台词2"]
  },
  "sweet_moments": {
    "heartwarming_times": [
      {"time": "时间或情境", "what_happened": "发生了什么", "why_memorable": "为什么难忘"}
    ],
    "love_expressions": ["ta表达爱意的方式1", "方式2"],
    "daily_gestures": ["日常小甜蜜1", "小甜蜜2"],
    "special_occasions": ["特别的纪念日/仪式感"]
  },
  "breakup_related": {
    "reason": "分手原因",
    "last_conversation": "最后一次对话内容",
    "unsaid_words": ["未说出口的话1", "话2"],
    "lessons_learned": ["教训1", "教训2"],
    "current_status": "当前关系状态"
  }
}
\`\`\`

## 已有信息

${existingInfo ? '以下是用户提供的基本信息：\n' + JSON.stringify(existingInfo, null, 2) : '暂无额外信息'}

## 聊天记录

以下是需要分析的聊天记录（共${messages.length}条）：

`;

        // 添加聊天记录
        messages.forEach(function(msg, index) {
            var sender = msg.sender === 'user' ? '用户' : '对方';
            var time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
            prompt += `[${index + 1}] ${sender} (${time}): ${msg.text}\n`;
        });

        prompt += '\n请基于以上聊天记录，提取关系记忆。';

        return prompt;
    }

    /* ── 调用AI分析 ── */
    function _callAIForAnalysis(prompt, callback) {
        // 检查AIService是否可用
        if (!window.AIService) {
            callback('AI服务未初始化', null);
            return;
        }

        // 获取AI设置
        var settings = window.settings || {};
        if (!settings.aiApiUrl || !settings.aiApiKey || !settings.aiModel) {
            callback('AI配置不完整，请先配置AI服务', null);
            return;
        }

        // 构建消息
        var messages = [
            { role: 'system', content: '你是一个专业的人格分析师，擅长从聊天记录中提取人格特征，构建可用于对话模拟的人格模型。你遵循五层结构（硬规则、身份、说话风格、情感模式、关系行为）进行分析，并能将模糊的性格标签翻译为具体的行为规则。请严格按照要求的JSON格式输出分析结果，确保每条规则都有具体的行为描述，而非抽象标签。' },
            { role: 'user', content: prompt }
        ];

        // 调用AI服务
        window.AIService.callAIService(settings, messages, function(err, result) {
            if (err) {
                callback(err, null);
                return;
            }

            // 尝试解析JSON
            try {
                // 提取JSON部分
                var jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    var parsed = JSON.parse(jsonMatch[0]);
                    callback(null, parsed);
                } else {
                    callback('无法解析AI返回的JSON', null);
                }
            } catch (e) {
                callback('解析AI返回结果失败: ' + e.message, null);
            }
        });
    }

    /* ── 人格分析 ── */
    function analyzePersona(messages, existingInfo, callback) {
        _setState(ANALYSIS_STATES.ANALYZING_PERSONA);
        _setProgress(0);

        var processedMessages = _preprocessMessages(messages);
        if (processedMessages.length === 0) {
            callback('没有可分析的消息', null);
            _setState(ANALYSIS_STATES.ERROR);
            return;
        }

        var prompt = _buildPersonaAnalysisPrompt(processedMessages, existingInfo);

        _callAIForAnalysis(prompt, function(err, result) {
            if (err) {
                callback(err, null);
                _setState(ANALYSIS_STATES.ERROR);
                return;
            }

            analysisResults.persona = result;
            _setProgress(50);
            callback(null, result);
        });
    }

    /* ── 关系记忆分析 ── */
    function analyzeMemory(messages, existingInfo, callback) {
        _setState(ANALYSIS_STATES.ANALYZING_MEMORY);
        _setProgress(50);

        var processedMessages = _preprocessMessages(messages);
        if (processedMessages.length === 0) {
            callback('没有可分析的消息', null);
            _setState(ANALYSIS_STATES.ERROR);
            return;
        }

        var prompt = _buildMemoryAnalysisPrompt(processedMessages, existingInfo);

        _callAIForAnalysis(prompt, function(err, result) {
            if (err) {
                callback(err, null);
                _setState(ANALYSIS_STATES.ERROR);
                return;
            }

            analysisResults.memory = result;
            _setProgress(100);
            _setState(ANALYSIS_STATES.COMPLETED);
            callback(null, result);
        });
    }

    /* ── 完整分析 ── */
    function analyzeAll(messages, existingInfo, onProgress, onComplete, onError) {
        onProgressCallback = onProgress;
        onCompleteCallback = onComplete;
        onErrorCallback = onError;
        analysisResults = {};

        analyzePersona(messages, existingInfo, function(err, personaResult) {
            if (err) {
                if (onErrorCallback) onErrorCallback(err);
                return;
            }

            analyzeMemory(messages, existingInfo, function(err, memoryResult) {
                if (err) {
                    if (onErrorCallback) onErrorCallback(err);
                    return;
                }

                if (onCompleteCallback) {
                    onCompleteCallback({
                        persona: personaResult,
                        memory: memoryResult
                    });
                }
            });
        });
    }

    /* ── 单独分析 ── */
    function analyzePersonaOnly(messages, existingInfo, callback) {
        analyzePersona(messages, existingInfo, callback);
    }

    function analyzeMemoryOnly(messages, existingInfo, callback) {
        analyzeMemory(messages, existingInfo, callback);
    }

    /* ── 状态查询 ── */
    function getState() {
        return currentState;
    }

    function getProgress() {
        return analysisProgress;
    }

    function getResults() {
        return JSON.parse(JSON.stringify(analysisResults));
    }

    /* ── 配置管理 ── */
    function updateConfig(newConfig) {
        Object.assign(ANALYSIS_CONFIG, newConfig);
    }

    function getConfig() {
        return JSON.parse(JSON.stringify(ANALYSIS_CONFIG));
    }

    /* ── 暴露全局接口 ── */
    window.AIAnalyzer = {
        // 常量
        STATES: ANALYSIS_STATES,
        
        // 核心功能
        analyzeAll: analyzeAll,
        analyzePersona: analyzePersonaOnly,
        analyzeMemory: analyzeMemoryOnly,
        
        // 状态查询
        getState: getState,
        getProgress: getProgress,
        getResults: getResults,
        
        // 配置管理
        updateConfig: updateConfig,
        getConfig: getConfig
    };

})();