from django.core.cache import cache
from .models import Course, Lesson, UserProgress

def get_rag_context(course_id, user):
    """
    Builds a dynamic 'System Prompt' for the AI based on:
    1. The Course's Position in the DAG (The Map).
    2. The User's Completed Lessons (The History).
    """
    try:
        course = Course.objects.prefetch_related('prerequisites').get(id=course_id)
        
        # --- PART 1: THE MAP (DAG Structure) ---
        # We try to fetch the full graph from Redis, otherwise fallback to direct DB parents
        dag_context = "CONTEXT: This is a standalone course."
        
        # Check specific prerequisites (Immediate Parents)
        parents = list(course.prerequisites.all())
        if parents:
            parent_names = ", ".join([p.title for p in parents])
            dag_context = f"CONTEXT: This course builds upon concepts from: {parent_names}. If the student is confused, use analogies from these subjects."

        # --- PART 2: THE HISTORY (User Progress) ---
        # What has the student actually finished in THIS course?
        completed_lessons = UserProgress.objects.filter(
            user=user,
            lesson__module__course=course,
            is_completed=True
        ).select_related('lesson')
        
        if completed_lessons.exists():
            # We list the titles of completed lessons to give the AI "Memory"
            past_topics = ", ".join([p.lesson.title for p in completed_lessons])
            history_context = f"STUDENT HISTORY: The student has already completed: {past_topics}. You can reference these concepts."
        else:
            history_context = "STUDENT HISTORY: The student is just starting this course. Keep explanations foundational."

        # --- PART 3: ASSEMBLE ---
        full_system_prompt = f"""
        ROLE: You are an expert AI Tutor for the course '{course.title}'.
        {dag_context}
        {history_context}
        
        INSTRUCTIONS:
        1. Answer the student's question efficiently.
        2. IF ASKED FOR AN EXERCISE: Generate a short, practical coding challenge or conceptual question.
           - Use the 'Student History' to ensure the difficulty is appropriate.
           - If they know {parents[0].title if parents else 'basics'}, try to combine that with the current topic.
        """
        return full_system_prompt

    except Course.DoesNotExist:
        return "System Error: Course context missing."