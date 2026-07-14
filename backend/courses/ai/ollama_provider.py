"""
Ollama Provider — Local LLM (Llama 3).

Direct port of the original ai_client.py logic into the modular provider
interface. Uses the `ollama` Python package to talk to a locally running
Ollama instance.
"""

import json

import ollama

from .base import AIProvider
from .mock import get_mock_chat_response

# Shared prompt for keyword extraction (used by both providers)
KEYWORD_SYSTEM_PROMPT = """
You are a Search Logic Engine.
Task: Convert the user's natural language query into 2-4 specific technical keywords found in a Computer Science curriculum.

STRICT RESPONSE FORMAT:
Return ONLY a raw JSON array of strings. Do not write any other text.

Example Input: "making websites look good"
Example Output: ["CSS", "Frontend", "Design"]
"""


class OllamaProvider(AIProvider):
    """Ollama/Llama 3 local inference provider."""

    def __init__(self, model: str = "llama3"):
        self.model = model

    def chat(self, system_context: str, user_question: str) -> str:
        """
        Active Tutor Service (RAG-Enabled).
        Connects to local Llama 3 instance to generate context-aware answers.
        FALLBACK: Returns a mock response if Llama is offline.
        """
        try:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_context},
                    {"role": "user", "content": user_question},
                ],
                options={"timeout": 20},  # Hard cap: 20s network wait
            )
            return response["message"]["content"]
        except Exception as e:
            # Fallback Mechanism (The "Safety Net")
            print(f"[Ollama Error] Chat generation failed: {e}")
            print("Switching to Mock Response Mode.")
            return get_mock_chat_response()

    def extract_keywords(self, user_query: str) -> list[str]:
        """
        Semantic Query Expander.
        Translates vague user intent (e.g., "how to style") -> Technical Keywords (e.g., ["CSS"]).
        """
        try:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": KEYWORD_SYSTEM_PROMPT},
                    {"role": "user", "content": user_query},
                ],
                options={"timeout": 15},  # Keyword extraction: tighter cap
            )

            content = response["message"]["content"]

            # --- ROBUST PARSING STRATEGY ---
            # Llama 3 is chatty. We must perform "surgical extraction" of the JSON array.
            # We look for the first '[' and the last ']' to ignore any conversational filler.
            start_idx = content.find("[")
            end_idx = content.rfind("]") + 1

            if start_idx != -1 and end_idx != -1:
                clean_json = content[start_idx:end_idx]
                return json.loads(clean_json)

            print(f"[Ollama Parser Warning] Could not find JSON in response: {content}")
            # Fallback: Return simple split if JSON fails
            return user_query.split()

        except Exception as e:
            print(f"[Ollama Error] Keyword extraction failed: {e}")
            # Fallback: Just return the words the user typed so search doesn't break
            return user_query.split()
