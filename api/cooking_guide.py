from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.error

COOKING_GUIDE_SYSTEM_PROMPT = """You are Chef Claude, an expert AI chef. Provide a complete step-by-step cooking guide.

First output a recipe overview line:
{"type":"overview","name":"Recipe Name","total_time":"30 mins","servings":2,"description":"Brief description of the dish"}

Then output each cooking step as a JSON line:
{"type":"step","step":1,"title":"Step Title","instruction":"Detailed clear instruction text","animation":"chop","duration":"3 mins","tip":"Optional helpful tip or leave empty string"}

Animation must be one of: chop, stir, boil, fry, mix, bake, pour, plate, season, heat, wash, cool, idle

Output ONLY JSON lines, no other text, no markdown, no code blocks.
Provide 6-10 detailed steps covering all preparation and cooking."""


def call_claude(api_key, system_prompt, user_message, max_tokens=4096):
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
            recipe_name = body.get("recipe_name", "")
            ingredients = body.get("ingredients", [])
            servings = body.get("servings", 2)
            api_key = os.environ.get("ANTHROPIC_API_KEY", "")

            text = call_claude(
                api_key,
                COOKING_GUIDE_SYSTEM_PROMPT,
                f"Recipe: {recipe_name}\nIngredients available: {', '.join(ingredients)}\nServings: {servings}\n\nProvide complete step-by-step cooking instructions."
            )
            self._send_json(200, {"text": text})

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else str(e)
            self._send_json(502, {"error": f"Anthropic API error {e.code}: {err_body}"})
        except Exception as e:
            self._send_json(500, {"error": str(e)})
