import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from courses.models import Course, Module, Lesson, Question, Choice, Enrollment, UserProgress, Certificate

User = get_user_model()

# --- 1. THE CONTENT LIBRARY (20 REAL COURSES) ---
# Format: (Category, Title, Description, Thumbnail)
COURSES_DATA = [
    # --- FRONTEND ---
    ("React", "Advanced React Patterns", "Master composition, hooks, and performance optimization for large-scale apps.", "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80"),
    ("NextJS", "Next.js 14 Full Stack", "Build server-side rendered apps with App Router and Server Actions.", "https://images.unsplash.com/photo-1618477247222-ac5912454594?w=800&q=80"),
    ("CSS", "Tailwind CSS Masterclass", "Build modern websites without leaving your HTML.", "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80"),
    ("JS", "Modern JavaScript (ES6+)", "From Closures to Promises: The deep dive you need.", "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80"),
    ("Design", "UI/UX Design with Figma", "Design beautiful interfaces and prototype like a pro.", "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80"),
    
    # --- BACKEND ---
    ("Python", "Python for Data Science", "From Pandas to Neural Networks in 30 days.", "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80"),
    ("Django", "Django REST Framework", "Build scalable APIs for mobile and web applications.", "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80"),
    ("Go", "Golang Backend Engineering", "High performance microservices with Go and gRPC.", "https://images.unsplash.com/photo-1618335829737-2228915674e0?w=800&q=80"),
    ("Node", "Node.js Microservices", "Event-driven architecture with Express and Kafka.", "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80"),
    ("SQL", "The Complete SQL Bootcamp", "Zero to Hero: PostgreSQL, MySQL and Database Design.", "https://images.unsplash.com/photo-1599658880436-c61792e70672?w=800&q=80"),
    
    # --- DEVOPS & CLOUD ---
    ("Docker", "Docker & Kubernetes Mastery", "Containerization and Orchestration for modern DevOps.", "https://images.unsplash.com/photo-1605745341117-9575522cd768?w=800&q=80"),
    ("AWS", "AWS Certified Solutions Architect", "Pass the SAA-C03 exam with hands-on labs.", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80"),
    ("Linux", "Linux Command Line", "Master the shell, scripting, and server management.", "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&q=80"),
    
    # --- CS FUNDAMENTALS ---
    ("SystemDesign", "System Design Interview Guide", "Scale applications to millions of users (Load Balancing, Caching).", "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80"),
    ("Algo", "Data Structures in Java", "Ace your coding interviews: Graphs, Trees, and DP.", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"),
    ("Security", "Cybersecurity Fundamentals", "Ethical hacking, network defense, and OWASP Top 10.", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80"),
    
    # --- EMERGING TECH ---
    ("AI", "Machine Learning A-Z", "Build models with Scikit-Learn, TensorFlow and PyTorch.", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"),
    ("Web3", "Blockchain & Solidity", "Build Smart Contracts and DApps on Ethereum.", "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80"),
    ("Mobile", "Flutter & Dart", "Build native iOS and Android apps with one codebase.", "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80"),
    ("Rust", "Rust Programming", "Memory safety without garbage collection. Build fast systems.", "https://images.unsplash.com/photo-1565153907400-7e01a9ab25f3?w=800&q=80"),
]

# --- 2. LESSON STRUCTURE MAP ---
# This gives "Real" names to lessons based on the category
LESSON_MAP = {
    "React": ["Understanding State", "The useEffect Hook", "Custom Hooks", "React Context API", "Performance Optimization"],
    "NextJS": ["App Router Basics", "Server Actions", "Client vs Server Components", "Static Site Generation", "Deploying to Vercel"],
    "SystemDesign": ["Horizontal vs Vertical Scaling", "Load Balancers", "Database Sharding", "Caching Strategies (Redis)", "CAP Theorem"],
    "Python": ["Lists and Dictionaries", "List Comprehensions", "Classes and Objects", "Decorators", "NumPy Basics"],
    "SQL": ["SELECT and WHERE", "GROUP BY and HAVING", "Joins (Inner, Left, Right)", "Window Functions", "Database Normalization"],
    "Docker": ["Images vs Containers", "Writing a Dockerfile", "Docker Compose", "Networking in Docker", "Kubernetes Pods"],
    "AI": ["Linear Regression", "Gradient Descent", "Neural Networks Intro", "Activation Functions", "Backpropagation"],
    "Algo": ["Big O Notation", "Arrays vs Linked Lists", "Binary Search Trees", "Hash Maps", "Graph Traversal (BFS/DFS)"],
    "Default": ["Introduction", "Core Concepts", "Advanced Techniques", "Best Practices", "Final Project"]
}

# --- 3. QUIZ BANK (Real Questions) ---
QUIZ_BANK = {
    "React": ("What is the rule of hooks?", [
        ("Only call at the top level", True), ("Call inside loops", False), ("Call inside conditions", False)
    ]),
    "SystemDesign": ("Which database property ensures reliability?", [
        ("ACID Compliance", True), ("BASE Consistency", False), ("Flexibility", False)
    ]),
    "Python": ("How do you define a private variable in Python?", [
        ("With double underscore __", True), ("With keyword private", False), ("You cannot", False)
    ]),
    "SQL": ("Which command removes all records but keeps the table structure?", [
        ("TRUNCATE", True), ("DROP", False), ("DELETE", False)
    ]),
    "Docker": ("What file defines the image structure?", [
        ("Dockerfile", True), ("docker-compose.yml", False), ("package.json", False)
    ]),
    "Default": ("What is the primary goal of this module?", [
        ("To master the fundamentals", True), ("To memorize syntax", False), ("To waste time", False)
    ])
}

# YouTube IDs to rotate
VIDEO_POOL = ["lFq5mHe5WF4", "vpEmtYIzr2k", "K0Ta65OqQkY", "xCbYnU54984", "7WDOe81b678"]

class Command(BaseCommand):
    help = "Seeds the database with 20 realistic courses and history."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("⚠️  Resetting Database Content..."))
        
        # Cleanup (Order matters!)
        Certificate.objects.all().delete()
        UserProgress.objects.all().delete()
        Enrollment.objects.all().delete()
        Choice.objects.all().delete()
        Question.objects.all().delete()
        Lesson.objects.all().delete()
        Module.objects.all().delete()
        Course.objects.all().delete()

        # Users
        admin, _ = User.objects.get_or_create(username="admin", defaults={"email":"admin@c.com", "is_staff":True, "is_superuser":True})
        admin.set_password("admin")
        admin.save()

        student, _ = User.objects.get_or_create(username="test123", defaults={"email":"test@c.com"})
        student.set_password("test123")
        student.save()
        
        self.stdout.write(self.style.SUCCESS("✅ Users Ready."))

        # Create Courses
        for index, (category, title, desc, thumb) in enumerate(COURSES_DATA):
            course = Course.objects.create(
                instructor=admin,
                title=title,
                description=desc,
                thumbnail_url=thumb
            )
            
            # --- Modules & Lessons ---
            # We create 2 modules per course
            lesson_titles = LESSON_MAP.get(category, LESSON_MAP["Default"])
            
            # Module 1 (First 2 lessons)
            mod1 = Module.objects.create(course=course, title="Foundations", order=1)
            self.create_lessons(mod1, lesson_titles[:2], category)
            
            # Module 2 (Next 3 lessons)
            mod2 = Module.objects.create(course=course, title="Advanced Concepts", order=2)
            self.create_lessons(mod2, lesson_titles[2:], category)
            
            # --- Enrollment & Progress Logic ---
            Enrollment.objects.create(student=student, course=course)

            # Courses 1-3: 100% COMPLETE (For Certificate Testing)
            if index < 3:
                self.complete_course_for_user(course, student)
                self.stdout.write(f"📚 {title} - [COMPLETED]")
            
            # Courses 4-8: 50% COMPLETE
            elif index < 8:
                self.partial_complete_course(course, student)
                self.stdout.write(f"📚 {title} - [IN PROGRESS]")
                
            else:
                self.stdout.write(f"📚 {title} - [NEW]")

        self.stdout.write(self.style.SUCCESS("\n🚀 Seed Complete! 20 Courses Generated."))
        self.stdout.write("👉 Log in as 'test123' (password: 'test123')")

    def create_lessons(self, module, titles, category):
        """Helper to create lessons and quizzes"""
        for i, title in enumerate(titles):
            lesson = Lesson.objects.create(
                module=module,
                title=title,
                content=f"https://www.youtube.com/watch?v={random.choice(VIDEO_POOL)}",
                order=i+1,
                duration_minutes=random.randint(15, 45)
            )
            
            # Add Quiz to the last lesson of the module
            if i == len(titles) - 1:
                self.add_quiz(lesson, category)

    def add_quiz(self, lesson, category):
        """Adds a context-aware quiz"""
        q_text, choices_data = QUIZ_BANK.get(category, QUIZ_BANK["Default"])
        
        q = Question.objects.create(lesson=lesson, text=q_text)
        
        # Shuffle choices so the answer isn't always A
        random.shuffle(choices_data)
        
        for text, is_correct in choices_data:
            Choice.objects.create(question=q, text=text, is_correct=is_correct)

    def complete_course_for_user(self, course, user):
        """Mark all lessons and quizzes as passed"""
        lessons = Lesson.objects.filter(module__course=course)
        for lesson in lessons:
            UserProgress.objects.create(
                user=user, lesson=lesson, is_completed=True, is_quiz_passed=True
            )
        # Generate Certificate
        Certificate.objects.create(user=user, course=course)

    def partial_complete_course(self, course, user):
        """Mark first module as passed"""
        first_module = course.modules.first()
        lessons = first_module.lessons.all()
        for lesson in lessons:
            UserProgress.objects.create(
                user=user, lesson=lesson, is_completed=True, is_quiz_passed=True
            )