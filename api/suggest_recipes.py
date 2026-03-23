from http.server import BaseHTTPRequestHandler
import json
import os
import anthropic

RECIPE_SYSTEM_PROMPT = """You are Chef Claude, an expert AI chef. Given a list of ingredients, suggest exactly 4 delicious recipes.

For each recipe output a JSON object on its own line (NDJSON format) with EXACTLY this structure:
{"id":"r1","name":"Recipe Name","description":"Appetizing 1-2 sentence description","difficulty":"Easy","time":"25 mins","cuisine":"Italian","calories":"450 kcal","ingredients_used":["ing1","ing2"],"missing_ingredients":["optional_extra"]}

difficulty must be one of: Easy, Medium, Hard
Output ONLY the 4 JSON lines, no other text, no markdown, no code blocks."""


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # Suppress default logging

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            ingredients = body.get("ingredients", [])

            client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
            message = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=2048,
                system=RECIPE_SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": f"Available ingredients: {', '.join(ingredients)}\n\nSuggest 4 recipes."
                }]
            )

            result = {"text": message.content[0].text}
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self._cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
