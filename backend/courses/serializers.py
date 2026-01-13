from rest_framework import serializers
from .models import Course, Module, Lesson, UserProgress, Question, Choice, Certificate  


class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField() 

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'order', 'is_completed']

    # Logic: Check if the current user has finished this lesson
    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserProgress.objects.filter(user=request.user, lesson=obj, is_completed=True).exists()
        return False

class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'order', 'lessons']

class CourseSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)
    progress = serializers.SerializerMethodField() 

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'instructor_name', 'thumbnail_url', 'modules', 'created_at', 'progress']

    # Logic: Calculate (Completed / Total) * 100
    def get_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
            
        # 1. Count Total Lessons in this Course
        total_lessons = Lesson.objects.filter(module__course=obj).count()
        
        if total_lessons == 0:
            return 0
            
        # 2. Count Completed Lessons for THIS User in THIS Course
        completed_lessons = UserProgress.objects.filter(
            user=request.user, 
            lesson__module__course=obj, 
            is_completed=True
        ).count()
        
        # 3. Calculate Percentage
        return round((completed_lessons / total_lessons) * 100)
    
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        # 🚨 SECURITY ALERT: We DO NOT include 'is_correct' here.
        # If we did, students could see the answers in the JSON!
        fields = ['id', 'text']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'choices']

class CertificateSerializer(serializers.ModelSerializer):
    # Change 'student_name' -> 'student' to match React
    student = serializers.CharField(source='user.username', read_only=True)
    
    # Change 'course_title' -> 'course' to match React
    course = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Certificate
        # Update the fields list to match the new names
        fields = ['certificate_id', 'student', 'course', 'issued_at']