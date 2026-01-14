from django.core.management.base import BaseCommand
from courses.models import Course
from courses.serializers import CourseSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Intentionally tries to create a Circular Dependency to test security."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("🧪 Starting Cycle Detection Test..."))

        # 1. Setup: Create a User and Two Courses
        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            self.stdout.write(self.style.ERROR("❌ No admin user found. Run 'python manage.py seed_courses' first."))
            return

        # Clean up old test data
        Course.objects.filter(title__startswith="Cycle Test").delete()

        course_a = Course.objects.create(title="Cycle Test A", description="A", instructor=admin)
        course_b = Course.objects.create(title="Cycle Test B", description="B", instructor=admin)
        
        self.stdout.write(f"✅ Created {course_a.title} and {course_b.title}")

        # 2. Create the First Leg (A requires B)
        # This is VALID.
        course_a.prerequisites.add(course_b)
        self.stdout.write(f"✅ Set Prerequisite: '{course_a.title}' requires '{course_b.title}'")

        # 3. Attempt the Cycle (Try to make B require A)
        # This should FAIL if your Serializer logic is working.
        self.stdout.write(self.style.WARNING(f"⚠️  Attempting to make '{course_b.title}' require '{course_a.title}'..."))

        # We simulate an API update using the Serializer
        data_payload = {
            'prerequisites': [course_a.id] # This creates the loop A->B->A
        }

        serializer = CourseSerializer(instance=course_b, data=data_payload, partial=True)

        if serializer.is_valid():
            serializer.save()
            self.stdout.write(self.style.ERROR("❌ FAILED: The system allowed a circular dependency! Check your logic."))
        else:
            # 4. Success! We expect an error here.
            self.stdout.write(self.style.SUCCESS("🛡️  SUCCESS: The system BLOCKED the cycle!"))
            self.stdout.write(self.style.SUCCESS(f"Server Response: {serializer.errors}"))