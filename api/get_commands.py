import json
import redis
import os
from http.server import BaseHTTPRequestHandler

redis_url = os.environ.get("REDIS_URL")
r = redis.from_url(redis_url)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # استخرج أمرًا واحدًا من قائمة الانتظار (FIFO)
        command = r.lpop("commands")
        if command:
            command_str = command.decode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"command": command_str}).encode())
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"command": None}).encode())
