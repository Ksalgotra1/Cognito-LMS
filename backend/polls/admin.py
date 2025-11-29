
# polls/admin.py
from django.contrib import admin
from .models import Question, Choice

# Inline editor for choices on the Question page
class ChoiceInline(admin.TabularInline):  # you can use admin.StackedInline if you prefer
    model = Choice
    extra = 3  # how many blank rows to show for new choices

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("question_text", "pub_date")
    search_fields = ("question_text",)
    date_hierarchy = "pub_date"
    inlines = [ChoiceInline]  # <-- shows Choices inline on the Question edit page

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ("question", "choice_text", "votes")
    search_fields = ("choice_text",)
