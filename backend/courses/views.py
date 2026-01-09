import io
from datetime import date
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import FileResponse

# --- REPORTLAB IMPORTS (For PDF Generation) ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Import models and serializers
from .models import Course, Lesson, UserProgress, Question, Choice
from .serializers import CourseSerializer, QuestionSerializer

# --- Course Views ---
class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

# --- Lesson Completion Logic ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_lesson_completion(request, lesson_id):
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
    Fetch all questions for a specific lesson.
    """
    lesson = get_object_or_404(Lesson, id=lesson_id)
    questions = lesson.questions.all()
    # Serialize the questions (and choices) to send to Frontend
    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, lesson_id):
    """
    Grade the quiz on the server.
    Expected Payload: { "question_id": "choice_id", ... }
    """
    lesson = get_object_or_404(Lesson, id=lesson_id)
    questions = lesson.questions.all()
    
    total_questions = questions.count()
    correct_count = 0
    user_answers = request.data 
    
    # Grading Loop
    for question in questions:
        # We convert ID to string because JSON keys are always strings
        question_id_str = str(question.id)
        
        # Did the user answer this question?
        if question_id_str in user_answers:
            selected_choice_id = user_answers[question_id_str]
            
            # Check the DB: Is this choice actually correct for this question?
            is_correct = Choice.objects.filter(
                id=selected_choice_id, 
                question=question, 
                is_correct=True
            ).exists()
            
            if is_correct:
                correct_count += 1

    # Calculate Score
    if total_questions > 0:
        score = (correct_count / total_questions) * 100
    else:
        score = 0
    
    return Response({
        "total": total_questions,
        "correct": correct_count,
        "score": round(score, 2),
        "passed": score >= 70 
    })

# ---  Certificate Generator ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_certificate(request, course_id):
    """
    Generates a PDF certificate ONLY if the user has completed all lessons.
    """
    course = get_object_or_404(Course, id=course_id)
    
    # --- 🔒 SECURITY GATEKEEPER ---
    
    # 1. Count TOTAL lessons in this course
    # (We trace the relationship: Lesson -> Module -> Course)
    total_lessons = Lesson.objects.filter(module__course=course).count()
    
    # 2. Count COMPLETED lessons for this user
    # (We trace: UserProgress -> Lesson -> Module -> Course)
    completed_lessons = UserProgress.objects.filter(
        user=request.user,             # The logged-in student
        lesson__module__course=course, # Only lessons in THIS course
        is_completed=True              # Only ones marked "True"
    ).count()

    # 3. The Check
    # If completed is less than total, BLOCK the download.
    if completed_lessons < total_lessons:
        return Response(
            {
                "detail": "Course incomplete.",
                "completed": completed_lessons,
                "total": total_lessons,
                "message": f"You have completed {completed_lessons}/{total_lessons} lessons. Finish all lessons to unlock your certificate."
            }, 
            status=403 # 403 Forbidden
        )
        
    # --- 🏆 PDF GENERATION ---
    # If code reaches here, the user has passed the check.

    # 1. Create a memory buffer for the PDF
    buffer = io.BytesIO()

    # 2. Create the PDF Canvas
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter # Standard US Letter size

    # --- DRAWING THE CERTIFICATE ---
    
    # Title
    p.setFont("Helvetica-Bold", 30)
    p.drawCentredString(width / 2.0, height - 200, "Certificate of Completion")

    # Body Text
    p.setFont("Helvetica", 18)
    p.drawCentredString(width / 2.0, height - 280, "This certifies that")

    # Student Name (Dynamic)
    p.setFont("Helvetica-Bold", 24)
    student_name = request.user.username.upper()
    p.drawCentredString(width / 2.0, height - 320, student_name)

    # Context
    p.setFont("Helvetica", 18)
    p.drawCentredString(width / 2.0, height - 370, "has successfully completed the course")

    # Course Title (Dynamic)
    p.setFont("Helvetica-Bold", 22)
    p.drawCentredString(width / 2.0, height - 410, course.title)

    # Date
    p.setFont("Helvetica", 14)
    p.drawString(100, 150, f"Date: {date.today()}")

    # Signature Line
    p.line(400, 150, 550, 150)
    p.drawString(400, 130, "Instructor Signature")

    # 3. Finalize and Save
    p.showPage()
    p.save()

    # 4. Return the file
    buffer.seek(0)
    filename = f"Certificate_{course.title.replace(' ', '_')}.pdf"
    return FileResponse(buffer, as_attachment=True, filename=filename)