from rest_framework import serializers

from .models import Certificate, Choice, Course, Enrollment, Lesson, Module, Question, UserProfile, UserProgress


class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    # Count questions so frontend knows if a quiz exists
    # Relies on related_name='questions' in the Question model
    questions_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Lesson
        fields = ["id", "title", "content", "order", "is_completed", "duration_minutes", "questions_count"]

    def get_is_completed(self, obj):
        # Optimization: Check if we have the pre-fetched list in context
        # This prevents running a database query for every single lesson
        completed_ids = self.context.get("completed_lesson_ids")
        if completed_ids is not None:
            return obj.id in completed_ids

        # Fallback: The standard way (1 DB Hit per lesson)
        # This runs only if the View does not provide the context
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return UserProgress.objects.filter(user=request.user, lesson=obj, is_completed=True).exists()
        return False


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ["id", "title", "order", "lessons"]


class CourseSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    instructor_name = serializers.CharField(source="instructor.username", read_only=True)
    progress = serializers.SerializerMethodField()
    prerequisites = serializers.SerializerMethodField()

    # Field to fetch the full dependency tree (Parents + Grandparents)
    recursive_prerequisites = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "instructor_name",
            "thumbnail_url",
            "modules",
            "created_at",
            "progress",
            "prerequisites",
            "recursive_prerequisites",
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
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0

        total_lessons = Lesson.objects.filter(module__course=obj).count()
        if total_lessons == 0:
            return 0

        completed_lessons = UserProgress.objects.filter(
            user=request.user, lesson__module__course=obj, is_completed=True
        ).count()

        return round((completed_lessons / total_lessons) * 100)

    def get_prerequisites(self, obj):
        return [{"id": p.id, "title": p.title} for p in obj.prerequisites.all()]

    def get_recursive_prerequisites(self, obj):
        """Returns nested prerequisite tree with per-node completion status."""
        completion_map = self.context.get("prereq_completion_map", {})

        def node_status(course_id, own_completed, prereqs_all_completed):
            """Derive status from precomputed booleans."""
            if own_completed:
                return "completed"
            if prereqs_all_completed:
                return "available"  # prerequisites done, ready to start
            return "locked"  # blocked by an incomplete prerequisite

        tree = []
        for parent in obj.prerequisites.all():
            parent_completed = completion_map.get(parent.id, False)

            grandparents = []
            all_gps_done = True
            for gp in parent.prerequisites.all():
                gp_completed = completion_map.get(gp.id, False)
                if not gp_completed:
                    all_gps_done = False
                grandparents.append(
                    {
                        "id": gp.id,
                        "title": gp.title,
                        "status": "completed" if gp_completed else "available",
                        "prerequisites": [],
                    }
                )

            tree.append(
                {
                    "id": parent.id,
                    "title": parent.title,
                    "status": node_status(parent.id, parent_completed, all_gps_done),
                    "prerequisites": grandparents,
                }
            )
        return tree


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        # Security: We do not include 'is_correct' here to prevent cheating
        fields = ["id", "text"]


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "text", "choices"]


class CertificateSerializer(serializers.ModelSerializer):
    student = serializers.CharField(source="user.username", read_only=True)
    course = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Certificate
        fields = ["certificate_id", "student", "course", "issued_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")

    # Analytics for the profile card
    stats = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ["username", "email", "first_name", "last_name", "bio", "avatar_url", "stats"]

    def get_stats(self, obj):
        user = obj.user
        return {
            "courses_enrolled": Enrollment.objects.filter(student=user).count(),
            "certificates_earned": Certificate.objects.filter(user=user).count(),
            "total_lessons_completed": UserProgress.objects.filter(user=user, is_completed=True).count(),
        }
