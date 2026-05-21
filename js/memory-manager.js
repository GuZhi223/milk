/**
 * memory-manager.js - 关系记忆管理模块
 * 管理8个维度的关系记忆数据
 */

(function() {
    'use strict';

    /* ── 记忆维度定义 ── */
    var MEMORY_DIMENSIONS = {
        TIMELINE: 'timeline',           // 关系时间线
        DAILY_PATTERNS: 'daily_patterns', // 日常模式
        SHARED_EXPERIENCES: 'shared_experiences', // 共同经历
        FOOD_PREFERENCES: 'food_preferences', // 饮食偏好
        INTERESTS: 'interests',         // 兴趣爱好
        ARGUMENT_PATTERNS: 'argument_patterns', // 争吵模式
        SWEET_MOMENTS: 'sweet_moments', // 甜蜜瞬间
        BREAKUP_RELATED: 'breakup_related' // 分手相关
    };

    /* ── 默认记忆模板 ── */
    var DEFAULT_MEMORY = {
        timeline: {
            first_met: '', // 认识时间
            first_date: '', // 第一次约会
            relationship_start: '', // 确定关系时间
            important_milestones: [], // 重要里程碑
            breakup_date: '', // 分手时间（如适用）
            breakup_reason: '' // 分手原因（如适用）
        },
        daily_patterns: {
            contact_frequency: '', // 联系频率
            initiator: '', // 谁主动联系
            chat_time_preference: '', // 聊天时间偏好
            date_frequency: '', // 约会频率
            date_plans: [], // 约会计划
            routine_activities: [] // 日常活动
        },
        shared_experiences: {
            places_visited: [], // 去过的地方
            activities_done: [], // 做过的事情
            trips_together: [], // 一起旅行的经历
            inside_jokes: [], // 内部笑话
            memorable_events: [] // 难忘事件
        },
        food_preferences: {
            favorite_foods: [], // 喜欢的食物
            disliked_foods: [], // 不喜欢的食物
            favorite_restaurants: [], // 喜欢的餐厅
            dining_habits: [], // 用餐习惯
            cooking_together: [] // 一起做饭的经历
        },
        interests: {
            personal_hobbies: [], // 个人爱好
            shared_hobbies: [], // 共同爱好
            favorite_music: [], // 喜欢的音乐
            favorite_movies: [], // 喜欢的电影
            favorite_books: [], // 喜欢的书籍
            shared_content: [] // 分享的内容
        },
        argument_patterns: {
            common_causes: [], // 常见吵架原因
            reaction_patterns: [], // 反应模式
            resolution_methods: [], // 和好方式
            triggers: [], // 触发点
            lessons_learned: [] // 学到的教训
        },
        sweet_moments: {
            heartwarming_times: [], // 心动时刻
            love_expressions: [], // 表达爱意的方式
            small_gestures: [], // 小甜蜜
            surprises: [], // 惊喜
            affectionate_behaviors: [] // 亲昵行为
        },
        breakup_related: {
            final_conversations: [], // 最后对话
            unsaid_words: [], // 未说出口的话
            regrets: [], // 遗憾
            closure_achieved: false, // 是否得到closure
            lessons_learned: [] // 学到的教训
        }
    };

    /* ── 存储键前缀 ── */
    var STORAGE_PREFIX = 'MEMORY_';

    /* ── 本地存储管理 ── */
    function _getStorageKey(partnerName) {
        return STORAGE_PREFIX + (partnerName || 'default').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    }

    function _saveToStorage(partnerName, memoryData) {
        var key = _getStorageKey(partnerName);
        try {
            localStorage.setItem(key, JSON.stringify(memoryData));
            return true;
        } catch (e) {
            console.error('保存记忆数据失败:', e);
            return false;
        }
    }

    function _loadFromStorage(partnerName) {
        var key = _getStorageKey(partnerName);
        try {
            var data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载记忆数据失败:', e);
            return null;
        }
    }

    /* ── 创建新记忆数据 ── */
    function createMemory(partnerName, initialData) {
        var memory = JSON.parse(JSON.stringify(DEFAULT_MEMORY));
        
        // 合并初始数据
        if (initialData) {
            for (var dimension in initialData) {
                if (initialData.hasOwnProperty(dimension) && memory[dimension]) {
                    Object.assign(memory[dimension], initialData[dimension]);
                }
            }
        }

        // 保存到存储
        _saveToStorage(partnerName, memory);
        
        return memory;
    }

    /* ── 获取记忆数据 ── */
    function getMemory(partnerName) {
        var memory = _loadFromStorage(partnerName);
        if (!memory) {
            memory = createMemory(partnerName);
        }
        return memory;
    }

    /* ── 更新记忆数据 ── */
    function updateMemory(partnerName, updates) {
        var memory = getMemory(partnerName);
        
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

        memory = deepMerge(memory, updates);
        _saveToStorage(partnerName, memory);
        
        return memory;
    }

    /* ── 更新特定维度的记忆数据 ── */
    function updateMemoryDimension(partnerName, dimensionName, dimensionData) {
        var memory = getMemory(partnerName);
        
        if (memory[dimensionName]) {
            Object.assign(memory[dimensionName], dimensionData);
            _saveToStorage(partnerName, memory);
            return memory;
        } else {
            console.error('无效的记忆维度名称:', dimensionName);
            return null;
        }
    }

    /* ── 获取特定维度的记忆数据 ── */
    function getMemoryDimension(partnerName, dimensionName) {
        var memory = getMemory(partnerName);
        return memory[dimensionName] || null;
    }

    /* ── 添加记忆条目 ── */
    function addMemoryEntry(partnerName, dimensionName, fieldName, entry) {
        var memory = getMemory(partnerName);
        
        if (!memory[dimensionName]) {
            console.error('无效的记忆维度名称:', dimensionName);
            return false;
        }
        
        if (!memory[dimensionName][fieldName]) {
            memory[dimensionName][fieldName] = [];
        }
        
        if (Array.isArray(memory[dimensionName][fieldName])) {
            memory[dimensionName][fieldName].push(entry);
            _saveToStorage(partnerName, memory);
            return true;
        } else {
            console.error('字段不是数组类型:', fieldName);
            return false;
        }
    }

    /* ── 删除记忆条目 ── */
    function removeMemoryEntry(partnerName, dimensionName, fieldName, index) {
        var memory = getMemory(partnerName);
        
        if (!memory[dimensionName] || !memory[dimensionName][fieldName]) {
            return false;
        }
        
        if (Array.isArray(memory[dimensionName][fieldName]) && index >= 0 && index < memory[dimensionName][fieldName].length) {
            memory[dimensionName][fieldName].splice(index, 1);
            _saveToStorage(partnerName, memory);
            return true;
        }
        
        return false;
    }

    /* ── 增量追加记忆 ── */
    
    /**
     * 数组去重合并辅助函数
     * @param {Array} existing - 已有数组
     * @param {Array} newArray - 新数组
     * @returns {Array} 合并去重后的数组
     */
    function _mergeArrays(existing, newArray) {
        if (!Array.isArray(existing) || !Array.isArray(newArray)) {
            return existing;
        }
        
        // 使用Set进行去重
        var mergedSet = new Set(existing);
        newArray.forEach(function(item) {
            if (item && typeof item === 'string') {
                // 对字符串进行trim后比较
                var trimmed = item.trim();
                if (trimmed && !mergedSet.has(trimmed)) {
                    mergedSet.add(trimmed);
                }
            } else if (item) {
                // 对非字符串项直接添加（如对象）
                mergedSet.add(item);
            }
        });
        
        return Array.from(mergedSet);
    }

    /**
     * 增量追加记忆数据
     * 支持从新聊天记录中提取的记忆合并到已有数据中
     * @param {string} partnerName - 对话伙伴名称
     * @param {object} newMemoryData - 新的记忆数据（可以是部分维度）
     * @returns {object|null} 合并后的记忆数据
     */
    function appendMemory(partnerName, newMemoryData) {
        if (!newMemoryData || typeof newMemoryData !== 'object') {
            console.error('无效的记忆数据');
            return null;
        }

        var memory = getMemory(partnerName);
        
        // 遍历新数据的每个维度
        for (var dimension in newMemoryData) {
            if (newMemoryData.hasOwnProperty(dimension) && memory[dimension]) {
                var dimensionData = newMemoryData[dimension];
                
                // 遍历维度中的每个字段
                for (var field in dimensionData) {
                    if (dimensionData.hasOwnProperty(field) && memory[dimension][field] !== undefined) {
                        var existingValue = memory[dimension][field];
                        var newValue = dimensionData[field];
                        
                        if (Array.isArray(existingValue)) {
                            // 数组字段：去重合并
                            memory[dimension][field] = _mergeArrays(existingValue, 
                                Array.isArray(newValue) ? newValue : [newValue]);
                        } else if (typeof existingValue === 'string' && typeof newValue === 'string') {
                            // 字符串字段：如果已有值非空则保留，否则使用新值
                            if (!existingValue && newValue) {
                                memory[dimension][field] = newValue;
                            }
                        } else if (typeof existingValue === 'boolean' && typeof newValue === 'boolean') {
                            // 布尔字段：使用新值
                            memory[dimension][field] = newValue;
                        }
                    }
                }
            }
        }
        
        // 保存到存储
        _saveToStorage(partnerName, memory);
        
        return memory;
    }

    /**
     * 批量追加记忆条目（带去重）
     * @param {string} partnerName - 对话伙伴名称
     * @param {string} dimensionName - 维度名称
     * @param {string} fieldName - 字段名称
     * @param {Array} entries - 要追加的条目数组
     * @returns {boolean} 是否追加成功
     */
    function appendMemoryEntries(partnerName, dimensionName, fieldName, entries) {
        var memory = getMemory(partnerName);
        
        if (!memory[dimensionName]) {
            console.error('无效的记忆维度名称:', dimensionName);
            return false;
        }
        
        if (!Array.isArray(memory[dimensionName][fieldName])) {
            console.error('字段不是数组类型:', fieldName);
            return false;
        }
        
        // 合并去重
        memory[dimensionName][fieldName] = _mergeArrays(memory[dimensionName][fieldName], entries);
        
        // 保存到存储
        _saveToStorage(partnerName, memory);
        
        return true;
    }

    /* ── 删除记忆数据 ── */
    function deleteMemory(partnerName) {
        var key = _getStorageKey(partnerName);
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('删除记忆数据失败:', e);
            return false;
        }
    }

    /* ── 列出所有记忆数据 ── */
    function listMemories() {
        var memories = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key.startsWith(STORAGE_PREFIX)) {
                var partnerName = key.substring(STORAGE_PREFIX.length).replace(/_/g, ' ');
                memories.push(partnerName);
            }
        }
        return memories;
    }

    /* ── 生成记忆摘要 ── */
    function generateMemorySummary(partnerName) {
        var memory = getMemory(partnerName);
        var summary = {
            dimensions: {}
        };
        
        // 收集每个维度的关键信息
        for (var dimension in memory) {
            if (memory.hasOwnProperty(dimension)) {
                var dimensionData = memory[dimension];
                var dimensionSummary = {};
                
                // 统计数组字段的条目数量
                for (var field in dimensionData) {
                    if (dimensionData.hasOwnProperty(field)) {
                        if (Array.isArray(dimensionData[field])) {
                            dimensionSummary[field + '_count'] = dimensionData[field].length;
                        } else if (dimensionData[field]) {
                            dimensionSummary[field] = dimensionData[field];
                        }
                    }
                }
                
                summary.dimensions[dimension] = dimensionSummary;
            }
        }
        
        return summary;
    }

    /* ── 生成关系时间线 ── */
    function generateTimeline(partnerName) {
        var memory = getMemory(partnerName);
        var timeline = [];
        
        // 添加时间线事件
        if (memory.timeline.first_met) {
            timeline.push({
                date: memory.timeline.first_met,
                event: '初次相遇',
                type: 'milestone'
            });
        }
        
        if (memory.timeline.first_date) {
            timeline.push({
                date: memory.timeline.first_date,
                event: '第一次约会',
                type: 'milestone'
            });
        }
        
        if (memory.timeline.relationship_start) {
            timeline.push({
                date: memory.timeline.relationship_start,
                event: '确定关系',
                type: 'milestone'
            });
        }
        
        // 添加重要里程碑
        if (memory.timeline.important_milestones) {
            memory.timeline.important_milestones.forEach(function(milestone) {
                timeline.push({
                    date: milestone.date,
                    event: milestone.event,
                    type: 'milestone'
                });
            });
        }
        
        if (memory.timeline.breakup_date) {
            timeline.push({
                date: memory.timeline.breakup_date,
                event: '分手',
                type: 'breakup'
            });
        }
        
        // 按日期排序
        timeline.sort(function(a, b) {
            return new Date(a.date) - new Date(b.date);
        });
        
        return timeline;
    }

    /* ── 生成关系记忆文本 ── */
    function generateMemoryText(partnerName) {
        var memory = getMemory(partnerName);
        var text = '# 关系记忆\n\n';
        
        // 关系时间线
        text += '## 关系时间线\n';
        if (memory.timeline.first_met) {
            text += '- 认识时间：' + memory.timeline.first_met + '\n';
        }
        if (memory.timeline.relationship_start) {
            text += '- 确定关系：' + memory.timeline.relationship_start + '\n';
        }
        if (memory.timeline.breakup_date) {
            text += '- 分手时间：' + memory.timeline.breakup_date + '\n';
        }
        text += '\n';
        
        // 日常模式
        text += '## 日常模式\n';
        if (memory.daily_patterns.contact_frequency) {
            text += '- 联系频率：' + memory.daily_patterns.contact_frequency + '\n';
        }
        if (memory.daily_patterns.date_frequency) {
            text += '- 约会频率：' + memory.daily_patterns.date_frequency + '\n';
        }
        text += '\n';
        
        // 共同经历
        text += '## 共同经历\n';
        if (memory.shared_experiences.places_visited.length > 0) {
            text += '- 去过的地方：' + memory.shared_experiences.places_visited.join('、') + '\n';
        }
        if (memory.shared_experiences.inside_jokes.length > 0) {
            text += '- 内部笑话：' + memory.shared_experiences.inside_jokes.join('、') + '\n';
        }
        text += '\n';
        
        // 甜蜜瞬间
        text += '## 甜蜜瞬间\n';
        if (memory.sweet_moments.heartwarming_times.length > 0) {
            text += '- 心动时刻：' + memory.sweet_moments.heartwarming_times.join('、') + '\n';
        }
        if (memory.sweet_moments.love_expressions.length > 0) {
            text += '- 表达爱意：' + memory.sweet_moments.love_expressions.join('、') + '\n';
        }
        text += '\n';
        
        // 争吵模式
        text += '## 争吵模式\n';
        if (memory.argument_patterns.common_causes.length > 0) {
            text += '- 常见原因：' + memory.argument_patterns.common_causes.join('、') + '\n';
        }
        if (memory.argument_patterns.resolution_methods.length > 0) {
            text += '- 和好方式：' + memory.argument_patterns.resolution_methods.join('、') + '\n';
        }
        text += '\n';
        
        return text;
    }

    /* ── 验证记忆数据完整性 ── */
    function validateMemory(partnerName) {
        var memory = getMemory(partnerName);
        var issues = [];
        
        // 检查关键时间点
        if (!memory.timeline.first_met) {
            issues.push('缺少初次相遇时间');
        }
        
        // 检查是否有共同经历
        var hasSharedExperiences = false;
        for (var field in memory.shared_experiences) {
            if (memory.shared_experiences.hasOwnProperty(field) && 
                Array.isArray(memory.shared_experiences[field]) && 
                memory.shared_experiences[field].length > 0) {
                hasSharedExperiences = true;
                break;
            }
        }
        
        if (!hasSharedExperiences) {
            issues.push('缺少共同经历信息');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }

    /* ── 导出记忆数据 ── */
    function exportMemory(partnerName) {
        var memory = getMemory(partnerName);
        return JSON.stringify(memory, null, 2);
    }

    /* ── 导入记忆数据 ── */
    function importMemory(partnerName, jsonData) {
        try {
            var memory = JSON.parse(jsonData);
            _saveToStorage(partnerName, memory);
            return true;
        } catch (e) {
            console.error('导入记忆数据失败:', e);
            return false;
        }
    }

    /* ── 暴露全局接口 ── */
    window.MemoryManager = {
        // 常量
        DIMENSIONS: MEMORY_DIMENSIONS,
        
        // 基础操作
        create: createMemory,
        get: getMemory,
        update: updateMemory,
        delete: deleteMemory,
        list: listMemories,
        
        // 维度操作
        updateDimension: updateMemoryDimension,
        getDimension: getMemoryDimension,
        
        // 条目操作
        addEntry: addMemoryEntry,
        removeEntry: removeMemoryEntry,
        
        // 增量追加（新功能）
        appendMemory: appendMemory,
        appendEntries: appendMemoryEntries,
        
        // 生成功能
        generateSummary: generateMemorySummary,
        generateTimeline: generateTimeline,
        generateText: generateMemoryText,
        
        // 验证和导入导出
        validate: validateMemory,
        export: exportMemory,
        import: importMemory,
        
        // 工具函数
        getDefaultTemplate: function() {
            return JSON.parse(JSON.stringify(DEFAULT_MEMORY));
        }
    };

})();