import os
import django
import pprint
import pickle  # <--- Added this

# --- 1. DJANGO SETUP ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from django.core.cache import cache
from courses.services import get_or_create_course_context

# --- 2. CONFIGURATION ---
COURSE_ID = 42

print(f"🔍 INSPECTING COURSE ID: {COURSE_ID}...")

# Force calculation
get_or_create_course_context(COURSE_ID)

# --- 3. FETCH & DECODE ---
cache_key = f"course_context_{COURSE_ID}"
raw_data = cache.get(cache_key)

if raw_data:
    print("\n✅ SUCCESS: Raw data found in Redis.")
    
    # 🔥 CRITICAL FIX: Unpickle the bytes to get the Dictionary
    try:
        context = pickle.loads(raw_data)
    except TypeError:
        # Fallback in case Django already unpickled it automatically
        context = raw_data

    print("\n🧠 AI MEMORY DUMP (Decoded):")
    print("-" * 40)
    pprint.pprint(context)
    print("-" * 40)
    
    # --- 4. LOGIC CHECK ---
    parents = context.get('parents', [])
    grandparents = context.get('grandparents', [])
    
    print(f"\n📊 GRAPH DEPTH ANALYSIS:")
    print(f"▶ Direct Parents: {parents}")
    print(f"▶ Grandparents:   {grandparents}")
    
    if grandparents:
        print("\n🚀 STATUS: EXCELLENT. Grandparent context is active.")
    elif parents:
        print("\n⚠️ STATUS: GOOD. Parents detected, but no Grandparents (Depth = 2).")
        print("   To see Grandparents, ensure the Parent course ALSO has a prerequisite.")
    else:
        print("\nℹ️ STATUS: BASIC. This is a Root Node (No prerequisites).")

else:
    print("\n❌ FAILED: Data not found in Redis.")