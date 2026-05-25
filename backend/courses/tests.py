"""
Cognito LMS — Comprehensive Unit Tests
=======================================
Covers: Models, Utilities (Trie, Scheduler), API Endpoints, Serializers
Run:    python manage.py test courses -v 2
"""

import uuid
import datetime
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from users.models import User
from courses.models import (
    Course, Module, Lesson, UserProgress,
    Question, Choice, Certificate, Enrollment,
    StudyPlan, UserProfile
)
from courses.utils import CourseTrie, generate_study_schedule


# ============================================================
#  HELPER: Shared Setup Mixin
# ============================================================

class BaseTestMixin:
    """Creates a standard student, instructor, course, module, and lesson."""

    def setUp(self):
        self.student = User.objects.create_user(
            username='student1', email='student@test.com',
            password='testpass123', role=User.Role.STUDENT
        )
        self.instructor = User.objects.create_user(
            username='instructor1', email='instructor@test.com',
            password='testpass123', role=User.Role.INSTRUCTOR
        )
        self.course = Course.objects.create(
            title='Data Structures', description='Learn DS',
            instructor=self.instructor
        )
        self.module = Module.objects.create(
            course=self.course, title='Arrays', order=1
        )
        self.lesson = Lesson.objects.create(
            module=self.module, title='Intro to Arrays',
            content='https://youtube.com/watch?v=test123',
            order=1, duration_minutes=30
        )
        self.client = APIClient()


# ============================================================
#  1. MODEL TESTS
# ============================================================

class CourseModelTest(BaseTestMixin, TestCase):
    """Tests for the Course model's DAG cycle detection (DFS)."""

    def test_self_reference_detected(self):
        """Adding a course as its own prerequisite should be detected as a cycle."""
        self.assertTrue(self.course.creates_cycle(self.course))

    def test_direct_cycle_detected(self):
        """A → B → A cycle should be detected."""
        course_b = Course.objects.create(
            title='Algorithms', description='Learn Algo',
            instructor=self.instructor
        )
        course_b.prerequisites.add(self.course)  # B depends on A
        # Now check if A depending on B creates a cycle
        self.assertTrue(self.course.creates_cycle(course_b))

    def test_deep_chain_cycle_detected(self):
        """A → B → C → A deep cycle should be detected."""
        course_b = Course.objects.create(title='B', description='B', instructor=self.instructor)
        course_c = Course.objects.create(title='C', description='C', instructor=self.instructor)
        course_b.prerequisites.add(self.course)   # B → A
        course_c.prerequisites.add(course_b)       # C → B
        # A → C would create A → C → B → A
        self.assertTrue(self.course.creates_cycle(course_c))

    def test_no_false_positive(self):
        """Valid dependency (no cycle) should return False."""
        course_b = Course.objects.create(title='B', description='B', instructor=self.instructor)
        # A depending on B with no reverse dependency is fine
        self.assertFalse(self.course.creates_cycle(course_b))



class UserModelTest(TestCase):
    """Tests for the custom User model role enforcement."""

    def test_default_role_is_student(self):
        """New users should default to STUDENT role."""
        user = User.objects.create_user(
            username='newuser', email='new@test.com', password='pass123'
        )
        self.assertEqual(user.role, User.Role.STUDENT)

    def test_superuser_forced_to_admin(self):
        """Superusers should automatically be assigned ADMIN role."""
        admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='admin123'
        )
        self.assertEqual(admin.role, User.Role.ADMIN)


# ============================================================
#  2. UTILITY TESTS
# ============================================================

class TrieTest(TestCase):
    """Tests for the in-memory search Trie."""

    def setUp(self):
        self.trie = CourseTrie()
        self.trie.insert('Python Basics', {'id': 1, 'title': 'Python Basics', 'type': 'course'})
        self.trie.insert('Python Advanced', {'id': 2, 'title': 'Python Advanced', 'type': 'course'})
        self.trie.insert('JavaScript', {'id': 3, 'title': 'JavaScript', 'type': 'course'})

    def test_exact_match(self):
        """Full keyword search returns matching items."""
        results = self.trie.search('python basics')
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], 1)

    def test_prefix_search(self):
        """Prefix 'pyth' should match both Python courses."""
        results = self.trie.search('pyth')
        self.assertEqual(len(results), 2)

    def test_case_insensitive(self):
        """Search should be case-insensitive."""
        results = self.trie.search('PYTHON')
        self.assertEqual(len(results), 2)

    def test_no_match(self):
        """Non-existent prefix returns empty list."""
        results = self.trie.search('rust')
        self.assertEqual(len(results), 0)

    def test_empty_query(self):
        """Empty query returns ALL items."""
        results = self.trie.search('')
        self.assertEqual(len(results), 3)


