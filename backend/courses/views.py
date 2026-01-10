import io
from datetime import date
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# --- REPORTLAB IMPORTS (For PDF Generation) ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape # <--- Added landscape
from reportlab.lib import colors # <--- Added colors for borders

# --- APP IMPORTS ---
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
    
    # Determine Pass/Fail Status
    passed = score >= 70

    # --- SAVE PROGRESS TO DB ---
    # If they passed, we must record it so they can get their Certificate later.
    if passed:
        progress, created = UserProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        progress.is_quiz_passed = True
        progress.save()
    # --------------------------------
    
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
    Generates a Professional PDF certificate ONLY if all requirements are met.
    """
    course = get_object_or_404(Course, id=course_id)
    user = request.user
    
    # ==========================================
    # 🔒 SECURITY CHECKS (GATEKEEPER)
    # ==========================================
    
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
        
    # ==========================================
    # 🏆 PRO PDF GENERATION
    # ==========================================

    buffer = io.BytesIO()
    # Use LANDSCAPE orientation for a diploma feel
    p = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter) # width=792, height=612 points

    # --- 1. DRAW BORDERS ---
    # Outer thick blue border
    p.setStrokeColorRGB(0.1, 0.2, 0.5) # Dark academic blue
    p.setLineWidth(12)
    # rect(x, y, width, height) - giving 30px margin
    p.rect(30, 30, width-60, height-60)

    # Inner thinner gold border
    p.setStrokeColorRGB(0.8, 0.7, 0.2) # Gold color
    p.setLineWidth(3)
    # rect(x, y, width, height) - giving 45px margin
    p.rect(45, 45, width-90, height-90)

    # Reset colors for text
    p.setFillColor(colors.black)
    p.setStrokeColor(colors.black)

    # --- 2. BRANDING (Top Right) ---
    p.setFont("Helvetica-BoldOblique", 18)
    p.setFillColorRGB(0.1, 0.2, 0.5) # Match blue border
    # 'drawRightString' aligns text to the right of the coordinates
    p.drawRightString(width - 70, height - 85, "Cognito Academy")

    # --- 3. MAIN CONTENT (Centered) ---
    center_x = width / 2.0

    # Header
    p.setFont("Helvetica-Bold", 36)
    p.setFillColor(colors.black)
    p.drawCentredString(center_x, height - 160, "CERTIFICATE OF COMPLETION")

    # Sub-header
    p.setFont("Helvetica", 16)
    p.drawCentredString(center_x, height - 210, "This is to certify that")

    # STUDENT NAME (Big and Fancy)
    student_name = user.username.upper()
    # If you have first/last name configured:
    # student_name = f"{user.first_name} {user.last_name}".upper()
    
    p.setFont("Times-BoldItalic", 40) # Using Times for a fancier look
    p.drawCentredString(center_x, height - 270, student_name)

    # Context Text
    p.setFont("Helvetica", 16)
    p.drawCentredString(center_x, height - 320, "has successfully completed the online course")

    # COURSE TITLE (Big)
    p.setFont("Times-Bold", 28)
    p.drawCentredString(center_x, height - 370, course.title)

    # --- 4. FOOTER SECTION (Date & Signature) ---
    footer_y = 120

    # Date on left
    p.setFont("Helvetica", 14)
    date_str = date.today().strftime("%B %d, %Y") # e.g., January 10, 2026
    p.drawString(100, footer_y, f"Awarded: {date_str}")

    # Signature on right
    p.setLineWidth(2)
    p.line(width - 300, footer_y + 10, width - 100, footer_y + 10) # Signature Line
    p.setFont("Helvetica-Oblique", 14)
    p.drawString(width - 280, footer_y - 10, "Lead Instructor, Cognito")

    # Finalize
    p.showPage()
    p.save()

    buffer.seek(0)
    filename = f"Cognito_Certificate_{course.title.replace(' ', '_')}.pdf"
    return FileResponse(buffer, as_attachment=True, filename=filename)