"""
OpenAI Provider — GPT-4o via GitHub Models.

Uses the OpenAI Python SDK pointed at GitHub's inference endpoint:
    https://models.inference.ai.azure.com

Authentication: Pass your GitHub Personal Access Token (PAT) as the API key.
Generate one at https://github.com/settings/tokens with `models:read` scope.
"""

import json
from openai import OpenAI

from .base import AIProvider
from .mock import get_mock_chat_response

# Shared prompt for keyword extraction
KEYWORD_SYSTEM_PROMPT = """
You are a Search Logic Engine.
Task: Convert the user's natural language query into 2-4 specific technical keywords found in a Computer Science curriculum.

STRICT RESPONSE FORMAT:
Return ONLY a raw JSON array of strings. Do not write any other text.

Example Input: "making websites look good"
Example Output: ["CSS", "Frontend", "Design"]
"""


class OpenAIProvider(AIProvider):
    """GPT-4o provider via GitHub Models (OpenAI-compatible endpoint)."""

    def __init__(self, model: str = "gpt-4o", api_key: str = ""):
        if not api_key:
            raise ValueError(
                "AI_API_KEY is required when using the 'openai' provider. "
                "Set it in your .env file (GitHub PAT with models:read scope)."
            )
        self.model = model
        self.client = OpenAI(
            base_url="https://models.inference.ai.azure.com",
            api_key=api_key,
        )

    def chat(self, system_context: str, user_question: str) -> str:
        """
        Active Tutor Service (RAG-Enabled).
        Calls GPT-4o via GitHub Models for context-aware answers.
        FALLBACK: Returns a mock response if the API is unreachable.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                timeout=20,  # Hard cap: 20s for chat responses
                messages=[
                    {"role": "system", "content": system_context},
                    {"role": "user", "content": user_question},
                ],
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[OpenAI/GitHub Models Error] Chat generation failed: {e}")
            print("Switching to Mock Response Mode.")
            return get_mock_chat_response()

    def extract_keywords(self, user_query: str) -> list[str]:
        """
        Semantic Query Expander via GPT-4o.
        GPT-4o follows instructions much more reliably than Llama 3,
        but we still apply the same robust JSON parsing as a safety net.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                timeout=15,  # Keyword extraction: tighter cap
                messages=[
                    {"role": "system", "content": KEYWORD_SYSTEM_PROMPT},
                    {"role": "user", "content": user_query},
                ],
            )

            content = response.choices[0].message.content

            # --- ROBUST PARSING STRATEGY ---
            # GPT-4o is much better at following format instructions,
            # but we still apply surgical JSON extraction as a safety net.
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1

            if start_idx != -1 and end_idx != -1:
                clean_json = content[start_idx:end_idx]
                return json.loads(clean_json)

            print(f"[OpenAI Parser Warning] Could not find JSON in response: {content}")
            return user_query.split()

        except Exception as e:
            print(f"[OpenAI/GitHub Models Error] Keyword extraction failed: {e}")
            return user_query.split()
