/**
 * ai-service.js - AI对话服务模块
 * 封装OpenAI兼容API调用、SSE流式解析和上下文构建
 */

(function() {
    'use strict';

    /* ── 预设提供商 ── */
    const AI_PRESETS = {
        deepseek: {
            name: 'DeepSeek',
            apiUrl: 'https://api.deepseek.com/v1/chat/completions',
            model: 'deepseek-chat',
            icon: '🔮',
            desc: '国产高性价比大模型'
        },
        mimo: {
            name: 'Mimo (MiniMax)',
            apiUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
            model: 'MiniMax-Text-01',
            icon: '🤖',
            desc: 'MiniMax 对话模型'
        },
        glm: {
            name: 'GLM (智谱)',
            apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            model: 'glm-4-flash',
            icon: '✨',
            desc: '智谱AI 免费模型'
        }
    };

    window.AI_PRESETS = AI_PRESETS;

    /* ── 构建上下文消息 ── */
    function buildContextMessages(settings, messages) {
        var contextMsgs = [];
        var maxCtx = settings.aiMaxContextMessages || 20;

        // 系统提示词
        var systemContent = '';
        var customPrompt = (settings.aiSystemPrompt || '').trim();
        if (customPrompt) {
            systemContent = customPrompt;
        } else {
            systemContent = '你是一个温柔体贴的聊天伴侣，说话自然亲切，善于表达情感。';
        }
        // 追加身份信息
        var partnerName = settings.partnerName || '对方';
        var myName = settings.myName || '我';
        systemContent += '\n\n你的名字是「' + partnerName + '」，正在和「' + myName + '」聊天。';
        systemContent += '请以「' + partnerName + '」的身份回复，保持自然的聊天语气，回复简洁温馨，不要太长。';

        contextMsgs.push({ role: 'system', content: systemContent });

        // 取最近N条消息作为上下文
        var recentMsgs = messages.slice(-maxCtx);
        for (var i = 0; i < recentMsgs.length; i++) {
            var m = recentMsgs[i];
            if (!m.text || m.type === 'system') continue; // 跳过系统消息和纯图片
            if (m.sender === 'user') {
                contextMsgs.push({ role: 'user', content: m.text });
            } else {
                contextMsgs.push({ role: 'assistant', content: m.text });
            }
        }

        return contextMsgs;
    }

    /* ── 流式调用 (SSE) ── */
    function callAIServiceStream(settings, contextMsgs, onChunk, onDone, onError) {
        var apiUrl = settings.aiApiUrl || '';
        var apiKey = settings.aiApiKey || '';
        var model = settings.aiModel || '';
        var maxTokens = settings.aiMaxTokens || 512;
        var temperature = settings.aiTemperature !== undefined ? settings.aiTemperature : 0.8;

        if (!apiUrl || !apiKey || !model) {
            onError('AI配置不完整，请检查API地址、密钥和模型名称');
            return null;
        }

        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: model,
                messages: contextMsgs,
                max_tokens: maxTokens,
                temperature: temperature,
                stream: true
            }),
            signal: controller.signal
        }).then(function(response) {
            clearTimeout(timeoutId);
            if (!response.ok) {
                return response.text().then(function(text) {
                    var errMsg = 'API请求失败 (' + response.status + ')';
                    try {
                        var errJson = JSON.parse(text);
                        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
                    } catch(e) {}
                    onError(errMsg);
                });
            }

            var reader = response.body.getReader();
            var decoder = new TextDecoder();
            var buffer = '';

            function read() {
                reader.read().then(function(result) {
                    if (result.done) {
                        onDone();
                        return;
                    }

                    buffer += decoder.decode(result.value, { stream: true });
                    var lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i].trim();
                        if (!line || line === 'data: [DONE]') continue;
                        if (!line.startsWith('data: ')) continue;

                        try {
                            var json = JSON.parse(line.substring(6));
                            var delta = json.choices && json.choices[0] && json.choices[0].delta;
                            if (delta && delta.content) {
                                onChunk(delta.content);
                            }
                        } catch(e) { /* 忽略解析错误 */ }
                    }

                    read();
                }).catch(function(err) {
                    if (err.name === 'AbortError') {
                        onError('请求超时（30秒）');
                    } else {
                        onError('读取响应失败: ' + err.message);
                    }
                });
            }

            read();
        }).catch(function(err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                onError('请求超时（30秒）');
            } else {
                onError('网络请求失败: ' + err.message);
            }
        });

        return controller;
    }

    /* ── 非流式调用 (普通请求) ── */
    function callAIService(settings, contextMsgs, callback) {
        var apiUrl = settings.aiApiUrl || '';
        var apiKey = settings.aiApiKey || '';
        var model = settings.aiModel || '';
        var maxTokens = settings.aiMaxTokens || 512;
        var temperature = settings.aiTemperature !== undefined ? settings.aiTemperature : 0.8;

        if (!apiUrl || !apiKey || !model) {
            callback('AI配置不完整，请检查API地址、密钥和模型名称', null);
            return null;
        }

        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 30000);

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: model,
                messages: contextMsgs,
                max_tokens: maxTokens,
                temperature: temperature
            }),
            signal: controller.signal
        }).then(function(response) {
            clearTimeout(timeoutId);
            if (!response.ok) {
                return response.text().then(function(text) {
                    var errMsg = 'API请求失败 (' + response.status + ')';
                    try {
                        var errJson = JSON.parse(text);
                        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
                    } catch(e) {}
                    callback(errMsg, null);
                });
            }
            return response.json();
        }).then(function(data) {
            if (!data) return;
            var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (content) {
                callback(null, content.trim());
            } else {
                callback('AI返回了空内容', null);
            }
        }).catch(function(err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                callback('请求超时（30秒）', null);
            } else {
                callback('网络请求失败: ' + err.message, null);
            }
        });

        return controller;
    }

    /* ── 测试连接 ── */
    function testAIConnection(settings, callback) {
        var testMsgs = [
            { role: 'system', content: '你是一个助手。请用一句话简短回复。' },
            { role: 'user', content: '你好，请回复"连接成功"' }
        ];
        callAIService(settings, testMsgs, function(err, result) {
            if (err) {
                callback(false, err);
            } else {
                callback(true, result);
            }
        });
    }

    /* ── 构建基于Skill的上下文消息 ── */
    function buildContextMessagesWithSkill(settings, messages, skillName) {
        var contextMsgs = [];
        var maxCtx = settings.aiMaxContextMessages || 20;

        // 获取Skill数据
        var skill = null;
        if (window.SkillBuilder && skillName) {
            skill = window.SkillBuilder.get(skillName);
        }

        // 系统提示词
        var systemContent = '';
        
        // 检查是否启用ex-skill提示词
        var useExSkillPrompt = settings.useExSkillPrompt && skill;
        
        if (useExSkillPrompt) {
            // 使用Ex-Skill风格的提示词生成
            var userName = settings.myName || '我';
            systemContent = window.SkillBuilder.generateSystemPrompt(skillName, userName);
            
            // 添加ex-skill提示词标识
            systemContent = '【Ex-Skill智能提示词已启用】\n\n' + systemContent;
        } else if (skill) {
            // 使用Skill生成系统提示词（原有逻辑）
            var userName = settings.myName || '我';
            systemContent = window.SkillBuilder.generateSystemPrompt(skillName, userName);
        } else {
            // 回退到默认提示词
            var customPrompt = (settings.aiSystemPrompt || '').trim();
            if (customPrompt) {
                systemContent = customPrompt;
            } else {
                systemContent = '你是一个温柔体贴的聊天伴侣，说话自然亲切，善于表达情感。';
            }
            // 追加身份信息
            var partnerName = settings.partnerName || '对方';
            var myName = settings.myName || '我';
            systemContent += '\n\n你的名字是「' + partnerName + '」，正在和「' + myName + '」聊天。';
            systemContent += '请以「' + partnerName + '」的身份回复，保持自然的聊天语气，回复简洁温馨，不要太长。';
        }

        contextMsgs.push({ role: 'system', content: systemContent });

        // 取最近N条消息作为上下文
        var recentMsgs = messages.slice(-maxCtx);
        for (var i = 0; i < recentMsgs.length; i++) {
            var m = recentMsgs[i];
            if (!m.text || m.type === 'system') continue; // 跳过系统消息和纯图片
            if (m.sender === 'user') {
                contextMsgs.push({ role: 'user', content: m.text });
            } else {
                contextMsgs.push({ role: 'assistant', content: m.text });
            }
        }

        return contextMsgs;
    }

    /* ── 检索相关记忆 ── */
    function retrieveRelevantMemory(message, skillName) {
        if (!window.SkillBuilder || !skillName) {
            return [];
        }

        var skill = window.SkillBuilder.get(skillName);
        if (!skill || !skill.memory) {
            return [];
        }

        var memory = skill.memory;
        var relevantMemories = [];
        var keywords = extractKeywords(message);

        // 搜索记忆
        keywords.forEach(function(keyword) {
            // 搜索共同经历
            if (memory.shared_experiences) {
                if (memory.shared_experiences.memorable_events) {
                    memory.shared_experiences.memorable_events.forEach(function(event) {
                        if (event.toLowerCase().includes(keyword.toLowerCase())) {
                            relevantMemories.push({
                                type: 'shared_experience',
                                content: event,
                                relevance: 1
                            });
                        }
                    });
                }
                if (memory.shared_experiences.inside_jokes) {
                    memory.shared_experiences.inside_jokes.forEach(function(joke) {
                        if (joke.toLowerCase().includes(keyword.toLowerCase())) {
                            relevantMemories.push({
                                type: 'inside_joke',
                                content: joke,
                                relevance: 2
                            });
                        }
                    });
                }
            }

            // 搜索甜蜜瞬间
            if (memory.sweet_moments) {
                if (memory.sweet_moments.heartwarming_times) {
                    memory.sweet_moments.heartwarming_times.forEach(function(moment) {
                        if (moment.toLowerCase().includes(keyword.toLowerCase())) {
                            relevantMemories.push({
                                type: 'sweet_moment',
                                content: moment,
                                relevance: 1
                            });
                        }
                    });
                }
            }

            // 搜索共同去过的地方
            if (memory.shared_experiences && memory.shared_experiences.places_visited) {
                memory.shared_experiences.places_visited.forEach(function(place) {
                    if (place.toLowerCase().includes(keyword.toLowerCase())) {
                        relevantMemories.push({
                            type: 'place_visited',
                            content: place,
                            relevance: 1
                        });
                    }
                });
            }
        });

        // 去重并按相关性排序
        relevantMemories = deduplicateMemories(relevantMemories);
        relevantMemories.sort(function(a, b) {
            return b.relevance - a.relevance;
        });

        return relevantMemories.slice(0, 3); // 返回最相关的3条记忆
    }

    /* ── 提取关键词 ── */
    function extractKeywords(text) {
        if (!text) return [];
        
        // 简单的关键词提取
        var keywords = [];
        var words = text.split(/[\s,，。！？、；：""''（）【】\[\]{}]+/);
        
        words.forEach(function(word) {
            word = word.trim();
            if (word.length > 1 && word.length < 10) {
                keywords.push(word);
            }
        });
        
        return keywords;
    }

    /* ── 去重记忆 ── */
    function deduplicateMemories(memories) {
        var seen = {};
        return memories.filter(function(memory) {
            var key = memory.type + ':' + memory.content;
            if (seen[key]) {
                return false;
            }
            seen[key] = true;
            return true;
        });
    }

    /* ── 构建带记忆的上下文消息 ── 
     * 注意：此函数会在buildContextMessagesWithSkill的基础上追加相关记忆。
     * 但由于SkillBuilder.generateSystemPrompt已经包含了完整的记忆信息，
     * 使用此函数可能导致记忆重复。建议优先使用buildContextMessagesWithSkill。
     * 此函数保留作为备用，用于需要动态检索相关记忆的高级场景。
     */
    function buildContextMessagesWithMemory(settings, messages, skillName) {
        var contextMsgs = buildContextMessagesWithSkill(settings, messages, skillName);
        
        // 如果有Skill，尝试添加相关记忆
        if (skillName && messages.length > 0) {
            var lastUserMessage = '';
            for (var i = messages.length - 1; i >= 0; i--) {
                if (messages[i].sender === 'user' && messages[i].text) {
                    lastUserMessage = messages[i].text;
                    break;
                }
            }
            
            if (lastUserMessage) {
                var relevantMemories = retrieveRelevantMemory(lastUserMessage, skillName);
                if (relevantMemories.length > 0) {
                    // 在系统提示词中添加相关记忆
                    var memoryContext = '\n\n【相关记忆】\n';
                    memoryContext += '以下是一些与当前对话相关的记忆：\n';
                    relevantMemories.forEach(function(memory) {
                        memoryContext += '- ' + memory.content + '\n';
                    });
                    memoryContext += '请自然地融入这些记忆进行对话。\n';
                    
                    // 修改系统提示词
                    if (contextMsgs.length > 0 && contextMsgs[0].role === 'system') {
                        contextMsgs[0].content += memoryContext;
                    }
                }
            }
        }
        
        return contextMsgs;
    }

    /* ── 暴露全局接口 ── */
    window.AIService = {
        buildContextMessages: buildContextMessages,
        buildContextMessagesWithSkill: buildContextMessagesWithSkill,
        buildContextMessagesWithMemory: buildContextMessagesWithMemory,
        callAIService: callAIService,
        callAIServiceStream: callAIServiceStream,
        testAIConnection: testAIConnection,
        retrieveRelevantMemory: retrieveRelevantMemory,
        presets: AI_PRESETS
    };

})();
