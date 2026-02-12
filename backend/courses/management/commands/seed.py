"""
Seed the database with realistic demo data.

Usage:
    python manage.py seed          # Seed the database
    python manage.py seed --flush  # Clear existing data first, then seed

Creates:
    - 5 users (primary: test123/test123)
    - 100 courses across 10 categories
    - 3 modules per course, 3 lessons per module (900 lessons total)
    - Quiz questions with 4 choices each
    - Varied enrollments and progress per user
"""

import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import (
    Course, Module, Lesson, Question, Choice,
    Enrollment, UserProgress, Certificate, UserProfile,
)

User = get_user_model()

# ── Real YouTube video IDs for lessons ──────────────────────────────────
YOUTUBE_VIDEOS = [
    "https://www.youtube.com/watch?v=rfscVS0vtbw",   # Python for Beginners
    "https://www.youtube.com/watch?v=PkZNo7MFNFg",   # JavaScript Tutorial
    "https://www.youtube.com/watch?v=w7ejDZ8SWv8",   # React JS Crash Course
    "https://www.youtube.com/watch?v=HXV3zeQKqGY",   # CSS Crash Course
    "https://www.youtube.com/watch?v=pTFZrS5XjTg",   # Node.js Tutorial
    "https://www.youtube.com/watch?v=0sOvCWFmrtA",   # TypeScript
    "https://www.youtube.com/watch?v=qz0aGYrrlhU",   # SQL Tutorial
    "https://www.youtube.com/watch?v=8jLOx1hD3_o",   # C++ Tutorial
    "https://www.youtube.com/watch?v=grEKMHGYyns",   # Java for Beginners
    "https://www.youtube.com/watch?v=ua-CiDNNj30",   # Django REST Framework
    "https://www.youtube.com/watch?v=7S_tz1z_5bA",   # MySQL
    "https://www.youtube.com/watch?v=_uQrJ0TkZlc",   # Python OOP
    "https://www.youtube.com/watch?v=Oe421EPjeBE",   # Git and GitHub
    "https://www.youtube.com/watch?v=fBNz5xF-Kx4",   # Node Express
    "https://www.youtube.com/watch?v=4deVCNJq3qc",   # Vue JS Crash Course
    "https://www.youtube.com/watch?v=9zUHg7xjIqQ",   # AWS Basics
    "https://www.youtube.com/watch?v=3c-iBn73dDE",   # Docker Tutorial
    "https://www.youtube.com/watch?v=X48VuDVv0do",   # Kubernetes
    "https://www.youtube.com/watch?v=pEfrdAtAmqk",   # MongoDB
    "https://www.youtube.com/watch?v=RGOj5yH7evk",   # Git Tutorial
]

