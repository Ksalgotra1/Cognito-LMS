"""
Shared Mock / Fallback Responses.

Used by all providers when the underlying LLM is offline or unreachable.
Keeps demo presentations running smoothly even without GPU access.
"""

import random

# --- MOCK DATA BANK ---
# Used when LLM is offline or unreachable to prevent demo crashes
MOCK_RESPONSES = [
    "That is a great question! Based on the curriculum, this concept builds upon the previous module's fundamentals. I'd recommend reviewing the 'Core Concepts' video for a refresher.",
    "Interesting point! In a real-world scenario, you would typically handle this using the standard library tools we discussed in Lesson 2.",
    "I'm currently running in 'Offline Mode' because the AI server is unreachable. However, the answer generally involves checking your syntax and ensuring all imports are correct.",
    "To solve this, try breaking the problem down into smaller steps. Start by defining your inputs and expected outputs.",
]


def get_mock_chat_response() -> str:
    """Return a random mock response wrapped in an offline-mode banner."""
    return (
        "[AI OFFLINE MODE]\n\n"
        f"{random.choice(MOCK_RESPONSES)}\n\n"
        "(Note: This is a fallback response because the AI service is not available.)"
    )
