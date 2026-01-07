from rest_framework import serializers
from .models import Course, Module, Lesson, UserProgress  

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