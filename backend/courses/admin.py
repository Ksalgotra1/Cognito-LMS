from django.contrib import admin

from .models import Choice, Course, Lesson, Module, Question, UserProgress


# 1. Setup Choice Inline
# This allows you to add choices directly inside the Question page
class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4  # It will show 4 empty slots for answers by default


# 2. Setup Question Admin
class QuestionAdmin(admin.ModelAdmin):
    inlines = [ChoiceInline]  # Connects the choices to the question
    list_display = ["text", "lesson", "created_at"]
    search_fields = ["text"]
    list_filter = ["lesson"]


# 3. Register everything
admin.site.register(Course)
admin.site.register(Module)
admin.site.register(Lesson)
admin.site.register(UserProgress)
admin.site.register(Question, QuestionAdmin)  # <--- Register the new Question Admin
# Note: We don't register Choice separately because it's handled inside Question
