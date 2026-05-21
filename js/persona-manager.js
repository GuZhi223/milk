/**
 * persona-manager.js - 人格数据管理模块
 * 管理5层人格结构数据：硬规则、身份、说话风格、情感模式、关系行为
 */

(function() {
    'use strict';

    /* ── 人格数据结构 ── */
    var PERSONA_LAYERS = {
        HARD_RULES: 'hard_rules',      // 硬规则：不可违背的核心特征
        IDENTITY: 'identity',          // 身份：基本信息、关系定位
        SPEAKING_STYLE: 'speaking_style', // 说话风格：语言习惯、表达方式
        EMOTIONAL_PATTERN: 'emotional_pattern', // 情感模式：情绪反应、依恋类型
        RELATIONSHIP_BEHAVIOR: 'relationship_behavior', // 关系行为：互动模式、边界感
        PERSONA_TAGS: 'persona_tags'   // 人格标签：爱的语言、星座、MBTI、性格标签
    };

    /* ── 标签常量定义 ── */
    
    // 爱的语言（Love Languages）
    var LOVE_LANGUAGES = {
        WORDS_OF_AFFIRMATION: 'words_of_affirmation',   // 肯定的言辞
        QUALITY_TIME: 'quality_time',                    // 精心的时刻
        RECEIVING_GIFTS: 'receiving_gifts',              // 接受礼物
        ACTS_OF_SERVICE: 'acts_of_service',              // 服务的行动
        PHYSICAL_TOUCH: 'physical_touch'                 // 身体的接触
    };

    // 爱的语言显示文本
    var LOVE_LANGUAGES_TEXT = {
        words_of_affirmation: '肯定的言辞',
        quality_time: '精心的时刻',
        receiving_gifts: '接受礼物',
        acts_of_service: '服务的行动',
        physical_touch: '身体的接触'
    };

    // 十二星座
    var ZODIAC_SIGNS = {
        ARIES: 'aries',               // 白羊座
        TAURUS: 'taurus',             // 金牛座
        GEMINI: 'gemini',             // 双子座
        CANCER: 'cancer',             // 巨蟹座
        LEO: 'leo',                   // 狮子座
        VIRGO: 'virgo',               // 处女座
        LIBRA: 'libra',               // 天秤座
        SCORPIO: 'scorpio',           // 天蝎座
        SAGITTARIUS: 'sagittarius',   // 射手座
        CAPRICORN: 'capricorn',       // 摩羯座
        AQUARIUS: 'aquarius',         // 水瓶座
        PISCES: 'pisces'              // 双鱼座
    };

    // 星座显示文本
    var ZODIAC_SIGNS_TEXT = {
        aries: '白羊座',
        taurus: '金牛座',
        gemini: '双子座',
        cancer: '巨蟹座',
        leo: '狮子座',
        virgo: '处女座',
        libra: '天秤座',
        scorpio: '天蝎座',
        sagittarius: '射手座',
        capricorn: '摩羯座',
        aquarius: '水瓶座',
        pisces: '双鱼座'
    };

    // MBTI 16种人格类型
    var MBTI_TYPES = {
        INTJ: 'INTJ',   // 建筑师
        INTP: 'INTP',   // 逻辑学家
        ENTJ: 'ENTJ',   // 指挥官
        ENTP: 'ENTP',   // 辩论家
        INFJ: 'INFJ',   // 提倡者
        INFP: 'INFP',   // 调停者
        ENFJ: 'ENFJ',   // 主人公
        ENFP: 'ENFP',   // 竞选者
        ISTJ: 'ISTJ',   // 物流师
        ISFJ: 'ISFJ',   // 守卫者
        ESTJ: 'ESTJ',   // 总经理
        ESFJ: 'ESFJ',   // 执政官
        ISTP: 'ISTP',   // 鉴赏家
        ISFP: 'ISFP',   // 探险家
        ESTP: 'ESTP',   // 企业家
        ESFP: 'ESFP'    // 表演者
    };

    // MBTI显示文本
    var MBTI_TYPES_TEXT = {
        'INTJ': 'INTJ-建筑师',
        'INTP': 'INTP-逻辑学家',
        'ENTJ': 'ENTJ-指挥官',
        'ENTP': 'ENTP-辩论家',
        'INFJ': 'INFJ-提倡者',
        'INFP': 'INFP-调停者',
        'ENFJ': 'ENFJ-主人公',
        'ENFP': 'ENFP-竞选者',
        'ISTJ': 'ISTJ-物流师',
        'ISFJ': 'ISFJ-守卫者',
        'ESTJ': 'ESTJ-总经理',
        'ESFJ': 'ESFJ-执政官',
        'ISTP': 'ISTP-鉴赏家',
        'ISFP': 'ISFP-探险家',
        'ESTP': 'ESTP-企业家',
        'ESFP': 'ESFP-表演者'
    };

    // 性格标签
    var PERSONALITY_TAGS = {
        TALKATIVE: 'talkative',           // 话痨
        SECRETIVE: 'secretive',           // 闷骚
        TOUGH_LOVE: 'tough_love',         // 嘴硬心软
        COLD_WAR: 'cold_war',             // 冷暴力
        CLINGY: 'clingy',                 // 粘人
        INDEPENDENT: 'independent',        // 独立
        DOMINANT: 'dominant',             // 大男子主义/大女子主义
        SUBMISSIVE: 'submissive',         // 顺从型
        ROMANTIC: 'romantic',             // 浪漫型
        PRAGMATIC: 'pragmatic',           // 务实型
        OPTIMISTIC: 'optimistic',         // 乐观派
        PESSIMISTIC: 'pessimistic',       // 悲观派
        ADVENTUROUS: 'adventurous',       // 冒险型
        CAUTIOUS: 'cautious'              // 谨慎型
    };

    // 性格标签显示文本
    var PERSONALITY_TAGS_TEXT = {
        talkative: '话痨',
        secretive: '闷骚',
        tough_love: '嘴硬心软',
        cold_war: '冷暴力',
        clingy: '粘人',
        independent: '独立',
        dominant: '大男/女子主义',
        submissive: '顺从型',
        romantic: '浪漫型',
        pragmatic: '务实型',
        optimistic: '乐观派',
        pessimistic: '悲观派',
        adventurous: '冒险型',
        cautious: '谨慎型'
    };

    /* ── 默认人格模板 ── */
    var DEFAULT_PERSONA = {
        hard_rules: {
            core_identity: '', // 核心身份，如"你是一个温柔体贴的人"
            forbidden_behaviors: [], // 禁止的行为列表
            absolute_traits: [] // 绝对特征，如"永远不会说脏话"
        },
        identity: {
            name: '', // 对方名称
            age: '', // 年龄
            gender: '', // 性别
            occupation: '', // 职业
            location: '', // 所在地
            relationship_to_user: '', // 与用户的关系
            relationship_duration: '', // 关系持续时间
            relationship_status: '' // 关系状态（如：恋爱中、已分手、暗恋等）
        },
        speaking_style: {
            language_habits: [], // 语言习惯，如"喜欢用'~'结尾"
            punctuation_style: '', // 标点使用风格
            emoji_usage: '', // 表情使用习惯
            message_length: '', // 消息长度倾向（长消息/短消息）
            response_speed: '', // 回复速度倾向
            vocabulary_level: '', // 词汇水平（正式/随意）
            common_phrases: [], // 常用短语
            forbidden_phrases: [] // 禁止使用的短语
        },
        emotional_pattern: {
            attachment_type: '', // 依恋类型：安全型、焦虑型、回避型、混乱型
            emotional_expressions: {
                love: '', // 表达爱意的方式
                anger: '', // 生气时的表现
                happiness: '', // 开心时的表现
                sadness: '', // 难过时的表现
                anxiety: '', // 焦虑时的表现
                jealousy: '' // 嫉妒时的表现
            },
            emotional_triggers: [], // 情绪触发点
            comfort_methods: [] // 安慰方式
        },
        relationship_behavior: {
            role_in_relationship: '', // 在关系中的角色
            boundary_level: '', // 边界感程度
            possessiveness: '', // 占有欲程度
            commitment_attitude: '', // 对承诺的态度
            conflict_resolution: '', // 冲突解决方式
            intimacy_level: '', // 亲密程度
            independence_level: '', // 独立程度
            communication_frequency: '' // 沟通频率偏好
        },
        persona_tags: {
            love_languages: [], // 爱的语言：从LOVE_LANGUAGES中选择，可多选
            zodiac: '', // 星座：从ZODIAC_SIGNS中选择
            mbti: '', // MBTI类型：从MBTI_TYPES中选择
            personality_tags: [] // 性格标签：从PERSONALITY_TAGS中选择，可多选
        }
    };

    /* ── 存储键前缀 ── */
    var STORAGE_PREFIX = 'PERSONA_';

    /* ── 本地存储管理 ── */
    function _getStorageKey(partnerName) {
        return STORAGE_PREFIX + (partnerName || 'default').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    }

    function _saveToStorage(partnerName, personaData) {
        var key = _getStorageKey(partnerName);
        try {
            localStorage.setItem(key, JSON.stringify(personaData));
            return true;
        } catch (e) {
            console.error('保存人格数据失败:', e);
            return false;
        }
    }

    function _loadFromStorage(partnerName) {
        var key = _getStorageKey(partnerName);
        try {
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载人格数据失败:', e);
            return null;
        }
    }

    /* ── 创建新人格数据 ── */
    function createPersona(partnerName, initialData) {
        var persona = JSON.parse(JSON.stringify(DEFAULT_PERSONA));
        
        // 合并初始数据
        if (initialData) {
            if (initialData.identity) {
                Object.assign(persona.identity, initialData.identity);
            }
            if (initialData.speaking_style) {
                Object.assign(persona.speaking_style, initialData.speaking_style);
            }
            if (initialData.emotional_pattern) {
                Object.assign(persona.emotional_pattern, initialData.emotional_pattern);
            }
            if (initialData.relationship_behavior) {
                Object.assign(persona.relationship_behavior, initialData.relationship_behavior);
            }
            if (initialData.hard_rules) {
                Object.assign(persona.hard_rules, initialData.hard_rules);
            }
            if (initialData.persona_tags) {
                Object.assign(persona.persona_tags, initialData.persona_tags);
            }
        }

        // 设置名称
        persona.identity.name = partnerName;
        
        // 保存到存储
        _saveToStorage(partnerName, persona);
        
        return persona;
    }

    /* ── 获取人格数据 ── */
    function getPersona(partnerName) {
        var persona = _loadFromStorage(partnerName);
        if (!persona) {
            persona = createPersona(partnerName);
        }
        return persona;
    }

    /* ── 更新人格数据 ── */
    function updatePersona(partnerName, updates) {
        var persona = getPersona(partnerName);
        
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

        persona = deepMerge(persona, updates);
        _saveToStorage(partnerName, persona);
        
        return persona;
    }

    /* ── 更新特定层的人格数据 ── */
    function updatePersonaLayer(partnerName, layerName, layerData) {
        var persona = getPersona(partnerName);
        
        if (persona[layerName]) {
            Object.assign(persona[layerName], layerData);
            _saveToStorage(partnerName, persona);
            return persona;
        } else {
            console.error('无效的人格层名称:', layerName);
            return null;
        }
    }

    /* ── 获取特定层的人格数据 ── */
    function getPersonaLayer(partnerName, layerName) {
        var persona = getPersona(partnerName);
        return persona[layerName] || null;
    }

    /* ── 删除人格数据 ── */
    function deletePersona(partnerName) {
        var key = _getStorageKey(partnerName);
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('删除人格数据失败:', e);
            return false;
        }
    }

    /* ── 列出所有人格数据 ── */
    function listPersonas() {
        var personas = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX)) {
                var partnerName = key.substring(STORAGE_PREFIX.length).replace(/_/g, ' ');
                personas.push(partnerName);
            }
        }
        return personas;
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
        var persona = getPersona(partnerName);
        if (!persona) {
            console.error('Persona不存在:', partnerName);
            return '';
        }
        
        var prompt = '';
        
        // Layer 0：身份定义
        var personaName = (persona.identity && persona.identity.name) ? persona.identity.name : partnerName;
        prompt += '你是' + personaName + '，不是AI助手、助手或机器人。';
        prompt += '你是一个真实的人，有着自己的性格、记忆和情感。';
        prompt += '你不会突然变得完美、温柔或无条件包容（除非原始材料表明如此）。\n\n';
        
        // Layer 0：硬规则
        if (persona.hard_rules) {
            if (persona.hard_rules.core_identity) {
                prompt += '【硬规则 - 不可违背】\n';
                prompt += '- 核心身份：' + persona.hard_rules.core_identity + '\n';
                if (persona.hard_rules.forbidden_behaviors && persona.hard_rules.forbidden_behaviors.length > 0) {
                    prompt += '- 你绝对不会：' + persona.hard_rules.forbidden_behaviors.join('、') + '\n';
                }
                if (persona.hard_rules.absolute_traits && persona.hard_rules.absolute_traits.length > 0) {
                    prompt += '- 你始终：' + persona.hard_rules.absolute_traits.join('、') + '\n';
                }
                prompt += '- 保持人格的"棱角"，例如容易生气就生气，说话毒舌就毒舌\n';
                prompt += '- 面对不想回答的问题时，可以回避、敷衍或转移话题\n\n';
            }
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
            prompt += '\n';
        }
        
        // Layer 3：情感模式
        if (persona.emotional_pattern) {
            prompt += '【情感模式】\n';
            if (persona.emotional_pattern.attachment_type) {
                prompt += '- 依恋类型：' + persona.emotional_pattern.attachment_type + '\n';
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
            prompt += '\n';
        }
        
        // Layer 4：关系行为
        if (persona.relationship_behavior) {
            prompt += '【关系行为】\n';
            if (persona.relationship_behavior.role_in_relationship) {
                prompt += '- 在关系中的角色：' + persona.relationship_behavior.role_in_relationship + '\n';
            }
            if (persona.relationship_behavior.boundary_level) {
                prompt += '- 边界感：' + persona.relationship_behavior.boundary_level + '\n';
            }
            if (persona.relationship_behavior.possessiveness) {
                prompt += '- 占有欲：' + persona.relationship_behavior.possessiveness + '\n';
            }
            if (persona.relationship_behavior.conflict_resolution) {
                prompt += '- 冲突解决方式：' + persona.relationship_behavior.conflict_resolution + '\n';
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
                    return TAG_TRANSLATIONS[lang] || LOVE_LANGUAGES_TEXT[lang] || lang;
                });
                prompt += loveLanguageDescs.join('；') + '\n';
            }
            
            // 星座
            if (tags.zodiac) {
                if (!hasTags) { prompt += '【人格标签 - 具体行为规则】\n'; hasTags = true; }
                prompt += '- 星座：' + (ZODIAC_SIGNS_TEXT[tags.zodiac] || tags.zodiac) + '（用于微调行为细节）\n';
            }
            
            // MBTI
            if (tags.mbti) {
                if (!hasTags) { prompt += '【人格标签 - 具体行为规则】\n'; hasTags = true; }
                prompt += '- MBTI类型：' + (MBTI_TYPES_TEXT[tags.mbti] || tags.mbti) + '（用于推断决策和社交风格）\n';
            }
            
            // 性格标签
            if (tags.personality_tags && tags.personality_tags.length > 0) {
                if (!hasTags) { prompt += '【人格标签 - 具体行为规则】\n'; hasTags = true; }
                prompt += '- 性格特点：';
                var personalityDescs = tags.personality_tags.map(function(tag) {
                    return TAG_TRANSLATIONS[tag] || PERSONALITY_TAGS_TEXT[tag] || tag;
                });
                prompt += personalityDescs.join('；') + '\n';
            }
            
            if (hasTags) prompt += '\n';
        }
        
        // 对话指令
        prompt += '【对话指令】\n';
        prompt += '- 请以「' + personaName + '」的身份回复，保持自然的聊天语气\n';
        prompt += '- 回复简洁温馨，不要太长\n';
        prompt += '- 表达真实的情感，不要像AI助手\n';
        prompt += '- 使用自然的口语表达，不要过于正式\n';
        prompt += '- 不主动表达爱意（如"我爱你"），除非原始材料中有大量类似表达\n';
        prompt += '- 面对不想回答的问题时，可以回避、敷衍或转移话题\n';
        prompt += '- 保持人格的"棱角"，例如容易生气就生气，说话毒舌就毒舌\n';
        
        return prompt;
    }

    /* ── 生成人格摘要 ── */
    function generatePersonaSummary(partnerName) {
        var persona = getPersona(partnerName);
        var summary = {
            name: persona.identity.name,
            layers: {}
        };
        
        // 收集每层的关键信息
        summary.layers.hard_rules = {
            core_identity: persona.hard_rules.core_identity,
            traits_count: persona.hard_rules.absolute_traits.length
        };
        
        summary.layers.identity = {
            age: persona.identity.age,
            occupation: persona.identity.occupation,
            relationship: persona.identity.relationship_to_user
        };
        
        summary.layers.speaking_style = {
            habits_count: persona.speaking_style.language_habits.length,
            phrases_count: persona.speaking_style.common_phrases.length
        };
        
        summary.layers.emotional_pattern = {
            attachment_type: persona.emotional_pattern.attachment_type
        };
        
        summary.layers.relationship_behavior = {
            role: persona.relationship_behavior.role_in_relationship,
            conflict_resolution: persona.relationship_behavior.conflict_resolution
        };
        
        // 人格标签摘要（新增）
        if (persona.persona_tags) {
            summary.layers.persona_tags = {
                love_languages_count: persona.persona_tags.love_languages ? persona.persona_tags.love_languages.length : 0,
                zodiac: persona.persona_tags.zodiac ? (ZODIAC_SIGNS_TEXT[persona.persona_tags.zodiac] || '') : '',
                mbti: persona.persona_tags.mbti || '',
                personality_tags_count: persona.persona_tags.personality_tags ? persona.persona_tags.personality_tags.length : 0
            };
        }
        
        return summary;
    }

    /* ── 验证人格数据完整性 ── */
    function validatePersona(partnerName) {
        var persona = getPersona(partnerName);
        var issues = [];
        
        // 检查必填字段
        if (!persona.identity.name) {
            issues.push('缺少对方名称');
        }
        
        // 检查数据完整性
        if (persona.speaking_style.language_habits.length === 0 && 
            persona.speaking_style.common_phrases.length === 0) {
            issues.push('缺少说话风格信息');
        }
        
        if (!persona.emotional_pattern.attachment_type) {
            issues.push('缺少情感依恋类型');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    /* ── 导出人格数据 ── */
    function exportPersona(partnerName) {
        var persona = getPersona(partnerName);
        return JSON.stringify(persona, null, 2);
    }

    /* ── 导入人格数据 ── */
    function importPersona(partnerName, jsonData) {
        try {
            var persona = JSON.parse(jsonData);
            _saveToStorage(partnerName, persona);
            return true;
        } catch (e) {
            console.error('导入人格数据失败:', e);
            return false;
        }
    }

    /* ── 暴露全局接口 ── */
    window.PersonaManager = {
        // 常量
        LAYERS: PERSONA_LAYERS,
        
        // 标签常量
        LOVE_LANGUAGES: LOVE_LANGUAGES,
        LOVE_LANGUAGES_TEXT: LOVE_LANGUAGES_TEXT,
        ZODIAC_SIGNS: ZODIAC_SIGNS,
        ZODIAC_SIGNS_TEXT: ZODIAC_SIGNS_TEXT,
        MBTI_TYPES: MBTI_TYPES,
        MBTI_TYPES_TEXT: MBTI_TYPES_TEXT,
        PERSONALITY_TAGS: PERSONALITY_TAGS,
        PERSONALITY_TAGS_TEXT: PERSONALITY_TAGS_TEXT,
        
        // 基础操作
        create: createPersona,
        get: getPersona,
        update: updatePersona,
        delete: deletePersona,
        list: listPersonas,
        
        // 层级操作
        updateLayer: updatePersonaLayer,
        getLayer: getPersonaLayer,
        
        // 生成功能
        generateSystemPrompt: generateSystemPrompt,
        generateSummary: generatePersonaSummary,
        
        // 验证和导入导出
        validate: validatePersona,
        export: exportPersona,
        import: importPersona,
        
        // 工具函数
        getDefaultTemplate: function() {
            return JSON.parse(JSON.stringify(DEFAULT_PERSONA));
        }
    };

})();