document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const clearBtn = document.getElementById('clear-btn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const outputContent = document.getElementById('output-content');

    const API_KEY_STORAGE_KEY = 'learning-notes-api-key';
    const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    const MODEL_NAME = 'qwen3.6-plus';

    const SYSTEM_PROMPT = {
        role: 'system',
        content: '你是一个专业的学习笔记整理助手。请将用户输入的笔记整理成：1. 核心摘要；2. 关键知识点（Bullet points）；3. 2-3个复习问题。后续请根据用户的建议（如缩短、转为表格）对当前笔记进行重新编辑和优化。'
    };

    let messages = [SYSTEM_PROMPT];

    const savedApiKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    saveKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
            showToast('API Key 已保存');
        } else {
            showError('请输入有效的 API Key');
        }
    });

    sendBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const inputText = userInput.value.trim();

        if (!apiKey) {
            showError('请先输入并保存 API Key');
            return;
        }

        if (!inputText) {
            showError('请输入笔记内容');
            return;
        }

        messages.push({ role: 'user', content: inputText });
        userInput.value = '';

        await sendRequest(apiKey);
    });

    clearBtn.addEventListener('click', () => {
        userInput.value = '';
        outputContent.innerHTML = '<div class="empty-state"><p>等待输入笔记内容...</p></div>';
        outputContent.classList.remove('markdown-content');
        hideError();
        hideLoading();
        messages = [SYSTEM_PROMPT];
        sendBtn.disabled = false;
    });

    async function sendRequest(apiKey) {
        showLoading();
        hideError();
        sendBtn.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2048
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error?.message || data.message || '请求失败';
                throw new Error(errorMsg);
            }

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const assistantReply = data.choices[0].message.content;
                messages.push({ role: 'assistant', content: assistantReply });
                renderMarkdown(assistantReply);
            } else {
                throw new Error('未获取到响应内容');
            }
        } catch (err) {
            showError(err.message);
            messages.pop();
        } finally {
            hideLoading();
            sendBtn.disabled = false;
        }
    }

    function renderMarkdown(text) {
        const html = marked.parse(text);
        outputContent.innerHTML = html;
        outputContent.classList.add('markdown-content');
    }

    function showLoading() {
        loading.style.display = 'flex';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        error.style.display = 'flex';
    }

    function hideError() {
        error.style.display = 'none';
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
});