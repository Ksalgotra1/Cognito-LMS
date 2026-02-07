from celery import shared_task
import time

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