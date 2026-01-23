import sys
import os
from django.apps import AppConfig

class CoursesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'courses'
    
    # Class-level variable to hold the singleton Trie instance
    trie = None

    def ready(self):
        # 1. Server Check (Prevents double loading/reloader issues)
        if os.environ.get('RUN_MAIN', None) != 'true':
            return

        # 2. Prevent running during migrations
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv:
            return

        from .models import Course, Lesson
        # Assuming you put the Trie class in utils.py (as per previous steps). 
        # If it's in trie.py, keep it as .trie
        from .utils import CourseTrie 

        print("⚡ [Search Engine] Building In-Memory Trie...")
        
        # Initialize
        self.trie = CourseTrie()

        # 3. Index COURSES
        # We fetch description too, so the frontend can show it
        courses = Course.objects.all()
        for course in courses:
            payload = {
                "id": course.id,
                "title": course.title,
                "type": "course",
                "course_title": None, # It is a course
                "url": f"/courses/{course.id}",
                "description": course.description,
                "source": "trie_fast" # Default source tag
            }
            self.trie.insert(course.title, payload)

        # 4. Index LESSONS (The Context!)
        # select_related is CRITICAL here for performance
        lessons = Lesson.objects.select_related('module__course').all()
        
        for lesson in lessons:
            # Safety check if lesson has a course
            if lesson.module.course:
                payload = {
                    "id": lesson.id,
                    "title": lesson.title,
                    "type": "lesson",
                    
                    # This matches {item.course_title} in SearchBar.jsx
                    "course_title": lesson.module.course.title, 
                    
                    # We link to the PARENT COURSE, not the lesson itself (simpler nav)
                    "url": f"/courses/{lesson.module.course.id}",
                    "description": None,
                    "source": "trie_fast"
                }
                self.trie.insert(lesson.title, payload)
            
        print(f"✅ [Search Engine] Indexed {len(courses)} Courses and {len(lessons)} Lessons into RAM.")