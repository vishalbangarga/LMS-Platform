const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { HfInference } = require('@huggingface/inference');

// POST /api/chat
router.post('/chat', verifyToken, async (req, res) => {
    try {
        const { messages, context } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const HF_API_KEY = process.env.HF_API_KEY;
        if (!HF_API_KEY) {
            return res.status(500).json({ error: 'HF_API_KEY missing from environment variables' });
        }

        const hf = new HfInference(HF_API_KEY);

        let systemContent = "You are a helpful AI tutor for an educational platform.";
        if (context) {
            systemContent += ` The student is currently studying a lesson titled "${context.title || 'Unknown Title'}".`;
            if (context.description) {
                systemContent += ` Lesson Description: ${context.description}`;
            }
        }
        systemContent += " Provide clear, concise, and educational answers. Format any code clearly.";

        // Qwen2.5 is currently supported on the free inference API
        const response = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [
                { role: "system", content: systemContent },
                ...messages
            ],
            max_tokens: 350,
            temperature: 0.7
        });

        if (response && response.choices && response.choices.length > 0) {
            res.json({ reply: response.choices[0].message.content.trim() });
        } else {
            throw new Error('Invalid response structure from Hugging Face');
        }

    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({ error: error.message || 'Failed to communicate with AI provider' });
    }
});

module.exports = router;
