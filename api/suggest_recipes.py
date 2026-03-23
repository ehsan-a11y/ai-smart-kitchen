from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

RECIPE_SYSTEM_PROMPT = """You are Chef Claude, an expert AI chef. Given a list of ingredients, suggest exactly 4 delicious recipes.

For each recipe output a JSON object on its own line (NDJSON format) with EXACTLY this structure:
{"id":"r1","name":"Recipe Name","description":"Appetizing 1-2 sentence description","difficulty":"Easy","time":"25 mins","cuisine":"Italian","calories":"450 kcal","ingredients_used":["ing1","ing2"],"missing_ingredients":["optional_extra"]}

difficulty must be one of: Easy, Medium, Hard
Output ONLY the 4 JSON lines, no other text, no markdown, no code blocks."""


def call_claude(api_key, system_prompt, user_message, max_tokens=2048):
    payload = json.dumps({
        "model": "claude-opus-4-6",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}]
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        method="POST",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
    )
    with urllib.request.urlopen(req, timeout=55) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        return body["content"][0]["text"]


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, status, data):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self._send_json(200, {})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            ingredients = body.get("ingredients", [])
            api_key = os.environ.get("ANTHROPIC_API_KEY", "")

            text = call_claude(
                api_key,
                RECIPE_SYSTEM_PROMPT,
                f"Available ingredients: {', '.join(ingredients)}\n\nSuggest 4 recipes I can make with these (common pantry staples like oil, salt, pepper, water are available)."
            )
            self._send_json(200, {"text": text})

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else str(e)
            self._send_json(502, {"error": f"Anthropic API error {e.code}: {err_body}"})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
