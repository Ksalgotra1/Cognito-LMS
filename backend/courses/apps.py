import sys
import os
from django.apps import AppConfig

class CoursesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'courses'
    
    # Class-level variable to hold the singleton Trie instance
    trie = None

    def ready(self):
        # 1. Server Check (Prevents double loading)
        if os.environ.get('RUN_MAIN', None) != 'true':
            return

        # 2. Prevent running during migrations
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv:
            return

        from .models import Course, Lesson
        # ✅ FIX: Import 'CourseTrie' (which is what you named it in trie.py)
        from .trie import CourseTrie 

        print("🔍 [Search Engine] Building In-Memory Index...")
        
        # Initialize
        CoursesConfig.trie = CourseTrie()

        # 3. Index COURSES
        courses = Course.objects.all().values('id', 'title')
        for course in courses:
            CoursesConfig.trie.insert(course['title'], { 
                'id': course['id'],
                'type': 'course',
                'title': course['title'],
                'url': f"/courses/{course['id']}"
            })

        # 4. Index LESSONS
        lessons = Lesson.objects.all().values('id', 'title', 'module__course__title', 'module__course__id')
        
        for lesson in lessons:
            if lesson['module__course__id']: 
                CoursesConfig.trie.insert(lesson['title'], {
                    'id': lesson['id'],
                    'type': 'lesson',
                    'title': lesson['title'],
                    
                    # ✅ THE FIX: We add 'course' because your Frontend asks for item.course
                    'course': lesson['module__course__title'], 
                    
                    'course_title': lesson['module__course__title'], # Keeping this as backup
                    'url': f"/courses/{lesson['module__course__id']}"
                })
            
        print(f"✅ [Search Engine] Indexed {len(courses)} Courses and {len(lessons)} Lessons.")