class StudySchedulerTest(TestCase):
    """Tests for the Greedy First-Fit study schedule algorithm."""

    def _make_lesson(self, title, duration):
        """Helper: Creates a mock lesson object."""
        lesson = MagicMock()
        lesson.title = title
        lesson.duration_minutes = duration
        lesson.id = hash(title) % 10000
        return lesson

    def test_basic_allocation(self):
        """Lessons fit into available days."""
        lessons = [self._make_lesson('L1', 30), self._make_lesson('L2', 30)]
        availability = {'Mon': 60, 'Tue': 60, 'Wed': 60, 'Thu': 60, 'Fri': 60, 'Sat': 0, 'Sun': 0}
        
        start = datetime.date(2025, 1, 6)  # Monday
        target = datetime.date(2025, 1, 12)
        
        schedule = generate_study_schedule(start, target, availability, lessons)
        
        # Both lessons should fit in day 1 (Mon has 60 min)
        self.assertEqual(len(schedule), 1)
        self.assertEqual(len(schedule[0]['lessons']), 2)

    def test_no_availability_skips_days(self):
        """Days with 0 availability should be skipped."""
        lessons = [self._make_lesson('L1', 30)]
        availability = {'Mon': 0, 'Tue': 0, 'Wed': 60}
        
        start = datetime.date(2025, 1, 6)  # Monday
        target = datetime.date(2025, 1, 12)
        
        schedule = generate_study_schedule(start, target, availability, lessons)
        
        self.assertEqual(len(schedule), 1)
        self.assertEqual(schedule[0]['day'], 'Wed')

    def test_lesson_overflow_to_next_day(self):
        """Lesson that doesn't fit today moves to next available day."""
        lessons = [self._make_lesson('L1', 40), self._make_lesson('L2', 40)]
        availability = {'Mon': 50, 'Tue': 50, 'Wed': 50, 'Thu': 50, 'Fri': 50, 'Sat': 0, 'Sun': 0}
        
        start = datetime.date(2025, 1, 6)  # Monday
        target = datetime.date(2025, 1, 12)
        
        schedule = generate_study_schedule(start, target, availability, lessons)
        
        # Each lesson needs 40 min, but only 50 available — so 1 per day
        self.assertEqual(len(schedule), 2)

    def test_empty_lessons(self):
        """Empty lesson list produces empty schedule."""
        availability = {'Mon': 60}
        start = datetime.date(2025, 1, 6)
        target = datetime.date(2025, 1, 12)
        
        schedule = generate_study_schedule(start, target, availability, [])
        self.assertEqual(len(schedule), 0)


# ============================================================
#  3. API ENDPOINT TESTS
# ============================================================