# ── Course categories with realistic titles ─────────────────────────────
CATEGORIES = {
    "Python": [
        "Python for Absolute Beginners",
        "Intermediate Python Programming",
        "Advanced Python: Decorators & Metaclasses",
        "Python Data Structures & Algorithms",
        "Python Automation & Scripting",
        "Python Web Scraping Masterclass",
        "Object-Oriented Python",
        "Python Testing with Pytest",
        "Asyncio & Concurrent Python",
        "Python Design Patterns",
    ],
    "JavaScript": [
        "JavaScript Fundamentals",
        "ES6+ Modern JavaScript",
        "JavaScript DOM Manipulation",
        "Asynchronous JavaScript: Promises & Async/Await",
        "JavaScript Design Patterns",
        "Functional Programming in JavaScript",
        "JavaScript Performance Optimization",
        "Building RESTful APIs with Node.js",
        "TypeScript from Scratch",
        "Testing JavaScript with Jest",
    ],
    "Web Development": [
        "HTML5 & CSS3 from Zero to Hero",
        "Responsive Web Design Masterclass",
        "CSS Grid & Flexbox Deep Dive",
        "Tailwind CSS: Utility-First Framework",
        "Progressive Web Apps (PWA)",
        "Web Accessibility (a11y) Guide",
        "Web Performance Optimization",
        "SEO for Developers",
        "HTTP/2 & Web Protocols",
        "Browser DevTools Mastery",
    ],
    "React": [
        "React 19: The Complete Guide",
        "React Hooks In-Depth",
        "State Management with Redux Toolkit",
        "React Router v6 Masterclass",
        "Next.js Full-Stack Applications",
        "React Testing Library & Vitest",
        "React Performance Patterns",
        "Building Design Systems with React",
        "React Native Mobile Development",
        "Server Components & React 19 Features",
    ],
    "Django": [
        "Django for Beginners: Build Your First App",
        "Django REST Framework Complete Guide",
        "Django Authentication & Authorization",
        "Django ORM Mastery",
        "Celery & Async Tasks in Django",
        "Django Testing Best Practices",
        "Django Deployment with Docker",
        "Django Channels & WebSockets",
        "Building APIs with Django Ninja",
        "Django Security Hardening",
    ],
    "Data Science": [
        "Introduction to Data Science with Python",
        "Pandas & NumPy for Data Analysis",
        "Data Visualization with Matplotlib & Seaborn",
        "Statistical Analysis with Python",
        "Machine Learning Foundations",
        "Deep Learning with TensorFlow",
        "Natural Language Processing (NLP)",
        "Computer Vision with OpenCV",
        "Time Series Analysis & Forecasting",
        "Feature Engineering Masterclass",
    ],
    "DevOps": [
        "Linux Command Line Essentials",
        "Git & GitHub Workflow Mastery",
        "Docker: Containerize Everything",
        "Kubernetes Orchestration",
        "CI/CD with GitHub Actions",
        "Infrastructure as Code with Terraform",
        "AWS Cloud Practitioner",
        "Monitoring with Prometheus & Grafana",
        "Nginx & Reverse Proxy Setup",
        "Shell Scripting for Automation",
    ],
    "Databases": [
        "SQL Fundamentals",
        "PostgreSQL Administration & Tuning",
        "MongoDB for Node.js Developers",
        "Redis: In-Memory Data Store",
        "Database Design & Normalization",
        "Query Optimization & Indexing",
        "Graph Databases with Neo4j",
        "Database Migrations Best Practices",
        "Data Modeling for Real Applications",
        "NoSQL vs SQL: When to Use What",
    ],
    "System Design": [
        "System Design Interview Prep",
        "Microservices Architecture",
        "API Design Best Practices",
        "Caching Strategies & Patterns",
        "Message Queues: RabbitMQ & Kafka",
        "Load Balancing & Scaling",
        "Distributed Systems Fundamentals",
        "Event-Driven Architecture",
        "Rate Limiting & Throttling",
        "Designing Data-Intensive Applications",
    ],
    "Security": [
        "Web Security Fundamentals (OWASP Top 10)",
        "Authentication Patterns: JWT, OAuth, Sessions",
        "Cryptography for Developers",
        "Secure Coding Practices",
        "Penetration Testing Basics",
        "API Security & Rate Limiting",
        "CORS, CSRF & XSS Explained",
        "Identity & Access Management (IAM)",
        "Secrets Management & Vault",
        "Security Auditing & Compliance",
    ],
}

# ── Module templates per category ────────────────────────────────────────
MODULE_TEMPLATES = {
    "Python": ["Foundations", "Core Concepts", "Advanced Topics"],
    "JavaScript": ["Language Basics", "DOM & Browser APIs", "Advanced Patterns"],
    "Web Development": ["HTML & Structure", "CSS & Styling", "Performance & Deployment"],
    "React": ["Getting Started", "Component Patterns", "State & Side Effects"],
    "Django": ["Setup & Models", "Views & Serializers", "Testing & Deployment"],
    "Data Science": ["Data Wrangling", "Analysis & Visualization", "Machine Learning"],
    "DevOps": ["Fundamentals", "Containerization", "CI/CD & Monitoring"],
    "Databases": ["Schema Design", "Queries & Optimization", "Advanced Topics"],
    "System Design": ["Core Concepts", "Patterns & Trade-offs", "Case Studies"],
    "Security": ["Threat Landscape", "Defense Mechanisms", "Best Practices"],
}

