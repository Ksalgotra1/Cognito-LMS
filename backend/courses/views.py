import io
import qrcode  # <--- For QR Code generation
from datetime import date
from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.apps import apps
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

# --- REPORTLAB IMPORTS (For PDF Generation) ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader  # <--- To read image from memory

# --- APP IMPORTS ---
from .models import Course, Lesson, UserProgress, Question, Choice, Certificate
from .serializers import CourseSerializer, QuestionSerializer, CertificateSerializer

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
    Grade the quiz on the server and save progress if passed.
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
    Generates a Professional PDF certificate.
    Features:
    - Unique UUID Verification
    - QR Code (Scannable)
    - Clickable Link (Digital Verification)
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
    # 💾 MINTING THE CERTIFICATE (DB)
    # ==========================================
    
    # Create or Get the permanent record (UUID)
    cert_obj, created = Certificate.objects.get_or_create(
        user=user,
        course=course
    )

    # ==========================================
    # 📱 QR CODE GENERATION
    # ==========================================
    
    # 1. The URL (Currently points to API for testing)
    # In production, you will change this to: https://your-site.com/verify/UUID
    verify_url = f"{settings.SITE_URL}/api/courses/certificate/verify/{cert_obj.certificate_id}/"
    
    # 2. Create QR Object
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    
    # 3. Generate Image to Memory
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    # 4. Convert to ReportLab ImageReader
    qr_code_image = ImageReader(qr_buffer)

    # ==========================================
    # 🏆 PRO PDF DRAWING
    # ==========================================

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)

    # --- 1. DRAW BORDERS ---
    p.setStrokeColorRGB(0.1, 0.2, 0.5) # Dark academic blue
    p.setLineWidth(12)
    p.rect(30, 30, width-60, height-60) # Outer Border

    p.setStrokeColorRGB(0.8, 0.7, 0.2) # Gold color
    p.setLineWidth(3)
    p.rect(45, 45, width-90, height-90) # Inner Border

    p.setFillColor(colors.black)
    p.setStrokeColor(colors.black)

    # --- 2. BRANDING ---
    p.setFont("Helvetica-BoldOblique", 18)
    p.setFillColorRGB(0.1, 0.2, 0.5)
    p.drawRightString(width - 70, height - 85, "Cognito Academy")

    # --- 3. MAIN CONTENT ---
    center_x = width / 2.0

    p.setFont("Helvetica-Bold", 36)
    p.setFillColor(colors.black)
    p.drawCentredString(center_x, height - 160, "CERTIFICATE OF COMPLETION")

    p.setFont("Helvetica", 16)
    p.drawCentredString(center_x, height - 210, "This is to certify that")

    # Student Name
    student_name = user.username.upper()
    p.setFont("Times-BoldItalic", 40)
    p.drawCentredString(center_x, height - 270, student_name)

    p.setFont("Helvetica", 16)
    p.drawCentredString(center_x, height - 320, "has successfully completed the online course")

    # Course Title
    p.setFont("Times-Bold", 28)
    p.drawCentredString(center_x, height - 370, course.title)

    # --- 4. FOOTER & QR CODE ---
    footer_y = 160

    # Date
    p.setFont("Helvetica", 14)
    date_str = cert_obj.issued_at.strftime("%B %d, %Y") 
    p.drawString(100, footer_y, f"Issued: {date_str}")

    # Signature
    p.setLineWidth(2)
    p.line(width - 300, footer_y + 10, width - 100, footer_y + 10)
    p.setFont("Helvetica-Oblique", 14)
    p.drawString(width - 280, footer_y - 10, "Lead Instructor, Cognito")

    # --- DRAW QR CODE (Bottom Right) ---
    
    # Coordinates and Size
    qr_x = width - 160
    qr_y = 40
    qr_size = 80

    # 1. Draw the Image
    p.drawImage(qr_code_image, qr_x, qr_y, width=qr_size, height=qr_size)
    
    # 2. Make it CLICKABLE 
    # Arguments: URL, (x1, y1, x2, y2), relative=1
    p.linkURL(verify_url, (qr_x, qr_y, qr_x + qr_size, qr_y + qr_size), relative=1)
    
    # 3. Draw FULL UUID Text below QR
    p.setFont("Helvetica", 6) # Small size to fit 36 chars
    p.setFillColor(colors.black) 
    
    uuid_str = str(cert_obj.certificate_id)
    
    # Center text relative to QR code
    center_qr_x = qr_x + (qr_size / 2)
    p.drawCentredString(center_qr_x, qr_y - 10, f"ID: {uuid_str}")

    # Finalize
    p.showPage()
    p.save()

    buffer.seek(0)
    filename = f"Cognito_Certificate_{course.title.replace(' ', '_')}.pdf"
    return FileResponse(buffer, as_attachment=True, filename=filename)

class CertificateVerifyView(generics.RetrieveAPIView):
    """
    Public Endpoint: Allows anyone with the UUID to verify a certificate.
    No Login Required.
    """
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.AllowAny] # <--- Public Access
    lookup_field = 'certificate_id' # <--- Lookup by UUID

def search_content(request):
    """
    High-Performance Search Endpoint.
    
    Instead of hitting the database with a slow SQL LIKE query, 
    this view queries the In-Memory Trie stored in the AppConfig.
    Response time is typically < 5ms.
    """
    query = request.GET.get('q', '')
    
    # Return empty list for empty queries
    if not query:
        return JsonResponse([], safe=False)

    try:
        # Access the global Trie instance initialized in apps.py
        trie = apps.get_app_config('courses').trie
        
        # Safety check: If server didn't initialize correctly
        if not trie:
            return JsonResponse({"error": "Search engine not ready"}, status=503)

        # Perform the O(k) search
        results = trie.search(query)
        
        # Limit to top 10 results to keep the payload light
        return JsonResponse(results[:10], safe=False)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)