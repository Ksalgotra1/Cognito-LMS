# backend/courses/views.py

import io
import qrcode  # <--- For QR Code generation
from datetime import date, timedelta
import datetime
import time
import random
import json
import requests

from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.apps import apps
from django.db.models import Count, Q  # <--- Added for Analytics
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.throttling import UserRateThrottle
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView 

# --- REPORTLAB IMPORTS (For PDF Generation) ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader

# --- APP IMPORTS ---
from .models import Course, Lesson, UserProgress, Question, Choice, Certificate, Enrollment, StudyPlan, UserProfile
from .serializers import CourseSerializer, QuestionSerializer, CertificateSerializer, UserProfileSerializer
from .utils import generate_study_schedule

# --- SERVICE IMPORTS ---
from .services import get_rag_context
from .ai_client import get_chat_response, get_search_keywords 

# --- TASK IMPORTS ---
from .tasks import send_enrollment_email

# --- Course Views ---

class CourseListCreateView(generics.ListCreateAPIView):
    """
    Handles listing all courses and creating new ones.
    Only authenticated users can create courses (Instructors).
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the instructor
        serializer.save(instructor=self.request.user)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Handles retrieving, updating, and deleting a specific course.
    🔥 UPDATED: Includes 'Locking' logic AND N+1 Query Optimization.
    """
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # 1. 🔥 CACHE WARMER (Predictive Loading) 🔥
        # We force the "Heavy Lifting" (Grandparent DAG calculation) to happen 
        # right now, while the user is reading the course title.
        try:
            get_rag_context(instance.id, request.user)
            # print(f"🔥 [Cache Warmer] Pre-loaded DAG for Course {instance.id}")
        except Exception:
            pass # Silently fail if Redis is down

        # 2. ⚡️ N+1 QUERY OPTIMIZATION ⚡️
        # Fetch ALL completed lesson IDs for this user & course in ONE query.
        # This prevents the serializer from hitting the DB for every single lesson.
        completed_lesson_ids = set()
        if request.user.is_authenticated:
            completed_lesson_ids = set(
                UserProgress.objects.filter(
                    user=request.user, 
                    lesson__module__course=instance, 
                    is_completed=True
                ).values_list('lesson_id', flat=True)
            )

        # 3. Get Serialized Data with Optimized Context
        # We pass the pre-fetched set to the serializer context
        context = self.get_serializer_context()
        context['completed_lesson_ids'] = completed_lesson_ids
        
        serializer = self.get_serializer(instance, context=context)
        data = serializer.data

        # 4. 🔒 LOCKING LOGIC 🔒
        # Check if the user is enrolled
        user = request.user
        is_enrolled = False
        if user.is_authenticated:
            is_enrolled = Enrollment.objects.filter(student=user, course=instance).exists()
        
        # Inject Enrollment Status into response
        data['is_enrolled'] = is_enrolled

        # Iterate through modules/lessons to lock content if not enrolled
        if 'modules' in data:
            for module in data['modules']:
                if 'lessons' in module:
                    for lesson in module['lessons']:
                        if is_enrolled:
                            # User is enrolled: Show everything
                            lesson['is_locked'] = False
                        else:
                            # User NOT enrolled: Lock it 🔒
                            lesson['content'] = "🔒 Locked. Enroll to view content."
                            lesson['is_locked'] = True
                            # Hide sensitive data
                            lesson['video_url'] = None 

        return Response(data)


# --- STUDENT ANALYTICS DASHBOARD ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_dashboard_stats(request):
    """
    Returns analytics for the student dashboard:
    - List of enrolled courses with progress %
    - 'Next Lesson' to resume learning
    - Total stats (completed lessons, enrolled count)
    """
    user = request.user
    
    # 1. Get courses via the Enrollment model to ensure we only show valid enrollments
    enrollments = Enrollment.objects.filter(student=user).select_related('course')
    
    course_cards = []
    
    for enrollment in enrollments:
        course = enrollment.course
        
        # A. Calculate Progress %
        total_lessons = Lesson.objects.filter(module__course=course).count()
        completed_lessons = UserProgress.objects.filter(
            user=user, 
            lesson__module__course=course, 
            is_completed=True
        ).count()
        
        progress_percent = 0
        if total_lessons > 0:
            progress_percent = int((completed_lessons / total_lessons) * 100)
            
        # B. Find the "Up Next" Lesson (First incomplete lesson)
        all_lesson_ids = Lesson.objects.filter(module__course=course)\
            .order_by('module__order', 'order')\
            .values_list('id', flat=True)
        
        completed_lesson_ids = UserProgress.objects.filter(
            user=user, 
            lesson__module__course=course, 
            is_completed=True
        ).values_list('lesson_id', flat=True)
        
        next_lesson_id = next((lid for lid in all_lesson_ids if lid not in completed_lesson_ids), None)
        
        next_lesson_title = "Course Completed! 🏆"
        next_lesson_url = None
        
        if next_lesson_id:
            next_lesson_obj = Lesson.objects.get(id=next_lesson_id)
            next_lesson_title = next_lesson_obj.title
            next_lesson_url = f"/courses/{course.id}"

        course_cards.append({
            "id": course.id,
            "title": course.title,
            "thumbnail": course.thumbnail_url, 
            "progress": progress_percent,
            "completed_lessons": completed_lessons,
            "total_lessons": total_lessons,
            "next_lesson_title": next_lesson_title,
            "next_lesson_url": next_lesson_url
        })

    return Response({
        "enrolled_courses": course_cards,
        "stats": {
            "total_enrolled": enrollments.count(),
            "total_completed_lessons": UserProgress.objects.filter(user=user, is_completed=True).count()
        }
    })


