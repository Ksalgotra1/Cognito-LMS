import pickle
from django.core.cache import cache
from .models import Course

def get_or_create_course_context(course_id):
    """
    Retrieves the AI Context (Title, Parents, Grandparents) for a course.
    1. Checks Redis.
    2. If miss, calculates from DB and saves to Redis (1 hour timeout).
    """
    cache_key = f"course_context_{course_id}"
    
    # 1. Check Redis (Fast Path)
    try:
        cached_data = cache.get(cache_key)
        if cached_data:
            # We use pickle because we are storing a Python Dictionary, not just a string
            return pickle.loads(cached_data)
    except Exception:
        pass # Fallback to DB if Redis hiccups

    # 2. Calculate from DB (Slow Path)
    try:
        # Optimized: Fetch Course + Parents + Grandparents in 1 query
        course = Course.objects.prefetch_related('prerequisites__prerequisites').get(id=course_id)
    except Course.DoesNotExist:
        return None

    # Logic: Flatten the dependency tree into text for the AI
    parents = list(course.prerequisites.all())
    grandparents = set()
    for parent in parents:
        for gp in parent.prerequisites.all():
            grandparents.add(gp)

    context_data = {
        "id": course.id,
        "title": course.title,
        "description": course.description[:500], # Limit description length for AI token savings
        "parents": [p.title for p in parents],
        "grandparents": [gp.title for gp in grandparents]
    }

    # 3. Save to Redis
    try:
        # Expires in 1 hour (3600s)
        cache.set(cache_key, pickle.dumps(context_data), timeout=3600)
    except Exception:
        pass

    return context_data