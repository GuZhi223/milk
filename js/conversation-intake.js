/**
 * conversation-intake.js - 对话式信息录入模块
 * 实现分阶段引导式工作流，收集用户关于聊天对象的信息
 */

(function() {
    'use strict';

    /* ── 录入状态 ── */
    var INTAKE_STATES = {
        IDLE: 'idle',
        COLLECTING_NAME: 'collecting_name',
        COLLECTING_BASIC_INFO: 'collecting_basic_info',
        COLLECTING_PERSONALITY: 'collecting_personality',
        COLLECTING_TAGS: 'collecting_tags',  // 新增：标签收集步骤
        CONFIRMING: 'confirming',
        COMPLETED: 'completed'
    };

    /* ── 当前状态 ── */
    var currentState = INTAKE_STATES.IDLE;
    var currentData = {};
    var onCompleteCallback = null;
    var onCancelCallback = null;
    var originalContainerId = null; // 保存原始容器ID

    /* ── 状态管理 ── */
    function _setState(newState) {
        currentState = newState;
        _updateUI();
    }

    function _resetState() {
        currentState = INTAKE_STATES.IDLE;
        currentData = {};
        onCompleteCallback = null;
        onCancelCallback = null;
    }

    function _restoreContainerId() {
        if (originalContainerId) {
            var container = document.getElementById('intake-container');
            if (container) {
                container.id = originalContainerId;
            }
            originalContainerId = null;
        }
    }

    /* ── UI更新 ── */
    function _updateUI() {
        var container = document.getElementById('intake-container');
        if (!container) return;

        switch (currentState) {
            case INTAKE_STATES.IDLE:
                _renderWelcome(container);
                break;
            case INTAKE_STATES.COLLECTING_NAME:
                _renderNameInput(container);
                break;
            case INTAKE_STATES.COLLECTING_BASIC_INFO:
                _renderBasicInfoInput(container);
                break;
            case INTAKE_STATES.COLLECTING_PERSONALITY:
                _renderPersonalityInput(container);
                break;
            case INTAKE_STATES.COLLECTING_TAGS:
                _renderTagsInput(container);
                break;
            case INTAKE_STATES.CONFIRMING:
                _renderConfirmation(container);
                break;
            case INTAKE_STATES.COMPLETED:
                _renderCompletion(container);
                break;
        }
    }

    /* ── 渲染函数 ── */
    function _renderWelcome(container) {
        container.innerHTML = `
            <div class="intake-welcome">
                <div class="intake-header">
                    <h2>创建AI对话伙伴</h2>
                    <p>我将帮助你创建一个专属的AI对话伙伴。只需要3个简单的问题，就能开始对话。</p>
                </div>
                <div class="intake-actions">
                    <button id="intake-start" class="btn-primary">开始创建</button>
                    <button id="intake-cancel" class="btn-secondary">取消</button>
                </div>
            </div>
        `;

        document.getElementById('intake-start').onclick = function() {
            _setState(INTAKE_STATES.COLLECTING_NAME);
        };

        document.getElementById('intake-cancel').onclick = function() {
            if (onCancelCallback) onCancelCallback();
            _restoreContainerId();
            _resetState();
        };
    }

    function _renderNameInput(container) {
        container.innerHTML = `
            <div class="intake-step">
                <div class="intake-header">
                    <h2>第一步：对方的称呼</h2>
                    <p>请告诉我你想要创建的AI对话伙伴的称呼是什么？可以是昵称、外号或者任何你喜欢的称呼。</p>
                </div>
                <div class="intake-input-group">
                    <input type="text" id="intake-name" placeholder="请输入称呼" maxlength="20" />
                    <div class="intake-hint">1-20个字符</div>
                </div>
                <div class="intake-actions">
                    <button id="intake-next" class="btn-primary">下一步</button>
                    <button id="intake-back" class="btn-secondary">返回</button>
                </div>
            </div>
        `;

        document.getElementById('intake-next').onclick = function() {
            var name = document.getElementById('intake-name').value.trim();
            if (!name) {
                _showError('请输入称呼');
                return;
            }
            currentData.partner_name = name;
            _setState(INTAKE_STATES.COLLECTING_BASIC_INFO);
        };

        document.getElementById('intake-back').onclick = function() {
            _setState(INTAKE_STATES.IDLE);
        };
    }

    function _renderBasicInfoInput(container) {
        container.innerHTML = `
            <div class="intake-step">
                <div class="intake-header">
                    <h2>第二步：基本信息</h2>
                    <p>用一句话简单介绍一下对方。比如："25岁，程序员，在北京工作"或者"大学同学，喜欢旅行和摄影"。</p>
                </div>
                <div class="intake-input-group">
                    <textarea id="intake-basic-info" placeholder="请输入基本信息（可选）" rows="3"></textarea>
                    <div class="intake-hint">可以跳过，直接点击下一步</div>
                </div>
                <div class="intake-examples">
                    <div class="example-title">示例：</div>
                    <div class="example-item">"25岁，程序员，在北京工作"</div>
                    <div class="example-item">"大学同学，喜欢旅行和摄影"</div>
                    <div class="example-item">"温柔体贴，但有时候会固执"</div>
                </div>
                <div class="intake-actions">
                    <button id="intake-next" class="btn-primary">下一步</button>
                    <button id="intake-skip" class="btn-secondary">跳过</button>
                    <button id="intake-back" class="btn-secondary">返回</button>
                </div>
            </div>
        `;

        document.getElementById('intake-next').onclick = function() {
            var basicInfo = document.getElementById('intake-basic-info').value.trim();
            currentData.basic_info = basicInfo;
            _setState(INTAKE_STATES.COLLECTING_PERSONALITY);
        };

        document.getElementById('intake-skip').onclick = function() {
            currentData.basic_info = '';
            _setState(INTAKE_STATES.COLLECTING_PERSONALITY);
        };

        document.getElementById('intake-back').onclick = function() {
            _setState(INTAKE_STATES.COLLECTING_NAME);
        };
    }

    function _renderPersonalityInput(container) {
        container.innerHTML = `
            <div class="intake-step">
                <div class="intake-header">
                    <h2>第三步：性格印象</h2>
                    <p>描述你对对方的性格印象。可以包括说话风格、情绪特点、行为习惯等。这些描述将帮助AI更好地模拟对方的性格。</p>
                </div>
                <div class="intake-input-group">
                    <textarea id="intake-personality" placeholder="请输入性格印象（可选）" rows="4"></textarea>
                    <div class="intake-hint">可以跳过，直接点击下一步</div>
                </div>
                <div class="intake-examples">
                    <div class="example-title">示例：</div>
                    <div class="example-item">"说话喜欢用'~'结尾，生气时会沉默不语，但过一会儿就好了"</div>
                    <div class="example-item">"嘴硬心软，说话语气硬但会默默关心人，喜欢用表情包代替文字"</div>
                    <div class="example-item">"平时话不多，但对亲近的人会说很多，容易吃醋但不会直接说"</div>
                </div>
                <div class="intake-actions">
                    <button id="intake-next" class="btn-primary">下一步</button>
                    <button id="intake-skip" class="btn-secondary">跳过</button>
                    <button id="intake-back" class="btn-secondary">返回</button>
                </div>
            </div>
        `;

        document.getElementById('intake-next').onclick = function() {
            var personality = document.getElementById('intake-personality').value.trim();
            currentData.personality_impression = personality;
            _setState(INTAKE_STATES.COLLECTING_TAGS);
        };

        document.getElementById('intake-skip').onclick = function() {
            currentData.personality_impression = '';
            _setState(INTAKE_STATES.COLLECTING_TAGS);
        };

        document.getElementById('intake-back').onclick = function() {
            _setState(INTAKE_STATES.COLLECTING_BASIC_INFO);
        };
    }

    function _renderTagsInput(container) {
        // 初始化标签数据
        if (!currentData.persona_tags) {
            currentData.persona_tags = {
                love_languages: [],
                zodiac: '',
                mbti: '',
                personality_tags: []
            };
        }

        var tags = currentData.persona_tags;

        container.innerHTML = `
            <div class="intake-step">
                <div class="intake-header">
                    <h2>第四步：人格标签（可选）</h2>
                    <p>选择一些标签来描述对方的特点。这些标签将被翻译为具体的行为规则，帮助AI更准确地模拟对方的性格。所有标签都是可选的，可以直接跳过。</p>
                </div>
                
                <div class="intake-tags-section">
                    <div class="tags-group">
                        <div class="tags-label">爱的语言（可多选）：</div>
                        <div class="tags-options">
                            <button class="tag-btn ${tags.love_languages.includes('words_of_affirmation') ? 'active' : ''}" data-type="love_languages" data-value="words_of_affirmation">肯定的言辞</button>
                            <button class="tag-btn ${tags.love_languages.includes('quality_time') ? 'active' : ''}" data-type="love_languages" data-value="quality_time">精心的时刻</button>
                            <button class="tag-btn ${tags.love_languages.includes('receiving_gifts') ? 'active' : ''}" data-type="love_languages" data-value="receiving_gifts">接受礼物</button>
                            <button class="tag-btn ${tags.love_languages.includes('acts_of_service') ? 'active' : ''}" data-type="love_languages" data-value="acts_of_service">服务的行动</button>
                            <button class="tag-btn ${tags.love_languages.includes('physical_touch') ? 'active' : ''}" data-type="love_languages" data-value="physical_touch">身体的接触</button>
                        </div>
                    </div>
                    
                    <div class="tags-group">
                        <div class="tags-label">星座：</div>
                        <select id="intake-zodiac" class="tags-select">
                            <option value="">请选择</option>
                            <option value="aries" ${tags.zodiac === 'aries' ? 'selected' : ''}>白羊座</option>
                            <option value="taurus" ${tags.zodiac === 'taurus' ? 'selected' : ''}>金牛座</option>
                            <option value="gemini" ${tags.zodiac === 'gemini' ? 'selected' : ''}>双子座</option>
                            <option value="cancer" ${tags.zodiac === 'cancer' ? 'selected' : ''}>巨蟹座</option>
                            <option value="leo" ${tags.zodiac === 'leo' ? 'selected' : ''}>狮子座</option>
                            <option value="virgo" ${tags.zodiac === 'virgo' ? 'selected' : ''}>处女座</option>
                            <option value="libra" ${tags.zodiac === 'libra' ? 'selected' : ''}>天秤座</option>
                            <option value="scorpio" ${tags.zodiac === 'scorpio' ? 'selected' : ''}>天蝎座</option>
                            <option value="sagittarius" ${tags.zodiac === 'sagittarius' ? 'selected' : ''}>射手座</option>
                            <option value="capricorn" ${tags.zodiac === 'capricorn' ? 'selected' : ''}>摩羯座</option>
                            <option value="aquarius" ${tags.zodiac === 'aquarius' ? 'selected' : ''}>水瓶座</option>
                            <option value="pisces" ${tags.zodiac === 'pisces' ? 'selected' : ''}>双鱼座</option>
                        </select>
                    </div>
                    
                    <div class="tags-group">
                        <div class="tags-label">MBTI类型：</div>
                        <select id="intake-mbti" class="tags-select">
                            <option value="">请选择</option>
                            <option value="INTJ" ${tags.mbti === 'INTJ' ? 'selected' : ''}>INTJ-建筑师</option>
                            <option value="INTP" ${tags.mbti === 'INTP' ? 'selected' : ''}>INTP-逻辑学家</option>
                            <option value="ENTJ" ${tags.mbti === 'ENTJ' ? 'selected' : ''}>ENTJ-指挥官</option>
                            <option value="ENTP" ${tags.mbti === 'ENTP' ? 'selected' : ''}>ENTP-辩论家</option>
                            <option value="INFJ" ${tags.mbti === 'INFJ' ? 'selected' : ''}>INFJ-提倡者</option>
                            <option value="INFP" ${tags.mbti === 'INFP' ? 'selected' : ''}>INFP-调停者</option>
                            <option value="ENFJ" ${tags.mbti === 'ENFJ' ? 'selected' : ''}>ENFJ-主人公</option>
                            <option value="ENFP" ${tags.mbti === 'ENFP' ? 'selected' : ''}>ENFP-竞选者</option>
                            <option value="ISTJ" ${tags.mbti === 'ISTJ' ? 'selected' : ''}>ISTJ-物流师</option>
                            <option value="ISFJ" ${tags.mbti === 'ISFJ' ? 'selected' : ''}>ISFJ-守卫者</option>
                            <option value="ESTJ" ${tags.mbti === 'ESTJ' ? 'selected' : ''}>ESTJ-总经理</option>
                            <option value="ESFJ" ${tags.mbti === 'ESFJ' ? 'selected' : ''}>ESFJ-执政官</option>
                            <option value="ISTP" ${tags.mbti === 'ISTP' ? 'selected' : ''}>ISTP-鉴赏家</option>
                            <option value="ISFP" ${tags.mbti === 'ISFP' ? 'selected' : ''}>ISFP-探险家</option>
                            <option value="ESTP" ${tags.mbti === 'ESTP' ? 'selected' : ''}>ESTP-企业家</option>
                            <option value="ESFP" ${tags.mbti === 'ESFP' ? 'selected' : ''}>ESFP-表演者</option>
                        </select>
                    </div>
                    
                    <div class="tags-group">
                        <div class="tags-label">性格标签（可多选）：</div>
                        <div class="tags-options">
                            <button class="tag-btn ${tags.personality_tags.includes('talkative') ? 'active' : ''}" data-type="personality_tags" data-value="talkative">话痨</button>
                            <button class="tag-btn ${tags.personality_tags.includes('secretive') ? 'active' : ''}" data-type="personality_tags" data-value="secretive">闷骚</button>
                            <button class="tag-btn ${tags.personality_tags.includes('tough_love') ? 'active' : ''}" data-type="personality_tags" data-value="tough_love">嘴硬心软</button>
                            <button class="tag-btn ${tags.personality_tags.includes('cold_war') ? 'active' : ''}" data-type="personality_tags" data-value="cold_war">冷暴力</button>
                            <button class="tag-btn ${tags.personality_tags.includes('clingy') ? 'active' : ''}" data-type="personality_tags" data-value="clingy">粘人</button>
                            <button class="tag-btn ${tags.personality_tags.includes('independent') ? 'active' : ''}" data-type="personality_tags" data-value="independent">独立</button>
                            <button class="tag-btn ${tags.personality_tags.includes('romantic') ? 'active' : ''}" data-type="personality_tags" data-value="romantic">浪漫型</button>
                            <button class="tag-btn ${tags.personality_tags.includes('pragmatic') ? 'active' : ''}" data-type="personality_tags" data-value="pragmatic">务实型</button>
                            <button class="tag-btn ${tags.personality_tags.includes('optimistic') ? 'active' : ''}" data-type="personality_tags" data-value="optimistic">乐观派</button>
                            <button class="tag-btn ${tags.personality_tags.includes('pessimistic') ? 'active' : ''}" data-type="personality_tags" data-value="pessimistic">悲观派</button>
                        </div>
                    </div>
                </div>
                
                <div class="intake-actions">
                    <button id="intake-next" class="btn-primary">下一步</button>
                    <button id="intake-skip" class="btn-secondary">跳过</button>
                    <button id="intake-back" class="btn-secondary">返回</button>
                </div>
            </div>
        `;

        // 绑定标签按钮点击事件
        var tagBtns = container.querySelectorAll('.tag-btn');
        tagBtns.forEach(function(btn) {
            btn.onclick = function() {
                var type = btn.getAttribute('data-type');
                var value = btn.getAttribute('data-value');
                
                if (type === 'love_languages' || type === 'personality_tags') {
                    // 多选标签
                    var index = tags[type].indexOf(value);
                    if (index > -1) {
                        tags[type].splice(index, 1);
                        btn.classList.remove('active');
                    } else {
                        tags[type].push(value);
                        btn.classList.add('active');
                    }
                }
            };
        });

        // 绑定星座和MBTI选择事件
        document.getElementById('intake-zodiac').onchange = function() {
            tags.zodiac = this.value;
        };
        
        document.getElementById('intake-mbti').onchange = function() {
            tags.mbti = this.value;
        };

        document.getElementById('intake-next').onclick = function() {
            currentData.persona_tags = tags;
            _setState(INTAKE_STATES.CONFIRMING);
        };

        document.getElementById('intake-skip').onclick = function() {
            currentData.persona_tags = tags;
            _setState(INTAKE_STATES.CONFIRMING);
        };

        document.getElementById('intake-back').onclick = function() {
            currentData.persona_tags = tags;
            _setState(INTAKE_STATES.COLLECTING_PERSONALITY);
        };
    }

    function _renderConfirmation(container) {
        var basicInfoText = currentData.basic_info || '未提供';
        var personalityText = currentData.personality_impression || '未提供';
        
        // 生成标签摘要
        var tagsSummary = '';
        if (currentData.persona_tags) {
            var tags = currentData.persona_tags;
            var tagParts = [];
            
            if (tags.love_languages && tags.love_languages.length > 0) {
                var loveLanguageNames = tags.love_languages.map(function(lang) {
                    var names = {
                        'words_of_affirmation': '肯定的言辞',
                        'quality_time': '精心的时刻',
                        'receiving_gifts': '接受礼物',
                        'acts_of_service': '服务的行动',
                        'physical_touch': '身体的接触'
                    };
                    return names[lang] || lang;
                });
                tagParts.push('爱的语言：' + loveLanguageNames.join('、'));
            }
            
            if (tags.zodiac) {
                var zodiacNames = {
                    'aries': '白羊座', 'taurus': '金牛座', 'gemini': '双子座',
                    'cancer': '巨蟹座', 'leo': '狮子座', 'virgo': '处女座',
                    'libra': '天秤座', 'scorpio': '天蝎座', 'sagittarius': '射手座',
                    'capricorn': '摩羯座', 'aquarius': '水瓶座', 'pisces': '双鱼座'
                };
                tagParts.push('星座：' + (zodiacNames[tags.zodiac] || tags.zodiac));
            }
            
            if (tags.mbti) {
                tagParts.push('MBTI：' + tags.mbti);
            }
            
            if (tags.personality_tags && tags.personality_tags.length > 0) {
                var personalityNames = tags.personality_tags.map(function(tag) {
                    var names = {
                        'talkative': '话痨', 'secretive': '闷骚', 'tough_love': '嘴硬心软',
                        'cold_war': '冷暴力', 'clingy': '粘人', 'independent': '独立',
                        'romantic': '浪漫型', 'pragmatic': '务实型', 'optimistic': '乐观派',
                        'pessimistic': '悲观派'
                    };
                    return names[tag] || tag;
                });
                tagParts.push('性格：' + personalityNames.join('、'));
            }
            
            tagsSummary = tagParts.length > 0 ? tagParts.join('；') : '未提供';
        } else {
            tagsSummary = '未提供';
        }

        container.innerHTML = `
            <div class="intake-step">
                <div class="intake-header">
                    <h2>确认信息</h2>
                    <p>请确认以下信息是否正确：</p>
                </div>
                <div class="intake-summary">
                    <div class="summary-item">
                        <div class="summary-label">称呼：</div>
                        <div class="summary-value">${currentData.partner_name}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">基本信息：</div>
                        <div class="summary-value">${basicInfoText}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">性格印象：</div>
                        <div class="summary-value">${personalityText}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">人格标签：</div>
                        <div class="summary-value">${tagsSummary}</div>
                    </div>
                </div>
                <div class="intake-actions">
                    <button id="intake-confirm" class="btn-primary">确认创建</button>
                    <button id="intake-edit" class="btn-secondary">修改信息</button>
                    <button id="intake-back" class="btn-secondary">返回</button>
                </div>
            </div>
        `;

        document.getElementById('intake-confirm').onclick = function() {
            // 直接创建skill并完成
            if (onCompleteCallback) {
                onCompleteCallback({
                    action: 'start',
                    data: currentData
                });
            }
            // 清空录入容器，恢复原始ID
            var intakeContainer = document.getElementById('intake-container');
            _restoreContainerId();
            if (intakeContainer) intakeContainer.innerHTML = '';
            _resetState();
        };

        document.getElementById('intake-edit').onclick = function() {
            _setState(INTAKE_STATES.COLLECTING_NAME);
        };

        document.getElementById('intake-back').onclick = function() {
            _setState(INTAKE_STATES.COLLECTING_PERSONALITY);
        };
    }

    function _renderCompletion(container) {
        container.innerHTML = `
            <div class="intake-step">
                <div class="intake-header">
                    <h2>创建完成</h2>
                    <p>太好了！AI对话伙伴「${currentData.partner_name || ''}」已创建成功。</p>
                </div>
                <div class="intake-actions">
                    <button id="intake-finish" class="btn-primary">完成</button>
                </div>
            </div>
        `;

        document.getElementById('intake-finish').onclick = function() {
            if (onCompleteCallback) {
                onCompleteCallback({
                    action: 'start',
                    data: currentData
                });
            }
            _restoreContainerId();
            _resetState();
        };
    }

    /* ── 错误处理 ── */
    function _showError(message) {
        var errorElement = document.querySelector('.intake-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            var container = document.getElementById('intake-container');
            if (container) {
                var errorDiv = document.createElement('div');
                errorDiv.className = 'intake-error';
                errorDiv.textContent = message;
                container.insertBefore(errorDiv, container.firstChild);
            }
        }
    }

    function _hideError() {
        var errorElement = document.querySelector('.intake-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /* ── 公共接口 ── */
    function startIntake(containerId, onComplete, onCancel) {
        var container = document.getElementById(containerId);
        if (!container) {
            console.error('找不到容器元素:', containerId);
            return;
        }

        // 保存原始容器ID，以便后续恢复
        originalContainerId = containerId;

        // 设置容器
        container.id = 'intake-container';
        container.className = 'intake-container';

        // 先重置状态，再设置回调（避免_resetState清空回调）
        _resetState();
        onCompleteCallback = onComplete;
        onCancelCallback = onCancel;

        // 开始录入
        _setState(INTAKE_STATES.IDLE);
    }

    function stopIntake() {
        _resetState();
        var container = document.getElementById('intake-container');
        if (container) {
            container.innerHTML = '';
            // 恢复原始容器ID
            if (originalContainerId) {
                container.id = originalContainerId;
                originalContainerId = null;
            }
        }
    }

    function getCurrentData() {
        return JSON.parse(JSON.stringify(currentData));
    }

    function getCurrentState() {
        return currentState;
    }

    /* ── 样式注入 ── */
    function _injectStyles() {
        if (document.getElementById('intake-styles')) return;

        var style = document.createElement('style');
        style.id = 'intake-styles';
        style.textContent = `
            .intake-container {
                max-width: 500px;
                margin: 0 auto;
                padding: 20px;
                font-family: var(--font-family);
            }

            .intake-welcome,
            .intake-step {
                background: var(--secondary-bg);
                border-radius: var(--radius);
                padding: 24px;
                box-shadow: var(--shadow);
                border: 1px solid var(--border-color);
            }

            .intake-header {
                margin-bottom: 20px;
            }

            .intake-header h2 {
                margin: 0 0 8px 0;
                font-size: 20px;
                color: var(--text-primary);
            }

            .intake-header p {
                margin: 0;
                color: var(--text-secondary);
                font-size: 14px;
                line-height: 1.5;
            }

            .intake-input-group {
                margin-bottom: 16px;
            }

            .intake-input-group input,
            .intake-input-group textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--radius-xs);
                font-size: 14px;
                font-family: var(--font-family);
                resize: vertical;
                box-sizing: border-box;
                background: var(--primary-bg);
                color: var(--text-primary);
                transition: var(--transition);
            }

            .intake-input-group input:focus,
            .intake-input-group textarea:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
            }

            .intake-hint {
                margin-top: 8px;
                font-size: 12px;
                color: var(--text-secondary);
            }

            .intake-examples {
                margin-bottom: 16px;
                padding: 12px;
                background: var(--primary-bg);
                border-radius: var(--radius-xs);
                border: 1px solid var(--border-color);
            }

            .example-title {
                font-size: 12px;
                color: var(--text-secondary);
                margin-bottom: 8px;
                font-weight: 500;
            }

            .example-item {
                font-size: 13px;
                color: var(--text-secondary);
                margin-bottom: 4px;
                padding-left: 12px;
                position: relative;
            }

            .example-item::before {
                content: "•";
                position: absolute;
                left: 0;
                color: var(--accent-color);
            }

            .intake-summary {
                margin-bottom: 20px;
            }

            .summary-item {
                display: flex;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border-color);
            }

            .summary-item:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            .summary-label {
                font-weight: 500;
                color: var(--text-primary);
                min-width: 80px;
            }

            .summary-value {
                color: var(--text-secondary);
                flex: 1;
            }



            .intake-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .btn-primary {
                padding: 10px 20px;
                background: var(--accent-color);
                color: var(--message-sent-text);
                border: none;
                border-radius: var(--radius-xs);
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: var(--transition);
                font-family: var(--font-family);
            }

            .btn-primary:hover {
                filter: brightness(1.1);
                transform: translateY(-1px);
            }

            .btn-secondary {
                padding: 10px 20px;
                background: var(--message-received-bg);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-xs);
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: var(--transition);
                font-family: var(--font-family);
            }

            .btn-secondary:hover {
                background: var(--border-color);
                transform: translateY(-1px);
            }

            .intake-error {
                background: rgba(255, 71, 87, 0.1);
                color: #ff4757;
                padding: 12px;
                border-radius: var(--radius-xs);
                margin-bottom: 16px;
                font-size: 14px;
                display: none;
                border: 1px solid rgba(255, 71, 87, 0.2);
            }
            
            /* 标签选择样式 */
            .intake-tags-section {
                margin-bottom: 20px;
            }
            
            .tags-group {
                margin-bottom: 16px;
            }
            
            .tags-label {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary);
                margin-bottom: 8px;
            }
            
            .tags-options {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .tag-btn {
                padding: 6px 12px;
                background: var(--primary-bg);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-xs);
                font-size: 13px;
                color: var(--text-secondary);
                cursor: pointer;
                transition: var(--transition);
                font-family: var(--font-family);
            }
            
            .tag-btn:hover {
                border-color: var(--accent-color);
                color: var(--accent-color);
            }
            
            .tag-btn.active {
                background: var(--accent-color);
                border-color: var(--accent-color);
                color: var(--message-sent-text);
            }
            
            .tags-select {
                width: 100%;
                padding: 10px 12px;
                background: var(--primary-bg);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-xs);
                font-size: 14px;
                color: var(--text-primary);
                font-family: var(--font-family);
                cursor: pointer;
            }
            
            .tags-select:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
            }
        `;

        document.head.appendChild(style);
    }

    /* ── 初始化 ── */
    function init() {
        _injectStyles();
    }

    /* ── 暴露全局接口 ── */
    window.ConversationIntake = {
        // 常量
        STATES: INTAKE_STATES,
        
        // 核心功能
        start: startIntake,
        stop: stopIntake,
        
        // 状态查询
        getCurrentData: getCurrentData,
        getCurrentState: getCurrentState,
        
        // 初始化
        init: init
    };

    // 自动初始化
    init();

})();