# --- Lesson Completion Logic ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_lesson_completion(request, lesson_id):
    """
    Toggles the 'is_completed' status of a lesson for the user.
    """
    lesson = get_object_or_404(Lesson, id=lesson_id)
    progress, created = UserProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson
    )
    progress.is_completed = not progress.is_completed
    progress.save()
    
    return Response({
        "lesson_id": lesson.id,
        "is_completed": progress.is_completed
    })


# --- Quiz Engine Logic ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz(request, lesson_id):
    """
    Fetch all questions for a specific lesson to render the quiz UI.
    """
    lesson = get_object_or_404(Lesson, id=lesson_id)
    questions = lesson.questions.all()
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, lesson_id):
    """
    Grade the quiz on the server side (Security best practice).
    """
    lesson = get_object_or_404(Lesson, id=lesson_id)
    questions = lesson.questions.all()
    
    total_questions = questions.count()
    correct_count = 0
    user_answers = request.data 
    
    for question in questions:
        question_id_str = str(question.id)
        if question_id_str in user_answers:
            selected_choice_id = user_answers[question_id_str]
            is_correct = Choice.objects.filter(
                id=selected_choice_id, 
                question=question, 
                is_correct=True
            ).exists()
            if is_correct:
                correct_count += 1

    if total_questions > 0:
        score = (correct_count / total_questions) * 100
    else:
        score = 0
    
    passed = score >= 70

    if passed:
        progress, created = UserProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        progress.is_quiz_passed = True
        progress.save()
    
    return Response({
        "total": total_questions,
        "correct": correct_count,
        "score": round(score, 2),
        "passed": passed 
    })


# ---  Certificate Generator ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_certificate(request, course_id):
    """
    Generates a Professional PDF certificate using ReportLab.
    """
    course = get_object_or_404(Course, id=course_id)
    user = request.user
    
    # 1. Video Completion Check
    total_lessons = Lesson.objects.filter(module__course=course).count()
    completed_lessons = UserProgress.objects.filter(
        user=user, lesson__module__course=course, is_completed=True
    ).count()

    if completed_lessons < total_lessons:
        return Response({"detail": f"Incomplete videos. ({completed_lessons}/{total_lessons})"}, status=403)

    # 2. Quiz Completion Check
    lessons_with_quizzes = Lesson.objects.filter(module__course=course, questions__isnull=False).distinct().count()
    passed_quizzes = UserProgress.objects.filter(
        user=user, lesson__module__course=course, is_quiz_passed=True
    ).count()

    if passed_quizzes < lessons_with_quizzes:
         return Response({"detail": f"Incomplete quizzes. ({passed_quizzes}/{lessons_with_quizzes})"}, status=403)
        
    # Mint Certificate
    cert_obj, created = Certificate.objects.get_or_create(
        user=user,
        course=course
    )

    # QR Code Generation
    verify_url = f"http://localhost:5173/verify/{cert_obj.certificate_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    qr_code_image = ImageReader(qr_buffer)

    # PDF Drawing
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)

    # Borders
    p.setStrokeColorRGB(0.1, 0.2, 0.5)
    p.setLineWidth(12)
    p.rect(30, 30, width-60, height-60)

    p.setStrokeColorRGB(0.8, 0.7, 0.2)
    p.setLineWidth(3)
    p.rect(45, 45, width-90, height-90)

    # Content
    center_x = width / 2.0
    p.setFont("Helvetica-Bold", 36)
    p.setFillColor(colors.black)
    p.drawCentredString(center_x, height - 160, "CERTIFICATE OF COMPLETION")

    p.setFont("Helvetica", 16)
    p.drawCentredString(center_x, height - 210, "This is to certify that")

    # Student Name Logic
    full_name = f"{user.first_name} {user.last_name}".strip()
    student_name = full_name.upper() if full_name else user.username.upper()
    p.setFont("Times-BoldItalic", 40)
    p.drawCentredString(center_x, height - 270, student_name)

    p.setFont("Helvetica", 16)
    p.drawCentredString(center_x, height - 320, "has successfully completed the online course")

    p.setFont("Times-Bold", 28)
    p.drawCentredString(center_x, height - 370, course.title)

    # Footer
    footer_y = 160
    p.setFont("Helvetica", 14)
    date_str = cert_obj.issued_at.strftime("%B %d, %Y") 
    p.drawString(100, footer_y, f"Issued: {date_str}")

    p.setLineWidth(2)
    p.line(width - 300, footer_y + 10, width - 100, footer_y + 10)
    p.setFont("Helvetica-Oblique", 14)
    p.drawString(width - 280, footer_y - 10, "Lead Instructor, Cognito")

    # QR Code Drawing
    qr_x = width - 160
    qr_y = 40
    qr_size = 80
    p.drawImage(qr_code_image, qr_x, qr_y, width=qr_size, height=qr_size)
    p.linkURL(verify_url, (qr_x, qr_y, qr_x + qr_size, qr_y + qr_size), relative=1)
    
    p.setFont("Helvetica", 6)
    p.setFillColor(colors.black)
    uuid_str = str(cert_obj.certificate_id)
    center_qr_x = qr_x + (qr_size / 2)
    p.drawCentredString(center_qr_x, qr_y - 10, f"ID: {uuid_str}")

    p.showPage()
    p.save()
    buffer.seek(0)
    filename = f"Cognito_Certificate_{course.title.replace(' ', '_')}.pdf"
    return FileResponse(buffer, as_attachment=True, filename=filename)


