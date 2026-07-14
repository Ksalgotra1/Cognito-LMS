"""
AI Provider Router — The "Switch" Layer.

Reads AI_PROVIDER from Django settings and lazily instantiates the correct
backend (Ollama or OpenAI/GitHub Models). Exposes the same public API that
the rest of the codebase already depends on, so nothing else needs to change.

Usage:
    from courses.ai import get_chat_response, get_search_keywords

Kill switch (admin shell):
    from django.core.cache import cache
    cache.set('ai_kill_switch', True, timeout=None)   # disable AI instantly
    cache.delete('ai_kill_switch')                      # re-enable AI
"""

from django.conf import settings


def _get_provider():
    """
    Factory function — reads settings once at import time and returns
    the appropriate AIProvider instance.
    """
    provider_name = getattr(settings, 'AI_PROVIDER', 'ollama').lower()

    if provider_name == 'openai':
        from .openai_provider import OpenAIProvider

        return OpenAIProvider(
            model=getattr(settings, 'AI_MODEL', 'gpt-4o'),
            api_key=getattr(settings, 'AI_API_KEY', ''),
        )
    else:
        # Default: Ollama (local, free)
        from .ollama_provider import OllamaProvider

        return OllamaProvider(
            model=getattr(settings, 'AI_MODEL', 'llama3'),
        )


# Singleton — instantiated once when the module is first imported
_provider = _get_provider()


def _is_ai_killed() -> bool:
    """
    Check if an admin has flipped the runtime AI kill switch.

    Set via: cache.set('ai_kill_switch', True, timeout=None)
    Clear via: cache.delete('ai_kill_switch')

    When active, all AI calls fall back to mock responses instantly —
    useful during provider outages or unexpected cost spikes.
    """
    from django.core.cache import cache
    return bool(cache.get('ai_kill_switch'))


# ─── PUBLIC API (matches original ai_client.py signatures) ────────────────────

def get_chat_response(system_context: str, user_question: str) -> str:
    """Generate a context-aware AI tutoring response."""
    if _is_ai_killed():
        from .mock import get_mock_chat_response
        return get_mock_chat_response()
    return _provider.chat(system_context, user_question)


def get_search_keywords(user_query: str) -> list:
    """Convert a natural-language query into technical search keywords."""
    if _is_ai_killed():
        # Fall back to naive word split — keeps search functional but non-semantic
        return user_query.split()
    return _provider.extract_keywords(user_query)


__all__ = ['get_chat_response', 'get_search_keywords']
