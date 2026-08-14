import axios from 'axios';
import { OpenAI } from 'openai';

// 1. Configuration Settings using Environment Variables
const CONFIG = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    KICK_BOT_TOKEN: process.env.KICK_BOT_TOKEN,
    KICK_CHAT_ENDPOINT: 'https://websockets.kick.com/api/v1/chat',
    SEND_INTERVAL_MS: 15000 // Send a message every 15 seconds
};

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY });

// Initial queue of chat messages
let messageQueue = [
    "Welcome to the stream everyone!",
    "Don't forget to hit the follow button!",
    "Hope you all are having a great day!"
];

// 2. Function to generate new messages when the queue is low
async function generateNewMessages() {
    console.log("Queue is low. Generating new messages with AI...");
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: "Generate 5 short, engaging, and friendly chat messages for a live stream chat. Keep them natural and varied. Do not include quotes or numbering."
            }],
        });

        const newMessages = response.choices[0].message.content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        messageQueue.push(...newMessages);
        console.log(`Successfully added ${newMessages.length} new messages to the queue.`);
    } catch (error) {
        console.error("Error generating messages:", error.message);
    }
}

// 3. Function to send a message to Kick Chat API
async function sendKickMessage(message) {
    try {
        await axios.post(CONFIG.KICK_CHAT_ENDPOINT, {
            content: message,
            type: 'bot'
        }, {
            headers: {
                'Authorization': `Bearer ${CONFIG.KICK_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`[SENT]: ${message}`);
    } catch (error) {
        console.error("Failed to send message to Kick:", error.message);
    }
}

// 4. Main Controller Loop
async function startBotController() {
    console.log("Bot started and listening...");

    setInterval(async () => {
        // Generate new messages if queue has 1 or fewer items left
        if (messageQueue.length <= 1) {
            await generateNewMessages();
        }

        // Send the next message from the queue
        if (messageQueue.length > 0) {
            const nextMessage = messageQueue.shift();
            await sendKickMessage(nextMessage);
        }
    }, CONFIG.SEND_INTERVAL_MS);
}

// Start the bot
startBotController();