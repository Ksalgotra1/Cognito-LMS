import pickle
from django.core.cache import cache
from .models import Course, UserProgress

def get_rag_context(course_id, user):
    """
    Builds the 'System Prompt' (The Brain) for the AI.
    
    Strategy: "Transient Lazy Caching"
    1. Check Redis RAM first (The "Session" Cache).
    2. If missing, build the heavy DAG (Parents + Grandparents) and cache it.
    3. Mix in the live User History from DB.
    """
    
    # --- PART 1: THE HEAVY LIFTING (The DAG Map) ---
    cache_key = f"course_context_{course_id}"
    context_data = None

    # A. Try to fetch from Redis RAM
    try:
        cached_blob = cache.get(cache_key)
        if cached_blob:
            # We use Pickle because your DAG is a complex Dictionary, not a string
            context_data = pickle.loads(cached_blob)
            print(f"⚡️ [Redis Hit] Loaded DAG for Course {course_id} from RAM.")  # <--- LOG HIT
    except Exception:
        pass # If Redis hiccups, we simply fall back to DB

    # B. Cache Miss? Build it from Scratch (Lazy Loading)
    if not context_data:
        print(f"⚠️ [Redis Miss] Fetching DAG for Course {course_id} from Postgres...") # <--- LOG MISS
        try:
            # 1. Optimized DB Query (Course + Parents + Grandparents)
            course = Course.objects.prefetch_related('prerequisites__prerequisites').get(id=course_id)
            
            # 2. Flatten the Dependency Tree
            parents = list(course.prerequisites.all())
            grandparents = set()
            for parent in parents:
                for gp in parent.prerequisites.all():
                    grandparents.add(gp)

            # 3. Construct the Data Packet
            context_data = {
                "title": course.title,
                # Slice description to 500 chars to save Token Cost
                "description": course.description[:500] if course.description else "", 
                "parents": [p.title for p in parents],
                "grandparents": [gp.title for gp in grandparents]
            }

            # 4. Save to Redis (Transient Cache)
            # We use a 1-hour TTL (3600s) as a safety net so memory auto-cleans
            try:
                cache.set(cache_key, pickle.dumps(context_data), timeout=3600)
                print(f"✅ [Redis Write] Cached DAG for Course {course_id} (TTL: 1h)") # <--- LOG WRITE
            except Exception as e:
                print(f"❌ [Redis Error] Could not write to cache: {e}")
                pass 
                
        except Course.DoesNotExist:
            return "System Error: Course context missing."

    # --- PART 2: THE DYNAMIC PART (User History) ---
    # We never cache this, because it changes every time a student finishes a video.
    completed_lessons = UserProgress.objects.filter(
        user=user,
        lesson__module__course_id=course_id,
        is_completed=True
    ).select_related('lesson')

    if completed_lessons.exists():
        past_topics = ", ".join([p.lesson.title for p in completed_lessons])
        history_context = f"STUDENT HISTORY: They have completed: {past_topics}."
    else:
        history_context = "STUDENT HISTORY: The student is just starting."

    # --- PART 3: THE PROMPT ASSEMBLY ---
    
    # Mix the cached DAG with the live History
    dag_text = f"CONTEXT: This course '{context_data['title']}' builds on: {', '.join(context_data['parents'])}."
    
    if context_data['grandparents']:
        dag_text += f" Deep foundational concepts include: {', '.join(context_data['grandparents'])}."

    return f"""
    ROLE: You are a friendly, expert Tutor for '{context_data['title']}'.
    {dag_text}
    {history_context}
    
    INSTRUCTIONS:
    - Answer the student's question clearly.
    - If they seem stuck, offer a simple example code snippet.
    - Keep answers under 150 words unless asked for a deep dive.
    """