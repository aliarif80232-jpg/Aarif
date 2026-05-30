
<script>
    const messagesDiv = document.getElementById('messagesDiv');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    // चैट हिस्ट्री (सिर्फ मैसेज दिखाने के लिए)
    let conversation = [
        { role: "assistant", content: "नमस्ते! मैं आपका सहायक हूँ। कृपया ऊपर अपनी OpenAI API key डालें और फिर मुझसे बात करें।" }
    ];

    function addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerText = role === 'user' ? 'YOU' : 'AI';
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerText = content;
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function callChatGPT(userMessage) {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            addMessageToUI('assistant', '❌ कृपया पहले अपनी OpenAI API key डालें।');
            return;
        }

        // अस्थायी रूप से OpenAI API के लिए मैसेज तैयार करें
        const messagesForAPI = [
            { role: "system", content: "You are a helpful assistant." },
            ...conversation.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
        ];

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messagesForAPI,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API key गलत है या क्रेडिट खत्म हो गए');
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;
            return reply;
        } catch (error) {
            console.error(error);
            return `❌ त्रुटि: ${error.message}`;
        }
    }

    sendBtn.addEventListener('click', async () => {
        const userText = messageInput.value.trim();
        if (!userText) return;

        // यूजर का मैसेज UI में दिखाएँ
        addMessageToUI('user', userText);
        conversation.push({ role: 'user', content: userText });
        messageInput.value = '';

        // थोड़ा सोचने का इफेक्ट
        const thinkingId = setTimeout(() => {
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'message assistant';
            thinkingDiv.id = 'thinkingMsg';
            thinkingDiv.innerHTML = `<div class="avatar">AI</div><div class="bubble">🤔 सोच रहा हूँ...</div>`;
            messagesDiv.appendChild(thinkingDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }, 200);

        const reply = await callChatGPT(userText);
        clearTimeout(thinkingId);
        const thinkingElem = document.getElementById('thinkingMsg');
        if (thinkingElem) thinkingElem.remove();

        addMessageToUI('assistant', reply);
        conversation.push({ role: 'assistant', content: reply });
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendBtn.click();
    });
</script>
</body>
</html>
