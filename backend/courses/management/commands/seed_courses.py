import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course, Module, Lesson, Question, Choice, Enrollment, UserProgress

User = get_user_model()

# --- CONTENT POOLS (To generate varied data) ---
THUMBNAILS = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80", # Coding
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80", # React
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80", # System Design
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80", # Security
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", # Data
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80", # AI
]

VIDEO_URLS = [
    "https://www.youtube.com/watch?v=lFq5mHe5WF4", # Binary Trees
    "https://www.youtube.com/watch?v=vpEmtYIzr2k", # React Hooks
    "https://www.youtube.com/watch?v=K0Ta65OqQkY", # System Design
    "https://www.youtube.com/watch?v=xCbYnU54984", # Knapsack
    "https://www.youtube.com/watch?v=7WDOe81b678", # Profiler
]

COURSE_TITLES = [
    ("Advanced React Patterns", "Master composition, hooks, and performance."),
    ("Python for Data Science", "From Pandas to Neural Networks in 30 days."),
    ("System Design Interview Guide", "Scale applications to millions of users."),
    ("Cybersecurity Fundamentals", "Ethical hacking and network defense."),
    ("Docker & Kubernetes Mastery", "Containerization for modern DevOps."),
    ("Machine Learning A-Z", "Build models with Scikit-Learn and TensorFlow."),
    ("The Complete SQL Bootcamp", "Zero to Hero: PostgreSQL and MySQL."),
    ("UI/UX Design Masterclass", "Design beautiful interfaces in Figma."),
    ("Next.js 14 Full Stack", "Build server-side rendered apps with ease."),
    ("Golang Backend Engineering", "High performance microservices with Go.")
]

class Command(BaseCommand):
    help = "Seeds the database with 10 Courses (2 Complete, 8 Random)."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("⚠️  Wiping old Courses data..."))
        
        # 1. CLEANUP
        UserProgress.objects.all().delete()
        Enrollment.objects.all().delete()
        Choice.objects.all().delete()
        Question.objects.all().delete()
        Lesson.objects.all().delete()
        Module.objects.all().delete()
        Course.objects.all().delete()
        
        # 2. USERS
        admin, _ = User.objects.get_or_create(username="admin", defaults={"email":"admin@c.com", "is_staff":True, "is_superuser":True})
        admin.set_password("admin")
        admin.save()

        student, _ = User.objects.get_or_create(username="test123", defaults={"email":"test@c.com"})
        student.set_password("test123")
        student.save()
        self.stdout.write(self.style.SUCCESS("✅ Users Ready: admin / test123"))

        # 3. GENERATE COURSES
        for index, (title, desc) in enumerate(COURSE_TITLES):
            # First 2 courses are 100% COMPLETE
            is_fully_complete = (index < 2) 
            
            course = Course.objects.create(
                instructor=admin,
                title=title,
                description=desc,
                thumbnail_url=THUMBNAILS[index % len(THUMBNAILS)]
            )
            
            # Enroll Student
            Enrollment.objects.create(student=student, course=course)
            
            msg = " [🏆 100% DONE]" if is_fully_complete else " [In Progress]"
            self.stdout.write(f"Created: {title}{msg}")

            # Create 2 Modules per Course
            for m_idx in range(1, 3): 
                module = Module.objects.create(
                    course=course, 
                    title=f"Module {m_idx}: Core Concepts", 
                    order=m_idx
                )
                
                # Create 3 Lessons per Module (Total 6 Lessons)
                for l_idx in range(1, 4):
                    # Rotate videos
                    vid_url = VIDEO_URLS[(index + m_idx + l_idx) % len(VIDEO_URLS)]
                    
                    lesson = Lesson.objects.create(
                        module=module,
                        title=f"Lesson {m_idx}.{l_idx}: {title.split()[0]} Deep Dive",
                        order=l_idx,
                        content=vid_url
                    )

                    # --- PROGRESS LOGIC ---
                    if is_fully_complete:
                        # Mark EVERYTHING complete
                        UserProgress.objects.create(
                            user=student, lesson=lesson, is_completed=True, is_quiz_passed=True
                        )
                    else:
                        # Random Progress (40% chance to complete a lesson)
                        if random.choice([True, False, False, False, False]): 
                            UserProgress.objects.create(
                                user=student, lesson=lesson, is_completed=True, is_quiz_passed=True
                            )

                    # --- QUIZ LOGIC (At least 2 per course) ---
                    # Add quiz to the 1st lesson of each module
                    if l_idx == 1: 
                        self.create_quiz(lesson)

        self.stdout.write(self.style.SUCCESS("\n🚀 Seed Complete!"))
        self.stdout.write(f"Courses 1 & 2 are 100% Complete (Check Certificate).")
        self.stdout.write(f"Login with: test123 / test123")

    def create_quiz(self, lesson):
        """Creates a simple 2-question quiz for a lesson"""
        # Q1
        q1 = Question.objects.create(lesson=lesson, text="What is the primary focus of this lesson?")
        Choice.objects.create(question=q1, text="Understanding the core concept", is_correct=True)
        Choice.objects.create(question=q1, text="Memorizing syntax", is_correct=False)
        Choice.objects.create(question=q1, text="Installing VS Code", is_correct=False)
        
        # Q2
        q2 = Question.objects.create(lesson=lesson, text="Is this technology scalable?")
        Choice.objects.create(question=q2, text="Yes, highly scalable", is_correct=True)
        Choice.objects.create(question=q2, text="No, it is for toys only", is_correct=False)