# ── Lesson templates ─────────────────────────────────────────────────────
LESSON_TEMPLATES = [
    ["Introduction & Setup", "Core Concepts Explained", "Hands-on Practice"],
    ["Theory & Fundamentals", "Building Blocks", "Mini Project"],
    ["Deep Dive", "Real-World Patterns", "Summary & Review"],
]

# ── Quiz question bank per category ──────────────────────────────────────
QUIZ_BANK = {
    "Python": [
        ("What is the output of `print(type([]))`?", ["<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'set'>"], 0),
        ("Which keyword defines a function in Python?", ["func", "def", "function", "lambda"], 1),
        ("What does `len('hello')` return?", ["4", "5", "6", "Error"], 1),
    ],
    "JavaScript": [
        ("What is `typeof null` in JavaScript?", ["'null'", "'undefined'", "'object'", "'boolean'"], 2),
        ("Which method adds an element to the end of an array?", ["push()", "pop()", "shift()", "unshift()"], 0),
        ("What does `===` check?", ["Value only", "Type only", "Value and type", "Reference"], 2),
    ],
    "Web Development": [
        ("What does CSS stand for?", ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"], 1),
        ("Which HTML tag is used for the largest heading?", ["<h6>", "<heading>", "<h1>", "<head>"], 2),
        ("What is the default display of a `<div>`?", ["inline", "block", "flex", "grid"], 1),
    ],
    "React": [
        ("What hook manages state in functional components?", ["useEffect", "useState", "useContext", "useRef"], 1),
        ("What does JSX stand for?", ["JavaScript XML", "JavaScript Extension", "Java Syntax XML", "JSON XML"], 0),
        ("Which method triggers a re-render?", ["forceUpdate()", "setState()", "render()", "Both A and B"], 3),
    ],
    "Django": [
        ("What is Django's ORM?", ["Object Relational Mapping", "Object Remote Method", "Online Resource Manager", "Output Rendering Module"], 0),
        ("Which file defines URL patterns?", ["views.py", "models.py", "urls.py", "settings.py"], 2),
        ("What does `migrate` command do?", ["Creates models", "Applies database changes", "Starts server", "Runs tests"], 1),
    ],
    "Data Science": [
        ("Which library is used for DataFrames?", ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"], 1),
        ("What does NaN stand for?", ["Not a Number", "Null and Nil", "No Assigned Name", "None at Null"], 0),
        ("Which plot type shows distribution?", ["Bar chart", "Histogram", "Pie chart", "Line chart"], 1),
    ],
    "DevOps": [
        ("What does CI/CD stand for?", ["Code Integration/Code Delivery", "Continuous Integration/Continuous Delivery", "Complete Integration/Complete Deployment", "Cloud Integration/Cloud Delivery"], 1),
        ("Which command lists Docker containers?", ["docker list", "docker ps", "docker show", "docker containers"], 1),
        ("What is a Dockerfile?", ["A log file", "A blueprint for images", "A container dump", "A network config"], 1),
    ],
    "Databases": [
        ("What does SQL stand for?", ["Structured Query Language", "Simple Query Logic", "Standard Query Library", "Sequential Query Loader"], 0),
        ("Which key uniquely identifies a row?", ["Foreign Key", "Primary Key", "Candidate Key", "Composite Key"], 1),
        ("What is normalization?", ["Adding redundancy", "Removing redundancy", "Adding indexes", "Removing indexes"], 1),
    ],
    "System Design": [
        ("What is horizontal scaling?", ["Adding more RAM", "Adding more servers", "Adding more CPU", "Adding more storage"], 1),
        ("What does CAP theorem state?", ["Choose 2 of 3: Consistency, Availability, Partition Tolerance", "Choose all 3 always", "Ignore consistency", "CAP is outdated"], 0),
        ("What is a load balancer?", ["Database optimizer", "Traffic distributor", "Cache invalidator", "Message broker"], 1),
    ],
    "Security": [
        ("What does XSS stand for?", ["Cross-Site Scripting", "Cross-Server Security", "XML Security Standard", "Extra Secure Socket"], 0),
        ("What is CSRF?", ["Cross-Site Request Forgery", "Client-Side Rendering Framework", "Cached Server Response Format", "Cross-System Resource Fetch"], 0),
        ("What does HTTPS add over HTTP?", ["Speed", "Encryption (TLS/SSL)", "Compression", "Caching"], 1),
    ],
}

# ── Course descriptions ──────────────────────────────────────────────────
DESCRIPTION_TEMPLATES = [
    "Master {topic} from fundamentals to advanced concepts. This course includes hands-on projects, real-world examples, and quizzes to test your understanding. Perfect for developers looking to level up their skills.",
    "A comprehensive deep-dive into {topic}. Learn industry best practices, common patterns, and avoid common pitfalls. Includes practical exercises and a capstone project.",
    "Build production-ready applications with {topic}. This course covers architecture, performance optimization, testing, and deployment strategies used by top tech companies.",
    "From zero to hero in {topic}. Whether you're a complete beginner or looking to fill knowledge gaps, this structured curriculum will take you step by step through everything you need to know.",
    "Learn {topic} the way professionals use it. Real-world scenarios, code reviews, and hands-on labs ensure you gain practical experience, not just theoretical knowledge.",
]

# ── Thumbnail URLs (Unsplash placeholders) ───────────────────────────────
THUMBNAILS = [
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",  # code on laptop
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",  # coding
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",  # macbook code
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800",  # code screen
    "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800",  # programming
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800",  # dark code
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",  # keyboard
    "https://images.unsplash.com/photo-1607799279861-4dd421887fc5?w=800",  # github
    "https://images.unsplash.com/photo-1537432376149-e84978e3f104?w=800",  # workspace
    "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800",  # learning
]

# ── Users ────────────────────────────────────────────────────────────────
USERS = [
    {"username": "test123",     "email": "test123@cognito.dev",     "password": "test123",     "first_name": "Test",     "last_name": "User",     "role": "STUDENT"},
    {"username": "alice_dev",   "email": "alice@cognito.dev",       "password": "alice123",    "first_name": "Alice",    "last_name": "Johnson",  "role": "STUDENT"},
    {"username": "bob_coder",   "email": "bob@cognito.dev",         "password": "bob123",      "first_name": "Bob",      "last_name": "Smith",    "role": "STUDENT"},
    {"username": "charlie_ml",  "email": "charlie@cognito.dev",     "password": "charlie123",  "first_name": "Charlie",  "last_name": "Brown",    "role": "STUDENT"},
    {"username": "dana_sec",    "email": "dana@cognito.dev",        "password": "dana123",     "first_name": "Dana",     "last_name": "Williams", "role": "STUDENT"},
]

# ── Enrollment counts per user ───────────────────────────────────────────
# test123=45, alice=23, bob=35, charlie=15, dana=28
ENROLLMENT_COUNTS = [45, 23, 35, 15, 28]


class Command(BaseCommand):
    help = "Seed database with 100 courses, 5 users, and realistic demo data"

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Clear existing data before seeding")

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write("🗑  Flushing existing data...")
            UserProgress.objects.all().delete()
            Certificate.objects.all().delete()
            Enrollment.objects.all().delete()
            Choice.objects.all().delete()
            Question.objects.all().delete()
            Lesson.objects.all().delete()
            Module.objects.all().delete()
            Course.objects.all().delete()
            UserProfile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS("   Done."))

        # ── 1. Create Users ──────────────────────────────────────────
        self.stdout.write("\n👤 Creating users...")
        users = []
        for u in USERS:
            user, created = User.objects.get_or_create(
                username=u["username"],
                defaults={
                    "email": u["email"],
                    "first_name": u["first_name"],
                    "last_name": u["last_name"],
                    "role": u["role"],
                }
            )
            if created:
                user.set_password(u["password"])
                user.save()
                UserProfile.objects.get_or_create(
                    user=user,
                    defaults={"bio": f"Hi, I'm {u['first_name']}! Learning to code on Cognito LMS."}
                )
            users.append(user)
            status = "✅ created" if created else "⏭  exists"
            self.stdout.write(f"   {status}: {u['username']}")

        # ── 2. Create Instructor ─────────────────────────────────────
        instructor, created = User.objects.get_or_create(
            username="prof_cognito",
            defaults={
                "email": "professor@cognito.dev",
                "first_name": "Professor",
                "last_name": "Cognito",
                "role": "INSTRUCTOR",
            }
        )
        if created:
            instructor.set_password("instructor123")
            instructor.save()
            UserProfile.objects.get_or_create(
                user=instructor,
                defaults={"bio": "Lead instructor at Cognito LMS. 10+ years in software engineering."}
            )
        self.stdout.write(f"   {'✅ created' if created else '⏭  exists'}: prof_cognito (instructor)\n")

        # ── 3. Create 100 Courses ────────────────────────────────────
        self.stdout.write("📚 Creating 100 courses...")
        all_courses = []
        course_idx = 0

        for category, titles in CATEGORIES.items():
            for title in titles:
                course, created = Course.objects.get_or_create(
                    title=title,
                    defaults={
                        "description": random.choice(DESCRIPTION_TEMPLATES).format(topic=title),
                        "instructor": instructor,
                        "thumbnail_url": random.choice(THUMBNAILS),
                    }
                )
                all_courses.append(course)

                if created:
                    # ── Modules ──
                    modules_names = MODULE_TEMPLATES[category]
                    for m_idx, m_name in enumerate(modules_names):
                        module = Module.objects.create(
                            course=course,
                            title=f"{m_name}",
                            order=m_idx + 1,
                        )

                        # ── Lessons ──
                        lesson_names = LESSON_TEMPLATES[m_idx]
                        for l_idx, l_name in enumerate(lesson_names):
                            video = random.choice(YOUTUBE_VIDEOS)
                            content = (
                                f"# {l_name}\n\n"
                                f"## Overview\n"
                                f"In this lesson, you'll learn key concepts about **{title}** — "
                                f"specifically focusing on {m_name.lower()}.\n\n"
                                f"## Video Lecture\n"
                                f"Watch the video below and take notes:\n\n"
                                f"{video}\n\n"
                                f"## Key Takeaways\n"
                                f"- Understand the fundamentals of {m_name.lower()}\n"
                                f"- Apply concepts through hands-on exercises\n"
                                f"- Build confidence for the next module\n\n"
                                f"## Practice Exercise\n"
                                f"Try implementing what you learned in a small project. "
                                f"Use the code editor below to practice."
                            )
                            lesson = Lesson.objects.create(
                                module=module,
                                title=l_name,
                                content=content,
                                order=l_idx + 1,
                                duration_minutes=random.choice([15, 20, 25, 30, 45, 60]),
                            )

                            # ── Quiz (one question per lesson) ──
                            quiz_data = random.choice(QUIZ_BANK[category])
                            q_text, choices, correct_idx = quiz_data
                            question = Question.objects.create(
                                lesson=lesson,
                                text=q_text,
                            )
                            for c_idx, c_text in enumerate(choices):
                                Choice.objects.create(
                                    question=question,
                                    text=c_text,
                                    is_correct=(c_idx == correct_idx),
                                )

                course_idx += 1
                if course_idx % 25 == 0:
                    self.stdout.write(f"   {course_idx}/100 courses created...")

        self.stdout.write(self.style.SUCCESS(f"   ✅ {len(all_courses)} courses ready.\n"))

        # ── 4. Set DAG prerequisites (grandparent chains) ─────────────
        self.stdout.write("🔗 Setting DAG prerequisites...")
        prereq_count = 0
        for category, titles in CATEGORIES.items():
            cat_courses = [c for c in all_courses if c.title in titles]
            # Build deep chains per category:
            #   [1] → [0]                     (parent)
            #   [2] → [1] → [0]              (grandparent)
            #   [3] → [2] → [1] → [0]        (great-grandparent)
            #   [4] → [3]                     (separate chain)
            #   [6] → [5]                     (another chain)
            #   [7] → [5] and [7] → [6]      (diamond: two parents)
            if len(cat_courses) >= 8:
                cat_courses[1].prerequisites.add(cat_courses[0])
                cat_courses[2].prerequisites.add(cat_courses[1])
                cat_courses[3].prerequisites.add(cat_courses[2])
                cat_courses[4].prerequisites.add(cat_courses[3])
                # Second chain
                cat_courses[6].prerequisites.add(cat_courses[5])
                # Diamond dependency: [7] requires both [5] and [6]
                cat_courses[7].prerequisites.add(cat_courses[5])
                cat_courses[7].prerequisites.add(cat_courses[6])
                prereq_count += 7
        self.stdout.write(self.style.SUCCESS(f"   ✅ {prereq_count} prerequisite edges linked (multi-level DAG).\n"))

        # ── 5. Enrollments ────────────────────────────────────────────
        self.stdout.write("📝 Creating enrollments...")
        random.seed(42)  # Reproducible

        for user, count in zip(users, ENROLLMENT_COUNTS):
            # Pick random courses for this user
            enrolled_courses = random.sample(all_courses, min(count, len(all_courses)))
            created_count = 0

            for course in enrolled_courses:
                _, created = Enrollment.objects.get_or_create(
                    student=user,
                    course=course,
                )
                if created:
                    created_count += 1

            self.stdout.write(f"   {user.username}: enrolled in {created_count} courses")

        self.stdout.write("")

        # ── 6. Progress ──────────────────────────────────────────────
        self.stdout.write("📊 Generating progress...")

        for user, enroll_count in zip(users, ENROLLMENT_COUNTS):
            enrollments = Enrollment.objects.filter(student=user)

            for enrollment in enrollments:
                lessons = Lesson.objects.filter(module__course=enrollment.course)
                total = lessons.count()
                if total == 0:
                    continue

                # Vary progress: some courses 100%, some partial, some untouched
                roll = random.random()
                if roll < 0.2:
                    # 20% courses: not started
                    continue
                elif roll < 0.5:
                    # 30% courses: partially complete (30-70%)
                    complete_count = int(total * random.uniform(0.3, 0.7))
                else:
                    # 50% courses: fully complete
                    complete_count = total

                for lesson in lessons[:complete_count]:
                    UserProgress.objects.get_or_create(
                        user=user,
                        lesson=lesson,
                        defaults={
                            "is_completed": True,
                            "is_quiz_passed": random.random() > 0.15,  # 85% pass rate
                        }
                    )

            self.stdout.write(f"   {user.username}: progress generated")

        self.stdout.write("")

        # ── 7. Certificates for fully completed courses ───────────────
        self.stdout.write("🏆 Issuing certificates...")
        cert_count = 0

        for user in users:
            enrollments = Enrollment.objects.filter(student=user)
            for enrollment in enrollments:
                lessons = Lesson.objects.filter(module__course=enrollment.course)
                total = lessons.count()
                if total == 0:
                    continue

                completed = UserProgress.objects.filter(
                    user=user,
                    lesson__in=lessons,
                    is_completed=True,
                    is_quiz_passed=True,
                ).count()

                if completed == total:
                    _, created = Certificate.objects.get_or_create(
                        user=user,
                        course=enrollment.course,
                    )
                    if created:
                        cert_count += 1

        self.stdout.write(self.style.SUCCESS(f"   ✅ {cert_count} certificates issued.\n"))

        # ── Summary ──────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("🎉 SEED COMPLETE"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"   Users:       {User.objects.count()}")
        self.stdout.write(f"   Courses:     {Course.objects.count()}")
        self.stdout.write(f"   Modules:     {Module.objects.count()}")
        self.stdout.write(f"   Lessons:     {Lesson.objects.count()}")
        self.stdout.write(f"   Questions:   {Question.objects.count()}")
        self.stdout.write(f"   Enrollments: {Enrollment.objects.count()}")
        self.stdout.write(f"   Progress:    {UserProgress.objects.count()}")
        self.stdout.write(f"   Certificates:{Certificate.objects.count()}")
        self.stdout.write("")
        self.stdout.write(f"   🔑 Primary login: test123 / test123")
        self.stdout.write("")
