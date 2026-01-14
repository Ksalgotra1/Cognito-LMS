import uuid
from django.db import models
from django.conf import settings

class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses')
    thumbnail_url = models.URLField(blank=True, null=True) 
    
    # Directed Acyclic Graph (DAG) implementation for course dependencies.
    # symmetrical=False ensures directional edges (A requires B != B requires A).
    prerequisites = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        blank=True, 
        related_name='required_for' 
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def creates_cycle(self, candidate_prerequisite):
        """
        Performs a Depth First Search (DFS) to detect circular dependencies.
        Returns True if adding 'candidate_prerequisite' results in a cycle.
        Complexity: O(V + E)
        """
        # Edge case: self-dependency
        if self == candidate_prerequisite:
            return True

        stack = [candidate_prerequisite]
        visited = set()

        while stack:
            current = stack.pop()
            
            if current in visited:
                continue
            visited.add(current)

            # Cycle detected if we encounter the current instance in the traversal
            if current == self:
                return True
            
            # Add parents to stack
            for parent in current.prerequisites.all():
                stack.append(parent)
                
        return False

    def __str__(self):
        return self.title

class Module(models.Model):
    course = models.ForeignKey(Course, related_name='modules', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Lesson(models.Model):
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField(help_text="Markdown content or Video URL")
    order = models.PositiveIntegerField(default=0)
    
    # Estimated duration in minutes for the Study Scheduler algorithm
    duration_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    is_quiz_passed = models.BooleanField(default=False)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'lesson')

    def __str__(self):
        return f"{self.user.email} - {self.lesson.title}"
    
class Question(models.Model):
    lesson = models.ForeignKey(Lesson, related_name='questions', on_delete=models.CASCADE)
    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text
    
class Certificate(models.Model):
    """
    Issued upon course completion.
    Uses UUID to prevent ID enumeration attacks on public verification URLs.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    issued_at = models.DateTimeField(auto_now_add=True)
    
    certificate_id = models.UUIDField(
        default=uuid.uuid4, 
        editable=False, 
        unique=True
    )

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self):
        return f"Certificate: {self.user.username} - {self.course.title}"
    
class Enrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.title}"

class StudyPlan(models.Model):
    """
    Stores the algorithmic schedule generated via Backtracking/Greedy allocation.
    Maps user availability to lesson duration.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    
    target_date = models.DateField()
    
    # Structure: {"Mon": 120, "Tue": 0, ...} (Minutes per day)
    weekly_availability = models.JSONField(default=dict)
    
    # Structure: [{"date": "2024-01-01", "lessons": [...]}, ...]
    generated_schedule = models.JSONField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self):
        return f"Plan: {self.user.username} - {self.course.title}"