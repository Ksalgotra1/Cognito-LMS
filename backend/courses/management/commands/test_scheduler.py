import json
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from courses.models import Course, Lesson
from courses.utils import generate_study_schedule


class Command(BaseCommand):
    help = "Tests the Study Scheduler Algorithm with mock data."

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("📅 Starting Scheduler Algorithm Test..."))

        # 1. Setup Data: Get the first course from DB
        course = Course.objects.first()
        if not course:
            self.stdout.write(self.style.ERROR("❌ No courses found. Run 'python manage.py seed_courses' first."))
            return

        # Get lessons strictly ordered
        lessons = Lesson.objects.filter(module__course=course)
        if not lessons.exists():
            self.stdout.write(self.style.ERROR(f"❌ Course '{course.title}' has no lessons."))
            return

        self.stdout.write(f"✅ Found Course: {course.title} ({lessons.count()} lessons)")

        # 2. Define Constraints (The "Student's" Request)
        # Scenario: Student works full time.
        # Can only study:
        # - Mondays: 1 Hour (60 mins)
        # - Wednesdays: 2 Hours (120 mins)
        # - Weekends: 0 mins (Busy)
        start_date = date.today()
        target_date = start_date + timedelta(days=365)  # Give them a year

        availability = {
            "Mon": 60,
            "Wed": 120,
            # Other days are implicitly 0
        }

        self.stdout.write(self.style.SUCCESS(f"ℹ️  Constraint: Mon (60m), Wed (120m) | Start: {start_date}"))

        # 3. RUN THE ALGORITHM
        self.stdout.write("⚙️  Running Greedy Allocation Algorithm...")
        schedule = generate_study_schedule(start_date, target_date, availability, lessons)

        # 4. Verify & Print
        if not schedule:
            self.stdout.write(self.style.ERROR("❌ Result: Empty Schedule! (Check logic or constraints)"))
        else:
            self.stdout.write(self.style.SUCCESS("✅ Result: Schedule Generated Successfully!"))

            # Print the first 3 scheduled days to verify logic
            self.stdout.write("\n--- PREVIEW (First 3 Active Days) ---")
            print(json.dumps(schedule[:3], indent=2))

            # Calculate stats
            total_days_scheduled = len(schedule)
            total_lessons_scheduled = sum(len(day["lessons"]) for day in schedule)

            self.stdout.write(
                f"\n📊 Stats: Scheduled {total_lessons_scheduled}/{lessons.count()} lessons over {total_days_scheduled} active study days."
            )

            # Check if logic holds (Are there any Tuesdays?)
            days_used = [day["day"] for day in schedule]
            if "Tue" in days_used or "Fri" in days_used:
                self.stdout.write(self.style.ERROR("❌ FAILED: Algorithm scheduled lessons on a busy day!"))
            else:
                self.stdout.write(self.style.SUCCESS("🛡️  SUCCESS: Algorithm respected the Mon/Wed restriction."))
