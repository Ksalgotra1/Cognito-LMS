import sys
from django.apps import AppConfig

class CoursesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'courses'
    
    # Class-level variable to hold the singleton Trie instance
    trie = None

    def ready(self):
        """
        This method is executed once when the Django application starts.
        We use it to initialize the in-memory Trie and populate it with data 
        from the database.
        """
        # Check if the server is actually running. This prevents the code from
        # running during management commands like 'makemigrations' or 'migrate'.
        is_running_server = 'runserver' in sys.argv
        
        if not is_running_server:
            return

        # Import models inside the method to avoid "AppRegistryNotReady" errors
        # because this method runs before all apps are fully loaded.
        from .models import Course, Lesson
        from .trie import CourseTrie

        print("Initialization: Building In-Memory Search Trie...")
        
        # Initialize the global Trie instance
        CoursesConfig.trie = CourseTrie()

        # 1. Fetch and Index all Courses
        # We only need specific fields, not the entire object overhead
        courses = Course.objects.all().values('id', 'title')
        for course in courses:
            CoursesConfig.trie.insert(course['title'], {
                'id': course['id'],
                'type': 'course',
                'title': course['title'],
                'url': f"/courses/{course['id']}"
            })

        # 2. Fetch and Index all Lessons
        # We use select_related to minimize database queries if we needed foreign keys,
        # but here values() is efficient enough.
        lessons = Lesson.objects.all().values('id', 'title', 'module__course__title')
        for lesson in lessons:
            CoursesConfig.trie.insert(lesson['title'], {
                'id': lesson['id'],
                'type': 'lesson',
                'title': lesson['title'],
                'course': lesson['module__course__title'], # Context for the user
                'url': f"/lessons/{lesson['id']}"
            })
            
        print(f"Trie Built Successfully. Indexed {len(courses) + len(lessons)} items in RAM.")