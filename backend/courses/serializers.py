from rest_framework import serializers
from .models import Course, Module, Lesson, UserProgress, Question, Choice, Certificate  


class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField() 

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content', 'order', 'is_completed', 'duration_minutes']

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
    prerequisites = serializers.SerializerMethodField()
    
    # Field to fetch the full dependency tree (Parents + Grandparents)
    recursive_prerequisites = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'instructor_name', 'thumbnail_url', 
            'modules', 'created_at', 'progress', 'prerequisites',
            'recursive_prerequisites' 
        ]

    def validate_prerequisites(self, value):
        """
        Check that no prerequisite creates a cycle.
        """
        if self.instance:
            for candidate in value:
                if self.instance.creates_cycle(candidate):
                    raise serializers.ValidationError(
                        f"Circular dependency detected! '{candidate.title}' depends on '{self.instance.title}'."
                    )
        return value

    def get_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        total_lessons = Lesson.objects.filter(module__course=obj).count()
        if total_lessons == 0:
            return 0
            
        completed_lessons = UserProgress.objects.filter(
            user=request.user, 
            lesson__module__course=obj, 
            is_completed=True
        ).count()
        
        return round((completed_lessons / total_lessons) * 100)
    
    def get_prerequisites(self, obj):
        # Keeps existing functionality for simple lists
        return obj.prerequisites.values('id', 'title')

    # ✅ NEW: The Logic for the Graph
    def get_recursive_prerequisites(self, obj):
        """
        Returns a nested list:
        [
          { 
            id: 1, title: 'Parent', 
            prerequisites: [ { id: 2, title: 'Grandparent' } ] 
          }
        ]
        """
        tree = []
        for parent in obj.prerequisites.all():
            parent_data = {
                'id': parent.id,
                'title': parent.title,
                'prerequisites': [] 
            }
            # Fetch the Grandparents (Prerequisites of the Prerequisite)
            for grandparent in parent.prerequisites.all():
                parent_data['prerequisites'].append({
                    'id': grandparent.id,
                    'title': grandparent.title
                })
            tree.append(parent_data)
        return tree
    
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        #  SECURITY ALERT: We DO NOT include 'is_correct' here.
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