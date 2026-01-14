import datetime

def generate_study_schedule(start_date, target_date, weekly_availability, lessons):
    """
    Allocates lessons into time slots based on user availability.
    
    Args:
        start_date (date): When the user wants to start.
        target_date (date): The deadline.
        weekly_availability (dict): e.g., {"Mon": 60, "Tue": 0, "Wed": 120...} (Minutes per day)
        lessons (queryset): Ordered list of Lesson objects.

    Returns:
        list: A JSON-serializable schedule [{"date": "2023-10-01", "lessons": [...]}, ...]
    """
    schedule = []
    
    # 1. Setup Pointers
    current_date = start_date
    lesson_idx = 0
    total_lessons = len(lessons)
    
    # 2. The Allocation Loop (Greedy First-Fit Algorithm)
    # We loop day-by-day until we run out of lessons OR hit the safety limit (365 days)
    while lesson_idx < total_lessons:
        
        # Safety Break: Don't schedule past 1 year (infinite loop protection)
        if (current_date - start_date).days > 365:
            break

        # A. Get availability for this day of the week (e.g., "Mon")
        day_name = current_date.strftime("%a") # "Mon", "Tue"...
        minutes_available = weekly_availability.get(day_name, 0)
        
        daily_plan = {
            "date": current_date.isoformat(),
            "day": day_name,
            "lessons": []
        }
        
        time_used_today = 0
        
        # B. Try to fit as many lessons as possible into TODAY
        while lesson_idx < total_lessons:
            lesson = lessons[lesson_idx]
            duration = lesson.duration_minutes
            
            # Check Constraint: Do we have enough time left today?
            if time_used_today + duration <= minutes_available:
                # ALLOCATE!
                daily_plan["lessons"].append({
                    "title": lesson.title,
                    "duration": duration,
                    "id": lesson.id
                })
                time_used_today += duration
                lesson_idx += 1
            else:
                # Day is full! Stop filling today.
                break
        
        # C. Only add the day to the schedule if we actually scheduled something
        if daily_plan["lessons"]:
            schedule.append(daily_plan)
        
        # D. Move to next day
        current_date += datetime.timedelta(days=1)

    return schedule