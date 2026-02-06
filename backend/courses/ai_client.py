import ollama
import json
import random

# --- MOCK DATA BANK ---
# Used when Llama 3 is offline or unreachable to prevent demo crashes
MOCK_RESPONSES = [
    "That is a great question! Based on the curriculum, this concept builds upon the previous module's fundamentals. I'd recommend reviewing the 'Core Concepts' video for a refresher.",
    "Interesting point! In a real-world scenario, you would typically handle this using the standard library tools we discussed in Lesson 2.",
    "I'm currently running in 'Offline Mode' because the GPU server is unreachable. However, the answer generally involves checking your syntax and ensuring all imports are correct.",
    "To solve this, try breaking the problem down into smaller steps. Start by defining your inputs and expected outputs."
]

def get_chat_response(system_context, user_question):
    """
    Active Tutor Service (RAG-Enabled).
    Connects to local Llama 3 instance to generate context-aware answers.
    FALLBACK: Returns a mock response if Llama is offline.
    """
    try:
        response = ollama.chat(model='llama3', messages=[
            {'role': 'system', 'content': system_context},
            {'role': 'user', 'content': user_question},
        ])
        return response['message']['content']
    except Exception as e:
        # Fallback Mechanism (The "Safety Net")
        print(f"❌ [AI Service Error] Chat generation failed: {e}")
        print("➡️ Switching to Mock Response Mode.")
        
        return (
            "🤖 [AI OFFLINE MODE]\n\n"
            f"{random.choice(MOCK_RESPONSES)}\n\n"
            "(Note: This is a fallback response because the local LLM instance is not running.)"
        )

def get_search_keywords(user_query):
    """
    Semantic Query Expander.
    Translates vague user intent (e.g., "how to style") -> Technical Keywords (e.g., ["CSS"]).
    
    Returns:
        list: A list of keyword strings. e.g. ["CSS", "Frontend"]
    """
    system_prompt = """
    You are a Search Logic Engine.
    Task: Convert the user's natural language query into 2-4 specific technical keywords found in a Computer Science curriculum.
    
    STRICT RESPONSE FORMAT:
    Return ONLY a raw JSON array of strings. Do not write any other text.
    
    Example Input: "making websites look good"
    Example Output: ["CSS", "Frontend", "Design"]
    """

    try:
        response = ollama.chat(model='llama3', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_query},
        ])
        
        content = response['message']['content']
        
        # --- ROBUST PARSING STRATEGY ---
        # Llama 3 is chatty. We must perform "surgical extraction" of the JSON array.
        # We look for the first '[' and the last ']' to ignore any conversational filler.
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        
        if start_idx != -1 and end_idx != -1:
            clean_json = content[start_idx:end_idx]
            return json.loads(clean_json)
            
        print(f"⚠️ [AI Parser Warning] Could not find JSON in response: {content}")
        # Fallback: Return simple split if JSON fails
        return user_query.split()
        
    except Exception as e:
        print(f"❌ [AI Service Error] Keyword extraction failed: {e}")
        # Fallback: Just return the words the user typed so search doesn't break
        return user_query.split()