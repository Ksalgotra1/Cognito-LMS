from rest_framework import serializers
from .models import Course, Module, Lesson

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'order']

class ModuleSerializer(serializers.ModelSerializer):
    # Nest lessons inside modules so we get the full tree
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'order', 'lessons']

class CourseSerializer(serializers.ModelSerializer):
    # Nest modules inside courses
    modules = ModuleSerializer(many=True, read_only=True)
    # Read the instructor's username, not just their ID number
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'instructor_name', 'thumbnail_url', 'modules', 'created_at']