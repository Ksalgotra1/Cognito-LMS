from django.urls import path
from .views import (
    CourseListCreateView, 
    CourseDetailView, 
    toggle_lesson_completion, 
    get_quiz,      
    submit_quiz,
    generate_certificate    
)

urlpatterns = [
    # Course Routes
    path('', CourseListCreateView.as_view(), name='course-list-create'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    
    # Lesson Completion Route
    path('lessons/<int:lesson_id>/complete/', toggle_lesson_completion, name='toggle-completion'),

    # Quiz Routes ---
    # GET: Fetch questions
    path('lessons/<int:lesson_id>/quiz/', get_quiz, name='get-quiz'),
    # POST: Submit answers for grading
    path('lessons/<int:lesson_id>/quiz/submit/', submit_quiz, name='submit-quiz'),

    # --- Certificate Route ---
    # This generates the PDF for a specific course
    path('<int:course_id>/certificate/', generate_certificate, name='get-certificate'),
]