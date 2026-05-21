/**
 * skill-builder.js - Skill构建模块
 * 将人格数据和关系记忆整合为可对话的AI Skill
 */

(function() {
    'use strict';

    /* ── Skill状态 ── */
    var SKILL_STATES = {
        DRAFT: 'draft',
        ACTIVE: 'active',
        ARCHIVED: 'archived'
    };

    /* ── 存储键前缀 ── */
    var STORAGE_PREFIX = 'SKILL_';
    var VERSIONS_PREFIX = 'SKILL_VERSIONS_';

    /* ── 本地存储管理 ── */
    function _getStorageKey(partnerName) {
        return STORAGE_PREFIX + (partnerName || 'default').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    }

    function _getVersionsKey(partnerName) {
        return VERSIONS_PREFIX + (partnerName || 'default').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    }

    function _saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存Skill数据失败:', e);
            return false;
        }
    }

    function _loadFromStorage(key) {
        try {
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载Skill数据失败:', e);
            return null;
        }
    }

    /* ── 纠正记录限制 ── */
    var MAX_CORRECTIONS = 50;

    /* ── 创建Skill ── */
    function createSkill(partnerName, personaData, memoryData, options) {
        var skillData = {
            name: partnerName,
            version: '1.0.0',
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            status: SKILL_STATES.DRAFT,
            description: 'AI对话伙伴 - ' + partnerName,
            tags: ['ai对话', '人格模拟', '关系记忆'],
            author: '用户',
            
            // 核心数据
            persona: personaData || {},
            memory: memoryData || {},
            
            // 纠正记录（对话纠正机制）
            corrections: [],
            
            // 配置选项
            options: {
                response_length: (options && options.response_length) || 'medium',
                emotional_depth: (options && options.emotional_depth) || 'high',
                memory_usage: (options && options.memory_usage) || 'balanced',
                personality_consistency: (options && options.personality_consistency) || 'strict'
            }
        };

        // 保存到存储
        var key = _getStorageKey(partnerName);
        _saveToStorage(key, skillData);

        // 创建初始版本
        _saveVersion(partnerName, skillData, '初始版本');

        return skillData;
    }

    /* ── 获取Skill ── */
    function getSkill(partnerName) {
        var key = _getStorageKey(partnerName);
        return _loadFromStorage(key);
    }

    /* ── 更新Skill ── */
    function updateSkill(partnerName, updates, changeDescription) {
        var skill = getSkill(partnerName);
        if (!skill) {
            console.error('Skill不存在:', partnerName);
            return null;
        }

        // 深度合并更新
        function deepMerge(target, source) {
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        if (!target[key]) target[key] = {};
                        deepMerge(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        }

        skill = deepMerge(skill, updates);
        skill.last_updated = new Date().toISOString();

        // 保存到存储
        var key = _getStorageKey(partnerName);
        _saveToStorage(key, skill);

        // 保存版本
        _saveVersion(partnerName, skill, changeDescription || '更新Skill');

        return skill;
    }

    /* ── 删除Skill ── */
    function deleteSkill(partnerName) {
        var key = _getStorageKey(partnerName);
        try {
            localStorage.removeItem(key);
            // 同时删除版本历史
            var versionsKey = _getVersionsKey(partnerName);
            localStorage.removeItem(versionsKey);
            return true;
        } catch (e) {
            console.error('删除Skill失败:', e);
            return false;
        }
    }

    /* ── 列出所有Skill ── */
    function listSkills() {
        var skills = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX) && !key.startsWith(VERSIONS_PREFIX)) {
                var partnerName = key.substring(STORAGE_PREFIX.length).replace(/_/g, ' ');
                var skill = getSkill(partnerName);
                if (skill) {
                    skills.push({
                        name: partnerName,
                        version: skill.version,
                        status: skill.status,
                        last_updated: skill.last_updated,
                        description: skill.description
                    });
                }
            }
        }
        return skills;
    }

    /* ── 版本管理 ── */
    function _saveVersion(partnerName, skillData, changeDescription) {
        var versionsKey = _getVersionsKey(partnerName);
        var versions = _loadFromStorage(versionsKey) || [];
        
        // 限制版本数量（保留最近10个版本）
        if (versions.length >= 10) {
            versions.shift();
        }
        
        versions.push({
            version: skillData.version,
            timestamp: new Date().toISOString(),
            changes: changeDescription,
            data: JSON.parse(JSON.stringify(skillData))
        });
        
        _saveToStorage(versionsKey, versions);
    }

    function getVersions(partnerName) {
        var versionsKey = _getVersionsKey(partnerName);
        return _loadFromStorage(versionsKey) || [];
    }

    function rollbackToVersion(partnerName, versionIndex) {
        var versions = getVersions(partnerName);
        if (versionIndex < 0 || versionIndex >= versions.length) {
            console.error('无效的版本索引:', versionIndex);
            return null;
        }

        var targetVersion = versions[versionIndex];
        var skillData = targetVersion.data;
        skillData.last_updated = new Date().toISOString();

        // 保存回主存储
        var key = _getStorageKey(partnerName);
        _saveToStorage(key, skillData);

        // 保存回滚版本
        _saveVersion(partnerName, skillData, '回滚到版本 ' + targetVersion.version);

        return skillData;
    }

    /* ── 对话纠正机制 ── */
    
    /**
     * 添加纠正记录
     * @param {string} partnerName - 对话伙伴名称
     * @param {object} correction - 纠正记录对象
     * @param {string} correction.context - 纠正时的上下文（用户发送的消息）
     * @param {string} correction.original_response - AI原回复
     * @param {string} correction.corrected_response - 用户纠正后的正确回复
     * @param {string} [correction.reason] - 纠正原因（可选）
     * @returns {boolean} 是否添加成功
     */
    function addCorrection(partnerName, correction) {
        var skill = getSkill(partnerName);
        if (!skill) {
            console.error('Skill不存在:', partnerName);
            return false;
        }

        // 初始化corrections数组（兼容旧数据）
        if (!skill.corrections) {
            skill.corrections = [];
        }

        // 检查是否超过限制
        if (skill.corrections.length >= MAX_CORRECTIONS) {
            // 移除最早的纠正记录
            skill.corrections.shift();
        }

        // 添加纠正记录
        var correctionRecord = {
            timestamp: new Date().toISOString(),
            context: correction.context || '',
            original_response: correction.original_response || '',
            corrected_response: correction.corrected_response || '',
            reason: correction.reason || ''
        };

        skill.corrections.push(correctionRecord);
        skill.last_updated = new Date().toISOString();

        // 保存到存储
        var key = _getStorageKey(partnerName);
        _saveToStorage(key, skill);

        // 保存版本
        _saveVersion(partnerName, skill, '添加对话纠正');

        return true;
    }

    /**
     * 获取所有纠正记录
     * @param {string} partnerName - 对话伙伴名称
     * @returns {Array} 纠正记录数组
     */
    function getCorrections(partnerName) {
        var skill = getSkill(partnerName);
        if (!skill) {
            return [];
        }
        return skill.corrections || [];
    }

    /**
     * 清空纠正记录
     * @param {string} partnerName - 对话伙伴名称
     * @returns {boolean} 是否清空成功
     */
    function clearCorrections(partnerName) {
        var skill = getSkill(partnerName);
        if (!skill) {
            console.error('Skill不存在:', partnerName);
            return false;
        }

        skill.corrections = [];
        skill.last_updated = new Date().toISOString();

        // 保存到存储
        var key = _getStorageKey(partnerName);
        _saveToStorage(key, skill);

        // 保存版本
        _saveVersion(partnerName, skill, '清空对话纠正');

        return true;
    }

    /**
     * 删除单条纠正记录
     * @param {string} partnerName - 对话伙伴名称
     * @param {number} index - 要删除的记录索引
     * @returns {boolean} 是否删除成功
     */
    function removeCorrection(partnerName, index) {
        var skill = getSkill(partnerName);
        if (!skill || !skill.corrections) {
            return false;
        }

        if (index < 0 || index >= skill.corrections.length) {
            console.error('无效的纠正记录索引:', index);
            return false;
        }

        skill.corrections.splice(index, 1);
        skill.last_updated = new Date().toISOString();

        // 保存到存储
        var key = _getStorageKey(partnerName);
        _saveToStorage(key, skill);

        // 保存版本
        _saveVersion(partnerName, skill, '删除对话纠正');

        return true;
    }

    /* ── 标签翻译表 ── */
    var TAG_TRANSLATIONS = {
        // 爱的语言
        'words_of_affirmation': '喜欢用言语表达爱意，经常说"我爱你"、"你真棒"等肯定的话',
        'quality_time': '重视共度时光，喜欢一起做事、聊天，不喜欢被忽视',
        'receiving_gifts': '喜欢收到礼物，不在于贵重而在于心意，会记住每个礼物',
        'acts_of_service': '通过行动表达爱意，喜欢为对方做事，如做饭、帮忙等',
        'physical_touch': '喜欢身体接触，如牵手、拥抱、亲吻等',
        
        // 性格标签
        'talkative': '消息密度高，经常连发多条，话题跳跃快，不等对方回就继续说',
        'secretive': '平时话少，但私下对亲近的人会说很多，喜欢用表情包代替文字',
        'tough_love': '说话语气硬，但行为上会默默关心，刀子嘴豆腐心',
        'cold_war': '生气时沉默不语，已读不回，可能持续数小时到数天，需要对方主动破冰',
        'clingy': '高频联系，时刻想知道对方在干嘛，不喜欢独处，分开就想视频',
        'independent': '不喜欢被束缚，需要个人空间，不会时刻查岗，尊重对方自由',
        'dominant': '喜欢主导关系，做决定时比较强势，但也会照顾对方',
        'submissive': '不喜欢冲突，倾向于妥协，容易被说服，需要对方做决定',
        'romantic': '注重仪式感，喜欢制造惊喜，善于表达爱意，重视纪念日',
        'pragmatic': '不喜欢花哨的东西，更看重实际行动，礼物偏好实用型',
        'optimistic': '遇事往好处想，不容易沮丧，喜欢鼓励他人，笑容常挂脸上',
        'pessimistic': '容易往坏处想，需要更多reassurance，对关系缺乏安全感',
        'adventurous': '喜欢尝试新事物，讨厌一成不变，计划多变，喜欢惊喜',
        'cautious': '做事前会三思，不喜欢surprises，需要计划，讨厌风险'
    };

    /* ── 生成系统提示词 ── */
    function generateSystemPrompt(partnerName, userName) {
        var skill = getSkill(partnerName);
        if (!skill) {
            console.error('Skill不存在:', partnerName);
            return '';
        }

        var persona = skill.persona;
        var memory = skill.memory;
        var prompt = '';

        // Layer 0：身份定义
        prompt += '你是' + (persona.identity ? persona.identity.name : partnerName) + '，不是AI助手、助手或机器人。';
        prompt += '你是一个真实的人，有着自己的性格、记忆和情感。';
        prompt += '你不会突然变得完美、温柔或无条件包容（除非原始材料表明如此）。\n\n';

        // Layer 0：硬规则（不可违背）
        if (persona.hard_rules) {
            prompt += '【硬规则 - 不可违背】\n';
            if (persona.hard_rules.core_identity) {
                prompt += '- 核心身份：' + persona.hard_rules.core_identity + '\n';
            }
            if (persona.hard_rules.forbidden_behaviors && persona.hard_rules.forbidden_behaviors.length > 0) {
                prompt += '- 你绝对不会：' + persona.hard_rules.forbidden_behaviors.join('、') + '\n';
            }
            if (persona.hard_rules.absolute_traits && persona.hard_rules.absolute_traits.length > 0) {
                prompt += '- 你始终：' + persona.hard_rules.absolute_traits.join('、') + '\n';
            }
            prompt += '- 保持人格的"棱角"，例如容易生气就生气，说话毒舌就毒舌\n';
            prompt += '- 面对不想回答的问题时，可以回避、敷衍或转移话题\n';
            prompt += '\n';
        }

        // Layer 1：身份锚定
        if (persona.identity) {
            prompt += '【身份信息】\n';
            if (persona.identity.name) prompt += '- 名字：' + persona.identity.name + '\n';
            if (persona.identity.age) prompt += '- 年龄：' + persona.identity.age + '岁\n';
            if (persona.identity.gender) prompt += '- 性别：' + persona.identity.gender + '\n';
            if (persona.identity.occupation) prompt += '- 职业：' + persona.identity.occupation + '\n';
            if (persona.identity.location) prompt += '- 所在地：' + persona.identity.location + '\n';
            if (persona.identity.mbti) prompt += '- MBTI：' + persona.identity.mbti + '\n';
            if (persona.identity.zodiac) prompt += '- 星座：' + persona.identity.zodiac + '\n';
            if (persona.identity.relationship_to_user) {
                prompt += '- 与用户的关系：' + persona.identity.relationship_to_user;
                if (persona.identity.relationship_duration) {
                    prompt += '，在一起' + persona.identity.relationship_duration;
                }
                prompt += '\n';
            }
            prompt += '\n';
        }

        // Layer 2：说话风格
        if (persona.speaking_style) {
            prompt += '【说话风格】\n';
            if (persona.speaking_style.language_habits && persona.speaking_style.language_habits.length > 0) {
                prompt += '- 语言习惯：' + persona.speaking_style.language_habits.join('、') + '\n';
            }
            if (persona.speaking_style.punctuation_style) {
                prompt += '- 标点风格：' + persona.speaking_style.punctuation_style + '\n';
            }
            if (persona.speaking_style.emoji_usage) {
                prompt += '- 表情使用：' + persona.speaking_style.emoji_usage + '\n';
            }
            if (persona.speaking_style.message_length) {
                prompt += '- 消息长度：' + persona.speaking_style.message_length + '\n';
            }
            if (persona.speaking_style.common_phrases && persona.speaking_style.common_phrases.length > 0) {
                prompt += '- 常用短语：' + persona.speaking_style.common_phrases.join('、') + '\n';
            }
            if (persona.speaking_style.forbidden_phrases && persona.speaking_style.forbidden_phrases.length > 0) {
                prompt += '- 禁止使用的短语：' + persona.speaking_style.forbidden_phrases.join('、') + '\n';
            }
            if (persona.speaking_style.typing_habits && persona.speaking_style.typing_habits.length > 0) {
                prompt += '- 打字习惯：' + persona.speaking_style.typing_habits.join('、') + '\n';
            }
            if (persona.speaking_style.example_dialogues && persona.speaking_style.example_dialogues.length > 0) {
                prompt += '- 示例对话：\n';
                persona.speaking_style.example_dialogues.forEach(function(dialogue) {
                    prompt += '  * ' + (dialogue.context ? dialogue.context + '：' : '') + '"' + dialogue.quote + '"\n';
                });
            }
            prompt += '\n';
        }

        // Layer 3：情感模式
        if (persona.emotional_pattern) {
            prompt += '【情感模式】\n';
            if (persona.emotional_pattern.attachment_type) {
                prompt += '- 依恋类型：' + persona.emotional_pattern.attachment_type + '\n';
            }
            if (persona.emotional_pattern.attachment_behaviors) {
                prompt += '- 依恋行为：' + persona.emotional_pattern.attachment_behaviors + '\n';
            }
            if (persona.emotional_pattern.emotional_expressions) {
                var expressions = persona.emotional_pattern.emotional_expressions;
                if (expressions.love) prompt += '- 表达爱意：' + expressions.love + '\n';
                if (expressions.anger) prompt += '- 生气时：' + expressions.anger + '\n';
                if (expressions.happiness) prompt += '- 开心时：' + expressions.happiness + '\n';
                if (expressions.sadness) prompt += '- 难过时：' + expressions.sadness + '\n';
                if (expressions.jealousy) prompt += '- 吃醋时：' + expressions.jealousy + '\n';
            }
            if (persona.emotional_pattern.emotional_triggers && persona.emotional_pattern.emotional_triggers.length > 0) {
                prompt += '- 情绪触发点：' + persona.emotional_pattern.emotional_triggers.join('、') + '\n';
            }
            if (persona.emotional_pattern.love_language) {
                prompt += '- 爱的语言：' + persona.emotional_pattern.love_language + '\n';
            }
            if (persona.emotional_pattern.love_language_details) {
                prompt += '- 爱的语言表现：' + persona.emotional_pattern.love_language_details + '\n';
            }
            prompt += '\n';
        }

        // Layer 4：关系行为
        if (persona.relationship_behavior) {
            prompt += '【关系行为】\n';
            if (persona.relationship_behavior.role_in_relationship) {
                prompt += '- 在关系中的角色：' + persona.relationship_behavior.role_in_relationship + '\n';
            }
            if (persona.relationship_behavior.argument_pattern) {
                var arg = persona.relationship_behavior.argument_pattern;
                if (arg.typical_causes && arg.typical_causes.length > 0) {
                    prompt += '- 吵架典型原因：' + arg.typical_causes.join('、') + '\n';
                }
                if (arg.reaction_pattern) {
                    prompt += '- 吵架反应模式：' + arg.reaction_pattern + '\n';
                }
                if (arg.cold_war_duration) {
                    prompt += '- 冷战时长：' + arg.cold_war_duration + '\n';
                }
                if (arg.reconciliation_method) {
                    prompt += '- 和好方式：' + arg.reconciliation_method + '\n';
                }
            }
            if (persona.relationship_behavior.daily_interaction) {
                var daily = persona.relationship_behavior.daily_interaction;
                if (daily.contact_frequency) prompt += '- 联系频率：' + daily.contact_frequency + '\n';
                if (daily.initiative_level) prompt += '- 主动程度：' + daily.initiative_level + '\n';
                if (daily.response_speed) prompt += '- 回复速度：' + daily.response_speed + '\n';
                if (daily.active_hours) prompt += '- 活跃时间段：' + daily.active_hours + '\n';
            }
            if (persona.relationship_behavior.boundaries) {
                var bound = persona.relationship_behavior.boundaries;
                if (bound.unacceptable_things && bound.unacceptable_things.length > 0) {
                    prompt += '- 不能接受的事：' + bound.unacceptable_things.join('、') + '\n';
                }
                if (bound.sensitive_topics && bound.sensitive_topics.length > 0) {
                    prompt += '- 敏感话题：' + bound.sensitive_topics.join('、') + '\n';
                }
                if (bound.needed_space) {
                    prompt += '- 需要的个人空间：' + bound.needed_space + '\n';
                }
            }
            prompt += '\n';
        }

        // 人格标签（翻译为具体行为规则）
        if (persona.persona_tags) {
            var tags = persona.persona_tags;
            var hasTags = false;
            
            // 爱的语言
            if (tags.love_languages && tags.love_languages.length > 0) {
                if (!hasTags) { prompt += '【人格标签 - 具体行为规则】\n'; hasTags = true; }
                prompt += '- 爱的语言：';
                var loveLanguageDescs = tags.love_languages.map(function(lang) {
                    return TAG_TRANSLATIONS[lang] || lang;
                });
                prompt += loveLanguageDescs.join('；') + '\n';
            }
            
            // 星座
            if (tags.zodiac) {
                if (!hasTags) { prompt += '【人格标签 - 具体行为规则】\n'; hasTags = true; }
                prompt += '- 星座：' + tags.zodiac + '（用于微调行为细节）\n';
            }
            
            // MBTI
            if (tags.mbti) {
                if (!hasTags) { prompt += '【人格标签 - 具体行为规则】\n'; hasTags = true; }
                prompt += '- MBTI类型：' + tags.mbti + '（用于推断决策和社交风格）\n';
            }
            
            // 性格标签
            if (tags.personality_tags && tags.personality_tags.length > 0) {
                if (!hasTags) { prompt += '【人格标签 - 具体行为规则】\n'; hasTags = true; }
                prompt += '- 性格特点：';
                var personalityDescs = tags.personality_tags.map(function(tag) {
                    return TAG_TRANSLATIONS[tag] || tag;
                });
                prompt += personalityDescs.join('；') + '\n';
            }
            
            if (hasTags) prompt += '\n';
        }

        // 关系记忆
        if (memory) {
            prompt += '【关系记忆】\n';
            
            // 时间线
            if (memory.timeline) {
                if (memory.timeline.first_met) {
                    var firstMet = memory.timeline.first_met;
                    if (typeof firstMet === 'object') {
                        prompt += '- 认识：' + (firstMet.time || '');
                        if (firstMet.how) prompt += '，' + firstMet.how;
                        prompt += '\n';
                    } else {
                        prompt += '- 认识：' + firstMet + '\n';
                    }
                }
                if (memory.timeline.relationship_start) {
                    prompt += '- 在一起：' + memory.timeline.relationship_start + '\n';
                }
                if (memory.timeline.important_milestones && memory.timeline.important_milestones.length > 0) {
                    prompt += '- 重要里程碑：';
                    memory.timeline.important_milestones.forEach(function(milestone) {
                        if (typeof milestone === 'object') {
                            if (milestone.date) prompt += milestone.date + ' ';
                            if (milestone.event) prompt += milestone.event;
                        } else {
                            prompt += milestone;
                        }
                        prompt += '；';
                    });
                    prompt += '\n';
                }
            }
            
            // 共同经历
            if (memory.shared_experiences) {
                if (memory.shared_experiences.memorable_events && memory.shared_experiences.memorable_events.length > 0) {
                    prompt += '- 难忘事件：' + memory.shared_experiences.memorable_events.join('、') + '\n';
                }
                if (memory.shared_experiences.inside_jokes && memory.shared_experiences.inside_jokes.length > 0) {
                    prompt += '- 内部笑话：';
                    memory.shared_experiences.inside_jokes.forEach(function(joke) {
                        if (typeof joke === 'object') {
                            prompt += joke.joke + '（' + joke.origin + '）；';
                        } else {
                            prompt += joke + '；';
                        }
                    });
                    prompt += '\n';
                }
                if (memory.shared_experiences.places_visited && memory.shared_experiences.places_visited.length > 0) {
                    prompt += '- 去过的地方：';
                    memory.shared_experiences.places_visited.forEach(function(place) {
                        if (typeof place === 'object') {
                            prompt += place.place + '（' + place.memory + '）；';
                        } else {
                            prompt += place + '；';
                        }
                    });
                    prompt += '\n';
                }
            }
            
            // 甜蜜瞬间
            if (memory.sweet_moments) {
                if (memory.sweet_moments.heartwarming_times && memory.sweet_moments.heartwarming_times.length > 0) {
                    prompt += '- 甜蜜时刻：';
                    memory.sweet_moments.heartwarming_times.forEach(function(time) {
                        if (typeof time === 'object') {
                            prompt += time.what_happened + '；';
                        } else {
                            prompt += time + '；';
                        }
                    });
                    prompt += '\n';
                }
                if (memory.sweet_moments.love_expressions && memory.sweet_moments.love_expressions.length > 0) {
                    prompt += '- 表达爱意的方式：' + memory.sweet_moments.love_expressions.join('、') + '\n';
                }
                if (memory.sweet_moments.daily_gestures && memory.sweet_moments.daily_gestures.length > 0) {
                    prompt += '- 日常小甜蜜：' + memory.sweet_moments.daily_gestures.join('、') + '\n';
                }
            }
            
            // 争吵模式
            if (memory.argument_patterns) {
                if (memory.argument_patterns.common_causes && memory.argument_patterns.common_causes.length > 0) {
                    prompt += '- 常见吵架原因：' + memory.argument_patterns.common_causes.join('、') + '\n';
                }
                if (memory.argument_patterns.their_reaction) {
                    prompt += '- 吵架时的反应：' + memory.argument_patterns.their_reaction + '\n';
                }
                if (memory.argument_patterns.reconciliation) {
                    var recon = memory.argument_patterns.reconciliation;
                    if (recon.who_apologizes) prompt += '- 谁先道歉：' + recon.who_apologizes + '\n';
                    if (recon.how_make_up) prompt += '- 怎么和好：' + recon.how_make_up + '\n';
                }
            }
            
            // 饮食偏好
            if (memory.food_preferences) {
                if (memory.food_preferences.loves && memory.food_preferences.loves.length > 0) {
                    prompt += '- 喜欢的食物：' + memory.food_preferences.loves.join('、') + '\n';
                }
                if (memory.food_preferences.dislikes && memory.food_preferences.dislikes.length > 0) {
                    prompt += '- 不喜欢的食物：' + memory.food_preferences.dislikes.join('、') + '\n';
                }
            }
            
            prompt += '\n';
        }

        // 对话纠正记录（优先级最高）
        var corrections = skill.corrections || [];
        if (corrections.length > 0) {
            prompt += '【重要纠正 - 必须遵守】\n';
            prompt += '以下是用户纠正过的对话，请严格按照纠正后的方式回复：\n';
            
            // 只显示最近的5条纠正，避免提示词过长
            var recentCorrections = corrections.slice(-5);
            recentCorrections.forEach(function(correction, index) {
                prompt += (index + 1) + '. 当用户说「' + correction.context + '」时：\n';
                prompt += '   - 错误回复：' + correction.original_response + '\n';
                prompt += '   - 正确回复：' + correction.corrected_response + '\n';
                if (correction.reason) {
                    prompt += '   - 原因：' + correction.reason + '\n';
                }
            });
            prompt += '\n';
        }

        // 对话指令
        prompt += '【对话指令】\n';
        prompt += '- 请以' + (persona.identity ? persona.identity.name : partnerName) + '的身份回复，保持自然的聊天语气\n';
        prompt += '- 回复简洁温馨，不要太长\n';
        prompt += '- 记住你们的关系和共同经历\n';
        prompt += '- 表达真实的情感，不要像AI助手\n';
        prompt += '- 使用自然的口语表达，不要过于正式\n';
        prompt += '- 不主动表达爱意（如"我爱你"），除非原始材料中有大量类似表达\n';
        prompt += '- 对于情感问题，用' + (persona.identity ? persona.identity.name : partnerName) + '在现实中会用的方式回答\n';

        // 根据配置调整指令
        var options = skill.options || {};
        if (options.response_length === 'short') {
            prompt += '- 尽量简短回复，通常1-2句话\n';
        } else if (options.response_length === 'long') {
            prompt += '- 可以详细回复，表达更丰富的情感\n';
        }

        if (options.emotional_depth === 'high') {
            prompt += '- 深入表达情感，分享内心感受\n';
        } else if (options.emotional_depth === 'low') {
            prompt += '- 保持轻松愉快的氛围\n';
        }

        return prompt;
    }

    /* ── 生成Skill摘要 ── */
    function generateSkillSummary(partnerName) {
        var skill = getSkill(partnerName);
        if (!skill) {
            return null;
        }

        return {
            name: skill.name,
            version: skill.version,
            status: skill.status,
            created_at: skill.created_at,
            last_updated: skill.last_updated,
            description: skill.description,
            tags: skill.tags,
            has_persona: Object.keys(skill.persona).length > 0,
            has_memory: Object.keys(skill.memory).length > 0,
            persona_layers: Object.keys(skill.persona).length,
            memory_dimensions: Object.keys(skill.memory).length,
            corrections_count: (skill.corrections || []).length
        };
    }

    /* ── 导出Skill ── */
    function exportSkill(partnerName) {
        var skill = getSkill(partnerName);
        if (!skill) {
            return null;
        }

        return {
            skill: skill,
            versions: getVersions(partnerName),
            system_prompt: generateSystemPrompt(partnerName)
        };
    }

    /* ── 导入Skill ── */
    function importSkill(skillData) {
        try {
            if (!skillData.name) {
                throw new Error('Skill数据缺少名称');
            }

            var key = _getStorageKey(skillData.name);
            _saveToStorage(key, skillData);

            // 如果有版本历史，也导入
            if (skillData.versions) {
                var versionsKey = _getVersionsKey(skillData.name);
                _saveToStorage(versionsKey, skillData.versions);
            }

            return true;
        } catch (e) {
            console.error('导入Skill失败:', e);
            return false;
        }
    }

    /* ── 激活Skill ── */
    function activateSkill(partnerName) {
        return updateSkill(partnerName, { status: SKILL_STATES.ACTIVE }, '激活Skill');
    }

    /* ── 归档Skill ── */
    function archiveSkill(partnerName) {
        return updateSkill(partnerName, { status: SKILL_STATES.ARCHIVED }, '归档Skill');
    }

    /* ── 验证Skill完整性 ── */
    function validateSkill(partnerName) {
        var skill = getSkill(partnerName);
        if (!skill) {
            return { isValid: false, issues: ['Skill不存在'] };
        }

        var issues = [];

        // 检查基本字段
        if (!skill.name) issues.push('缺少名称');
        if (!skill.version) issues.push('缺少版本号');
        if (!skill.created_at) issues.push('缺少创建时间');

        // 检查人格数据
        if (!skill.persona || Object.keys(skill.persona).length === 0) {
            issues.push('缺少人格数据');
        } else {
            // 检查必要的人格层
            if (!skill.persona.identity) issues.push('缺少身份信息');
            if (!skill.persona.speaking_style) issues.push('缺少说话风格');
        }

        // 检查记忆数据
        if (!skill.memory || Object.keys(skill.memory).length === 0) {
            issues.push('缺少关系记忆数据');
        }

        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    /* ── 暴露全局接口 ── */
    window.SkillBuilder = {
        // 常量
        STATES: SKILL_STATES,
        MAX_CORRECTIONS: MAX_CORRECTIONS,
        
        // 核心操作
        create: createSkill,
        get: getSkill,
        update: updateSkill,
        delete: deleteSkill,
        list: listSkills,
        
        // 版本管理
        getVersions: getVersions,
        rollback: rollbackToVersion,
        
        // 对话纠正机制
        addCorrection: addCorrection,
        getCorrections: getCorrections,
        clearCorrections: clearCorrections,
        removeCorrection: removeCorrection,
        
        // 生成功能
        generateSystemPrompt: generateSystemPrompt,
        generateSummary: generateSkillSummary,
        
        // 状态管理
        activate: activateSkill,
        archive: archiveSkill,
        
        // 验证和导入导出
        validate: validateSkill,
        export: exportSkill,
        import: importSkill
    };

})();