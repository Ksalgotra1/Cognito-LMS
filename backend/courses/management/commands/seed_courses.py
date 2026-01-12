import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson, Question, Choice

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with Courses, Lessons, and Quizzes for testing."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("⚠️  Wiping old Courses data..."))
        # Wipe old data to start fresh
        Course.objects.all().delete()
        
        # 1. Get or Create an Instructor
        instructor, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@cognito.com", "is_staff": True, "is_superuser": True}
        )
        if created:
            instructor.set_password("admin")
            instructor.save()
            self.stdout.write(self.style.SUCCESS("Created superuser: admin / admin"))

        # 2. Define The Curriculum Data
        courses_data = [
            {
                "title": "Data Structures & Algorithms in Python",
                "description": "Master the fundamentals of CS including Trees, Graphs, and HashMaps.",
                "modules": [
                    {
                        "title": "Trees & Graphs",
                        "lessons": [
                            {"title": "Binary Search Trees Explained", "video": "https://www.youtube.com/watch?v=lFq5mHe5WF4", "has_quiz": True},
                            {"title": "Understanding Tries (Prefix Trees)", "video": "https://www.youtube.com/watch?v=zIjfhVPRZCg", "has_quiz": False},
                            {"title": "Graph Traversal (BFS & DFS)", "video": "https://www.youtube.com/watch?v=pcKY4hjDrxk", "has_quiz": True},
                        ]
                    },
                    {
                        "title": "Dynamic Programming",
                        "lessons": [
                            {"title": "The Knapsack Problem", "video": "https://www.youtube.com/watch?v=xCbYnU54984", "has_quiz": False},
                            {"title": "Memoization vs Tabulation", "video": "https://www.youtube.com/watch?v=oBt53YbR9Kk", "has_quiz": True},
                        ]
                    }
                ]
            },
            {
                "title": "Advanced React Patterns",
                "description": "Level up your React skills with Composition, Hooks, and Performance.",
                "modules": [
                    {
                        "title": "Advanced Hooks",
                        "lessons": [
                            {"title": "useMemo and useCallback Deep Dive", "video": "https://www.youtube.com/watch?v=vpEmtYIzr2k", "has_quiz": True},
                            {"title": "Custom Hooks for Data Fetching", "video": "https://www.youtube.com/watch?v=J-g9ZJha8FE", "has_quiz": False},
                        ]
                    },
                    {
                        "title": "Performance",
                        "lessons": [
                            {"title": "React Profiler & Rendering", "video": "https://www.youtube.com/watch?v=7WDOe81b678", "has_quiz": False},
                        ]
                    }
                ]
            },
            {
                "title": "System Design for Beginners",
                "description": "Learn how to scale applications to millions of users.",
                "modules": [
                    {
                        "title": "Core Concepts",
                        "lessons": [
                            {"title": "Load Balancers & Horizontal Scaling", "video": "https://www.youtube.com/watch?v=K0Ta65OqQkY", "has_quiz": True},
                            {"title": "Database Sharding", "video": "https://www.youtube.com/watch?v=5faMjKuB9bc", "has_quiz": False},
                        ]
                    }
                ]
            },
             {
                "title": "DevOps with Docker & Kubernetes",
                "description": "Containerize your apps and orchestrate them in the cloud.",
                "modules": [
                    {
                        "title": "Docker Basics",
                        "lessons": [
                            {"title": "Writing your first Dockerfile", "video": "https://www.youtube.com/watch?v=fqMOX6JJhGo", "has_quiz": True},
                        ]
                    }
                ]
            }
        ]

        # 3. Loop and Create
        for course_data in courses_data:
            course = Course.objects.create(
                instructor=instructor,
                title=course_data["title"],
                description=course_data["description"],
                # Removing price since your model doesn't seem to have it in the snippet, 
                # or it has a default. If it has a price field, add price=19.99 here.
            )
            self.stdout.write(f"Creating Course: {course.title}")

            for i, module_data in enumerate(course_data["modules"]):
                module = Module.objects.create(course=course, title=module_data["title"], order=i+1)
                
                for j, lesson_data in enumerate(module_data["lessons"]):
                    # Note: We are saving the Video URL into the 'content' field
                    lesson = Lesson.objects.create(
                        module=module,
                        title=lesson_data["title"],
                        order=j+1,
                        content=lesson_data["video"] 
                    )

                    # 4. Add Quiz Questions (if flag is True)
                    if lesson_data["has_quiz"]:
                        self.create_quiz_for_lesson(lesson)

        self.stdout.write(self.style.SUCCESS("✅ Database Seeded Successfully!"))

    def create_quiz_for_lesson(self, lesson):
        """Helper to attach a generic quiz to a lesson"""
        q1 = Question.objects.create(
            lesson=lesson,
            text=f"What is the main concept of {lesson.title}?"
            # removed marks=10 if your Question model doesn't have it, 
            # but your snippet showed Question having marks? No, it didn't!
            # Looking at your snippet: Question has NO marks field.
            # Removing marks=10 to be safe.
        )
        
        # Using Choice instead of Answer
        Choice.objects.create(question=q1, text="It is about efficiency", is_correct=True)
        Choice.objects.create(question=q1, text="It is about styling", is_correct=False)
        Choice.objects.create(question=q1, text="It is about networking", is_correct=False)
        Choice.objects.create(question=q1, text="None of the above", is_correct=False)

        q2 = Question.objects.create(
            lesson=lesson,
            text=f"Which tool is best used for {lesson.title}?"
        )
        Choice.objects.create(question=q2, text="Python/JS", is_correct=True)
        Choice.objects.create(question=q2, text="MS Paint", is_correct=False)
        Choice.objects.create(question=q2, text="Notepad", is_correct=False)
