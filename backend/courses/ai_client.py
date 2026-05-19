"""
Backwards-compatible shim.

All AI logic now lives in the modular `courses/ai/` package.
This file re-exports the public API so existing imports
(`from .ai_client import get_chat_response`) keep working
without any changes in views.py or tasks.py.
"""
from .ai import get_chat_response, get_search_keywords

__all__ = ['get_chat_response', 'get_search_keywords']