class CertificateVerifyView(generics.RetrieveAPIView):
    """
    Public Endpoint: Allows anyone with the UUID to verify a certificate.
    """
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.AllowAny] 
    lookup_field = 'certificate_id' 


# --- HYBRID SEARCH ---

def search_content(request):
    """
    Unified Hybrid Search.
    Layer 1 (RAM): Queries Trie for Courses + Lessons instantly.
    Layer 2 (AI): Fallback to Llama 3 -> Queries DB for Courses + Lessons.
    """
    query = request.GET.get('q', '').strip()
    if not query: return JsonResponse([], safe=False)

    results = []
    
    # --- LAYER 1: TRIE (Fast RAM Search) ---
    try:
        trie = apps.get_app_config('courses').trie
        if trie:
            trie_results = trie.search(query)
            if trie_results:
                for r in trie_results:
                    r_copy = r.copy() 
                    r_copy['source'] = 'trie_fast' 
                    results.append(r_copy)
                return JsonResponse(results[:10], safe=False)
    except Exception as e:
        print(f"⚠️ Trie Error: {e}")

    # --- LAYER 2: AI FALLBACK (Llama 3) ---
    print(f"⚠️ Trie failed for '{query}'. Engaging Llama 3...")
    keywords = get_search_keywords(query)
    
    if not keywords:
        return JsonResponse([], safe=False)

    q_lookup = Q()
    for k in keywords:
        q_lookup |= Q(title__icontains=k) | Q(description__icontains=k)

    ai_courses = Course.objects.filter(q_lookup).distinct()[:3]
    for c in ai_courses:
        results.append({
            "id": c.id,
            "title": c.title,
            "type": "course",
            "course_title": None,
            "url": f"/courses/{c.id}",
            "source": "ai_semantic",
            "description": c.description
        })

    if len(results) < 5:
        q_lesson = Q()
        for k in keywords:
            q_lesson |= Q(title__icontains=k)
            
        ai_lessons = Lesson.objects.filter(q_lesson).select_related('module__course')[:5]
        for l in ai_lessons:
            results.append({
                "id": l.id,
                "title": l.title,
                "type": "lesson",
                "course_title": f"AI Match in {l.module.course.title}",
                "url": f"/courses/{l.module.course.id}",
                "source": "ai_semantic",
                "description": None
            })

    return JsonResponse(results[:10], safe=False)


# --- Study Plan Scheduler (Algorithmic) ---

