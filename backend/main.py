from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import anthropic
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Smart Kitchen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


class IngredientsRequest(BaseModel):
    ingredients: List[str]


class RecipeRequest(BaseModel):
    recipe_name: str
    ingredients: List[str]
    servings: int = 2


RECIPE_SYSTEM_PROMPT = """You are Chef Claude, an expert AI chef. Given a list of ingredients, suggest exactly 4 delicious recipes.

For each recipe output a JSON object on its own line (NDJSON format) with EXACTLY this structure:
{"id":"r1","name":"Recipe Name","description":"Appetizing 1-2 sentence description","difficulty":"Easy","time":"25 mins","cuisine":"Italian","calories":"450 kcal","ingredients_used":["ing1","ing2"],"missing_ingredients":["optional_extra"]}

difficulty must be one of: Easy, Medium, Hard
Output ONLY the 4 JSON lines, no other text, no markdown, no code blocks."""

COOKING_GUIDE_SYSTEM_PROMPT = """You are Chef Claude, an expert AI chef. Provide a complete step-by-step cooking guide.

First output a recipe overview line:
{"type":"overview","name":"Recipe Name","total_time":"30 mins","servings":2,"description":"Brief description of the dish"}

Then output each cooking step as a JSON line:
{"type":"step","step":1,"title":"Step Title","instruction":"Detailed clear instruction text","animation":"chop","duration":"3 mins","tip":"Optional helpful tip or leave empty string"}

Animation must be one of: chop, stir, boil, fry, mix, bake, pour, plate, season, heat, wash, cool, idle

Output ONLY JSON lines, no other text, no markdown, no code blocks.
Provide 6-10 detailed steps covering all preparation and cooking."""


@app.post("/api/suggest-recipes")
async def suggest_recipes(request: IngredientsRequest):
    def generate():
        try:
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=2048,
                system=RECIPE_SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": f"Available ingredients: {', '.join(request.ingredients)}\n\nSuggest 4 recipes I can make with these ingredients (common pantry staples like oil, salt, pepper, water are available)."
                }]
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/cooking-guide")
async def cooking_guide(request: RecipeRequest):
    def generate():
        try:
            with client.messages.stream(
                model="claude-opus-4-6",
                max_tokens=4096,
                system=COOKING_GUIDE_SYSTEM_PROMPT,
                messages=[{
                    "role": "user",
                    "content": f"Recipe: {request.recipe_name}\nIngredients available: {', '.join(request.ingredients)}\nServings: {request.servings}\n\nProvide complete step-by-step cooking instructions."
                }]
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/health")
async def health():
    return {"status": "ok", "model": "claude-opus-4-6"}
