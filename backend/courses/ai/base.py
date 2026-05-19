"""
Abstract Base Class for AI Providers.

Every provider (Ollama, OpenAI, future ones) must implement this interface.
This guarantees the router in __init__.py can swap providers without
touching any calling code.
"""

from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Contract that all AI backends must follow."""

    @abstractmethod
    def chat(self, system_context: str, user_question: str) -> str:
        """
        Generate a chat response.

        Args:
            system_context: The system prompt with RAG context.
            user_question: The student's question.

        Returns:
            The AI-generated answer as a string.
        """
        ...

    @abstractmethod
    def extract_keywords(self, user_query: str) -> list[str]:
        """
        Extract search keywords from a natural-language query.

        Args:
            user_query: The user's raw search input.

        Returns:
            A list of keyword strings, e.g. ["CSS", "Frontend", "Design"].
        """
        ...
