import datetime
from datetime import timedelta

# ==========================================
#  PART 1: THE SEARCH ENGINE (Trie)
# ==========================================
# This logic was previously in trie.py. We moved it here so apps.py can find it easily.

class TrieNode:
    """
    A single node in the Trie (Prefix Tree).
    Optimized with __slots__ to save RAM.
    """
    __slots__ = ['children', 'is_end_of_word', 'data']

    def __init__(self):
        self.children = {}
        self.is_end_of_word = False
        self.data = []  # Stores the full payload (id, title, url, type)

class CourseTrie:
    """
    The In-Memory Index for 0ms search.
    """
    def __init__(self):
        self.root = TrieNode()

    def insert(self, text, item_data):
        node = self.root
        clean_text = text.lower().strip()
        
        for char in clean_text:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        
        node.is_end_of_word = True
        node.data.append(item_data)

    def search(self, prefix):
        node = self.root
        clean_prefix = prefix.lower().strip()

        # 1. Traverse down to the prefix
        for char in clean_prefix:
            if char not in node.children:
                return [] 
            node = node.children[char]
        
        # 2. Collect everything below this node
        return self._collect_all(node)

    def _collect_all(self, node):
        results = []
        if node.is_end_of_word:
            results.extend(node.data)
        
        for char in node.children:
            results.extend(self._collect_all(node.children[char]))
        
        return results


# ==========================================
#  PART 2: THE STUDY SCHEDULER (Algorithm)
# ==========================================
# This logic handles the "Generate Study Plan" feature.

def generate_study_schedule(start_date, target_date, weekly_availability, lessons):
    """
    Allocates lessons into time slots based on user availability.
    Greedy First-Fit Algorithm.
    """
    schedule = []
    
    # 1. Setup Pointers
    current_date = start_date
    lesson_idx = 0
    total_lessons = len(lessons)
    
    # 2. The Allocation Loop
    while lesson_idx < total_lessons:
        
        # Safety Break: Don't schedule past 1 year
        if (current_date - start_date).days > 365:
            break

        # A. Get availability for this day
        day_name = current_date.strftime("%a") # "Mon", "Tue"...
        minutes_available = weekly_availability.get(day_name, 0)
        
        daily_plan = {
            "date": current_date.isoformat(),
            "day": day_name,
            "lessons": []
        }
        
        time_used_today = 0
        
        # B. Try to fit lessons into TODAY
        while lesson_idx < total_lessons:
            lesson = lessons[lesson_idx]
            # Default to 30 mins if duration is missing
            duration = lesson.duration_minutes if lesson.duration_minutes else 30
            
            # Check Constraint
            if time_used_today + duration <= minutes_available:
                daily_plan["lessons"].append({
                    "title": lesson.title,
                    "duration": duration,
                    "id": lesson.id
                })
                time_used_today += duration
                lesson_idx += 1
            else:
                break # Day is full
        
        # C. Add day to schedule
        if daily_plan["lessons"]:
            schedule.append(daily_plan)
        
        # D. Next day
        current_date += datetime.timedelta(days=1)

    return schedule