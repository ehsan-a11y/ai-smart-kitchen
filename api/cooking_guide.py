from http.server import BaseHTTPRequestHandler
import json
import os
import anthropic

COOKING_GUIDE_SYSTEM_PROMPT = """You are Chef Claude, an expert AI chef. Provide a complete step-by-step cooking guide.

First output a recipe overview line:
{"type":"overview","name":"Recipe Name","total_time":"30 mins","servings":2,"description":"Brief description of the dish"}

Then output each cooking step as a JSON line:
{"type":"step","step":1,"title":"Step Title","instruction":"Detailed clear instruction text","animation":"chop","duration":"3 mins","tip":"Optional helpful tip or leave empty string"}

Animation must be one of: chop, stir, boil, fry, mix, bake, pour, plate, season, heat, wash, cool, idle

Output ONLY JSON lines, no other text, no markdown, no code blocks.
Provide 6-10 detailed steps covering all preparation and cooking."""


class handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

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
            recipe_name = body.get("recipe_name", "")
            ingredients = body.get("ingredients", [])
            servings = body.get("servings", 2)

            client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
            message = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=4096,
                system=COOKING_GUIDE_SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": f"Recipe: {recipe_name}\nIngredients available: {', '.join(ingredients)}\nServings: {servings}\n\nProvide complete step-by-step cooking instructions."
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
