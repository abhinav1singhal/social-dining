import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

# Mock client if keys are missing (for local dev without keys)
class MockSupabase:
    def table(self, name):
        return self
    def insert(self, data):
        return self
    def select(self, *args):
        return self
    def eq(self, *args):
        return self
    def execute(self):
        return {"data": [], "error": None}

if not url or not key:
    print("Warning: Supabase credentials not found. Using Mock client.")
    supabase: Client = MockSupabase()
else:
    supabase: Client = create_client(url, key)
