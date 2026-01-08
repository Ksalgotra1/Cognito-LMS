from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

# Import all your models and serializers
from .models import Course, Lesson, UserProgress, Question, Choice
from .serializers import CourseSerializer, QuestionSerializer

# --- Existing Course Views ---
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
    user_answers = request.data # Dictionary from Frontend
    
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
        "passed": score >= 70 # Pass if 70% or higher
    })