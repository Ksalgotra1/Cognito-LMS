import ollama
import json

def get_chat_response(system_context, user_question):
    """
    Active Tutor Service (RAG-Enabled).
    Connects to local Llama 3 instance to generate context-aware answers.
    """
    try:
        response = ollama.chat(model='llama3', messages=[
            {'role': 'system', 'content': system_context},
            {'role': 'user', 'content': user_question},
        ])
        return response['message']['content']
    except Exception as e:
        print(f"❌ [AI Service Error] Chat generation failed: {e}")
        return "I'm having trouble connecting to my brain right now. Is Ollama running?"

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
        return []
        
    except Exception as e:
        print(f"❌ [AI Service Error] Keyword extraction failed: {e}")
        return []