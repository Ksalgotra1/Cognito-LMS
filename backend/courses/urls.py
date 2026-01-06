from django.urls import path
from .views import CourseListCreateView, CourseDetailView
from .views import toggle_lesson_completion

urlpatterns = [
    path('', CourseListCreateView.as_view(), name='course-list-create'),
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
    path('lessons/<int:lesson_id>/complete/', toggle_lesson_completion, name='toggle-completion'),
]