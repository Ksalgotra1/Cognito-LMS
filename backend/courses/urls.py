from django.urls import path
from .views import (
    CourseListCreateView, 
    CourseDetailView, 
    toggle_lesson_completion, 
    get_quiz,      
    submit_quiz,
    generate_certificate,
    CertificateVerifyView,
    search_content,
    student_dashboard_stats,
    GenerateStudyPlanView,
    AskAIView,
    UserProfileView,
    enroll_course
)

urlpatterns = [
    # --- Dashboard Route (MUST BE AT THE TOP) ---
    path('dashboard/stats/', student_dashboard_stats, name='dashboard-stats'),
    
    # --- Course Routes ---
    path('', CourseListCreateView.as_view(), name='course-list-create'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    
    # --- Ask AI Route ---
    path('<int:course_id>/ask/', AskAIView.as_view(), name='ask-ai'),

    # --- Search Route (Layer 1: Trie) ---
    path('search/', search_content, name='search-content'),
    
    # --- Lesson Completion Route ---
    path('lessons/<int:lesson_id>/complete/', toggle_lesson_completion, name='toggle-completion'),

    # --- Quiz Routes ---
    path('lessons/<int:lesson_id>/quiz/', get_quiz, name='get-quiz'),
    path('lessons/<int:lesson_id>/quiz/submit/', submit_quiz, name='submit-quiz'),

    # --- Certificate Routes ---
    path('<int:course_id>/certificate/', generate_certificate, name='get-certificate'),
    path('certificate/verify/<uuid:certificate_id>/', CertificateVerifyView.as_view(), name='certificate-verify'),

    # --- Study Scheduler Route (The New Algorithmic Feature) ---
    # POST request here triggers the Backtracking/Greedy algorithm
    path('<int:course_id>/generate-plan/', GenerateStudyPlanView.as_view(), name='generate-plan'),

    # --- Profile Page Route ---
    path('profile/', UserProfileView.as_view(), name='user-profile'),

    # --- Enrollment Route ---
    path('<int:course_id>/enroll/', enroll_course, name='enroll-course')
]