class CourseAPITest(BaseTestMixin, TestCase):
    """Tests for course CRUD and enrollment API endpoints."""

    def test_list_courses_unauthenticated(self):
        """Course list should be accessible without authentication."""
        response = self.client.get('/api/courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_course_authenticated(self):
        """Authenticated users can create courses."""
        self.client.force_authenticate(user=self.instructor)
        response = self.client.post('/api/courses/', {
            'title': 'New Course',
            'description': 'A new course'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.count(), 2)

    def test_create_course_unauthenticated_rejected(self):
        """Unauthenticated users cannot create courses."""
        response = self.client.post('/api/courses/', {
            'title': 'Hacker Course', 'description': 'Should fail'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_course_detail_view(self):
        """Course detail returns full data with modules."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/courses/{self.course.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Data Structures')
        self.assertIn('modules', response.data)

    @patch('courses.tasks.send_enrollment_email.delay')
    def test_enrollment_flow(self, mock_email):
        """Student can enroll in a course, duplicate enrollment returns 200."""
        self.client.force_authenticate(user=self.student)
        
        # First enrollment → 201
        response = self.client.post(f'/api/courses/{self.course.id}/enroll/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Enrollment.objects.filter(
            student=self.student, course=self.course
        ).exists())
        
        # Duplicate enrollment → 200
        response = self.client.post(f'/api/courses/{self.course.id}/enroll/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class QuizAPITest(BaseTestMixin, TestCase):
    """Tests for quiz fetch and grading endpoints."""

    def setUp(self):
        super().setUp()
        self.question = Question.objects.create(
            lesson=self.lesson, text='What is an array?'
        )
        self.correct = Choice.objects.create(
            question=self.question, text='A collection of elements', is_correct=True
        )
        self.wrong = Choice.objects.create(
            question=self.question, text='A single value', is_correct=False
        )
        self.client.force_authenticate(user=self.student)

    def test_get_quiz(self):
        """GET quiz returns questions without correct answer flags."""
        response = self.client.get(f'/api/courses/lessons/{self.lesson.id}/quiz/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        # Verify is_correct is NOT exposed (security)
        self.assertNotIn('is_correct', response.data[0]['choices'][0])

    def test_submit_quiz_grading(self):
        """Quiz grading correctly calculates score."""
        # Submit correct answer
        response = self.client.post(
            f'/api/courses/lessons/{self.lesson.id}/quiz/submit/',
            {str(self.question.id): self.correct.id},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['score'], 100)
        self.assertTrue(response.data['passed'])

        # Submit wrong answer
        response = self.client.post(
            f'/api/courses/lessons/{self.lesson.id}/quiz/submit/',
            {str(self.question.id): self.wrong.id},
            format='json'
        )
        self.assertEqual(response.data['score'], 0)
        self.assertFalse(response.data['passed'])


class ProfileAPITest(BaseTestMixin, TestCase):
    """Tests for user profile endpoints."""

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.student)
        # Ensure profile exists
        UserProfile.objects.get_or_create(user=self.student)

    def test_get_profile(self):
        """GET profile returns username and stats."""
        response = self.client.get('/api/courses/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'student1')
        self.assertIn('stats', response.data)

    def test_update_profile(self):
        """PATCH profile updates first/last name."""
        response = self.client.patch(
            '/api/courses/profile/',
            {'first_name': 'John', 'last_name': 'Doe'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, 'John')


class CertificateVerifyTest(BaseTestMixin, TestCase):
    """Tests for the public certificate verification endpoint."""

    def setUp(self):
        super().setUp()
        self.cert = Certificate.objects.create(
            user=self.student, course=self.course
        )

    def test_verify_valid_certificate(self):
        """Valid UUID returns certificate details."""
        response = self.client.get(
            f'/api/courses/certificate/verify/{self.cert.certificate_id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student'], 'student1')
        self.assertEqual(response.data['course'], 'Data Structures')

    def test_verify_invalid_certificate(self):
        """Invalid UUID returns 404."""
        fake_uuid = uuid.uuid4()
        response = self.client.get(
            f'/api/courses/certificate/verify/{fake_uuid}/'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DashboardAPITest(BaseTestMixin, TestCase):
    """Tests for the student dashboard stats endpoint."""

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.student)
        Enrollment.objects.create(student=self.student, course=self.course)

    def test_dashboard_returns_enrolled_courses(self):
        """Dashboard stats include enrolled courses with progress."""
        response = self.client.get('/api/courses/dashboard/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['enrolled_courses']), 1)
        self.assertEqual(response.data['enrolled_courses'][0]['title'], 'Data Structures')
        self.assertEqual(response.data['enrolled_courses'][0]['progress'], 0)

    def test_dashboard_progress_updates(self):
        """Progress updates when a lesson is completed."""
        UserProgress.objects.create(
            user=self.student, lesson=self.lesson, is_completed=True
        )
        response = self.client.get('/api/courses/dashboard/stats/')
        self.assertEqual(response.data['enrolled_courses'][0]['progress'], 100)


class LessonCompletionTest(BaseTestMixin, TestCase):
    """Tests for the lesson completion toggle endpoint."""

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.student)

    def test_toggle_lesson_completion(self):
        """Toggle creates progress and flips is_completed."""
        # Mark complete
        response = self.client.post(f'/api/courses/lessons/{self.lesson.id}/complete/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_completed'])
        
        # Toggle back
        response = self.client.post(f'/api/courses/lessons/{self.lesson.id}/complete/')
        self.assertFalse(response.data['is_completed'])
