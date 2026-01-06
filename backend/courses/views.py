from rest_framework import generics, permissions
from .models import Course
from .serializers import CourseSerializer
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Lesson, UserProgress

class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    # Allow anyone to read, but only logged-in users to create
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # Automatically set the 'instructor' to the currently logged-in user
        serializer.save(instructor=self.request.user)

class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_lesson_completion(request, lesson_id):
    lesson = get_object_or_404(Lesson, id=lesson_id)
    
    # Get or create the progress record
    progress, created = UserProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson
    )
    
    # Toggle the status
    progress.is_completed = not progress.is_completed
    progress.save()
    
    return Response({
        "lesson_id": lesson.id,
        "is_completed": progress.is_completed
    })