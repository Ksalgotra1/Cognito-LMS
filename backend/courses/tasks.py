from celery import shared_task
from django.contrib.auth import get_user_model
import time

User = get_user_model()

@shared_task
def send_enrollment_email(user_email, course_title):
    """
    Simulates sending an email. 
    The 'shared_task' decorator lets Celery find this without importing it manually.
    """
    print(f"📧 [Celery] Starting email task for {user_email}...")
    
    # Simulate a 5-second delay (e.g., connecting to SMTP server)
    time.sleep(5)
    
    print(f"✅ [Celery] Email SENT to {user_email}: 'Welcome to {course_title}!'")
    return "Email Sent"


@shared_task
def generate_ai_response_task(course_id, user_id, user_question):
    """
    Heavy AI lifting happens here, OUTSIDE the request-response cycle.
    This prevents blocking the Django server while waiting for Llama 3.
    """
    from .services import get_rag_context
    from .ai_client import get_chat_response
    
    try:
        user = User.objects.get(id=user_id)
        
        # 1. Build Context (This can take 1-2 seconds)
        print(f"🧠 [Celery] Building RAG context for course {course_id}...")
        system_prompt = get_rag_context(course_id, user)
        
        # 2. Call LLM (This can take 5-10 seconds)
        print(f"🤖 [Celery] Calling Llama 3 for user {user_id}...")
        ai_answer = get_chat_response(system_prompt, user_question)
        
        print(f"✅ [Celery] AI response generated successfully!")
        return {"status": "success", "answer": ai_answer}
        
    except User.DoesNotExist:
        return {"status": "error", "answer": "User not found"}
    except Exception as e:
        print(f"❌ [Celery] AI task failed: {str(e)}")
        return {"status": "error", "answer": f"AI error: {str(e)}"}