class GenerateStudyPlanView(APIView):
    """
    Generates a personalized study schedule using a Backtracking/Greedy algorithm.
    """
    def post(self, request, course_id):
        course = get_object_or_404(Course, id=course_id)
        user = request.user
        
        target_date_str = request.data.get('target_date')
        availability = request.data.get('availability') 
        
        if not target_date_str or not availability:
            return Response({"error": "Missing target_date or availability"}, status=400)

        lessons = []
        for module in course.modules.all():
            lessons.extend(module.lessons.all())
            
        if not lessons:
             return Response({"error": "Course has no lessons to schedule."}, status=400)

        start_date = timezone.now().date()
        target_date = datetime.datetime.strptime(target_date_str, "%Y-%m-%d").date()
        
        schedule = generate_study_schedule(start_date, target_date, availability, lessons)
        
        plan, created = StudyPlan.objects.update_or_create(
            user=user,
            course=course,
            defaults={
                'target_date': target_date,
                'weekly_availability': availability,
                'generated_schedule': schedule
            }
        )
        
        return Response(plan.generated_schedule, status=status.HTTP_200_OK)
    
# --- Ask AI ---

class AIThrottle(UserRateThrottle):
    """Custom throttle for expensive AI endpoints."""
    scope = 'ai'

class AskAIView(APIView):
    """
    The Real AI Tutor Endpoint.
    1. Builds Context (DAG + History)
    2. Sends to Llama 3
    3. Returns real answer
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIThrottle]

    def post(self, request, course_id):
        user_question = request.data.get('question')
        if not user_question:
            return Response({"error": "Question is required"}, status=400)

        system_prompt = get_rag_context(course_id, request.user)
        print(f"\n--- 🧠 CONTEXT FOR LLAMA 3 ---\n{system_prompt}\n-------------------------------\n")
        
        ai_answer = get_chat_response(system_prompt, user_question)

        return Response({
            "answer": ai_answer,
            "context_debug": system_prompt 
        })
    
# --- User Profile Settings ---

class UserProfileView(APIView):
    """
    Handles fetching and updating user profile settings.
    Includes rate-limiting for name changes (Security).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        data = request.data

        # --- NAME CHANGE LIMIT LOGIC ---
        new_first = data.get('first_name')
        new_last = data.get('last_name')

        if new_first or new_last:
            # 1. Check if name is actually different
            if new_first == user.first_name and new_last == user.last_name:
                pass # No change, skip logic
            else:
                # 2. Filter history for the last 365 days
                one_year_ago = timezone.now() - timedelta(days=365)
                recent_changes = [
                    ts for ts in profile.name_change_history 
                    if datetime.datetime.fromisoformat(ts) > one_year_ago
                ]
                
                # 3. Check Limit (Max 2 per year)
                if len(recent_changes) >= 2:
                    return Response(
                        {"error": "Limit reached: You can only change your name 2 times per year."}, 
                        status=status.HTTP_403_FORBIDDEN
                    )

                # 4. Apply Changes
                if new_first: user.first_name = new_first
                if new_last: user.last_name = new_last
                user.save()

                # 5. Log the change
                profile.name_change_history.append(timezone.now().isoformat())

        # Update Bio
        if 'bio' in data:
            profile.bio = data['bio']
        
        profile.save()
        return Response({"message": "Profile updated successfully!"})
    

# --- ENROLLMENT LOGIC (With Async Email) ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_course(request, course_id):
    """
    Enrolls a user in a course and triggers an async email task.
    """
    course = get_object_or_404(Course, id=course_id)
    user = request.user

    # 1. Check if already enrolled
    if Enrollment.objects.filter(student=user, course=course).exists():
        return Response({"message": "Already enrolled"}, status=200)

    # 2. Create Enrollment
    Enrollment.objects.create(student=user, course=course)

    # 3. TRIGGER ASYNC TASK (Celery)
    # .delay() sends it to Redis. The server returns immediately (Fast UI).
    send_enrollment_email.delay(user.email, course.title)

    return Response({
        "message": f"Successfully enrolled in {course.title}",
        "enrolled": True
    }, status=201)


# --- Code Execution Proxy ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def execute_code(request):
    """
    Proxy code execution through backend for logging/security.
    Prevents direct frontend calls to Piston, enabling rate limiting and abuse protection.
    """
    code = request.data.get('code', '')
    language = request.data.get('language', 'python')
    
    # Map language to appropriate file extension
    file_extensions = {
        'python': 'main.py',
        'javascript': 'main.js',
        'java': 'Main.java',
        'c': 'main.c',
        'cpp': 'main.cpp',
    }
    filename = file_extensions.get(language, 'main.py')
    
    try:
        response = requests.post(
            'https://emkc.org/api/v2/piston/execute',
            json={
                'language': language,
                'version': '3.10.0',
                'files': [{'name': filename, 'content': code}]
            },
            timeout=30
        )
        return Response(response.json())
    except requests.Timeout:
        return Response({'error': 'Execution timed out'}, status=408)
    except requests.RequestException as e:
        return Response({'error': f'Execution failed: {str(e)}'}, status=500)