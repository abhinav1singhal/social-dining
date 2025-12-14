import os
import json
from typing import List, Dict, Any
from openai import OpenAI
from models import Recommendation
from yelp_mapper import YelpAIMapper

# Initialize OpenAI client (compatible with Yelp AI if they use OpenAI interface, 
# otherwise we'd use requests. For this hackathon, we assume standard LLM interface or direct API)
# Note: Yelp AI API might be different. 
# If it's a REST API, we should use requests. 
# Based on requirements: "POST https://api.yelp.com/ai/chat/v2"
import requests

YELP_API_KEY = os.getenv("YELP_API_KEY")
YELP_AI_ENDPOINT = os.getenv("YELP_AI_ENDPOINT", "https://api.yelp.com/ai/chat/v2")

class AIService:
    def __init__(self):
        self.api_key = YELP_API_KEY
        self.endpoint = YELP_AI_ENDPOINT
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def generate_recommendations(self, session_id: str, prompt: str) -> List[Recommendation]:
        """
        Calls Yelp AI API to get recommendations.
        """
        payload = {
            "query": prompt
        }
        
        if not self.api_key:
            raise Exception("No API Key provided")

        # Debug logging
        print(f"\n{'='*60}")
        print(f"🔵 Calling Yelp AI API")
        print(f"URL: {self.endpoint}")
        print(f"Payload: {payload}")
        print(f"Headers: {{'Authorization': 'Bearer {self.api_key}', 'Content-Type': 'application/json'}}")
        print(f"{'='*60}\n")

        response = requests.post(self.endpoint, json=payload, headers=self.headers)
        response.raise_for_status()
        data = response.json()
        
        print(f"\n{'='*60}")
        print(f"✅ Response from Yelp AI API:")
        print(f"Status Code: {response.status_code}")
        print(f"Response Data Keys: {list(data.keys())}")
        print(f"{'='*60}\n")
        
        # Use mapper to parse response
        recommendations = YelpAIMapper.parse_response(data)
        
        return recommendations

    def analyze_conflicts(self, participants: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes conflicts in participant preferences.
        """
        if not self.api_key:
            return {"has_conflicts": False, "conflicts": [], "resolution": "No API Key"}

        prefs = []
        for p in participants:
            details = []
            if p.get('dietary_restrictions'): details.append(f"Diet: {p['dietary_restrictions']}")
            if p.get('cuisine_preferences'): details.append(f"Cuisine: {p['cuisine_preferences']}")
            if details:
                prefs.append(f"{p['name']} ({', '.join(details)})")
        
        if not prefs:
            return {"has_conflicts": False, "conflicts": [], "resolution": "No specific preferences provided."}

        prompt = (
            f"Analyze these dining preferences for a group: {'; '.join(prefs)}. "
            "Identify any major conflicts (e.g. Vegan vs Steakhouse, Budget mismatch). "
            "Return a raw JSON object (no markdown) with keys: "
            "'has_conflicts' (bool), 'conflicts' (list of strings), 'resolution' (string suggestion). "
            "If no conflicts, set has_conflicts to false."
        )

        try:
            payload = {"query": prompt}
            response = requests.post(self.endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            # Use mapper to parse conflict response
            return YelpAIMapper.parse_conflict_response(data)
        except Exception as e:
            print(f"⚠️ Conflict analysis failed: {e}")
            return {"has_conflicts": False, "conflicts": [], "resolution": "Analysis failed"}

    def book_reservation(self, session_id: str, business_name: str, scheduled_time: str, people_count: int) -> Dict[str, Any]:
        """
        Simulates an AI agent communicating with Yelp/Restaurant to book a table.
        Retuns a status dict.
        """
        import time as t
        import random
        from uuid import uuid4
        
        # Simulate "Agentic Work" (network calls, negotiation)
        t.sleep(3) 
        
        # Random failure/busy scenario (30% chance)
        if random.random() < 0.3:
            return {
                "status": "busy",
                "message": f"I called {business_name}, but they are fully booked at {scheduled_time}. Recommend calling them directly."
            }
            
        # Success scenario
        ref = f"YELP-{uuid4().hex[:4].upper()}"
        return {
            "status": "booked",
            "reference": ref,
            "message": f"Confirmed! Table for {people_count} at {business_name} referenced under #{ref}."
        }
        
    def generate_recommendations_with_retry(self, session_id: str, prompt: str) -> List[Recommendation]:
        """
        Retries up to 3 times before falling back.
        """
        for attempt in range(3):
            try:
                recs = self.generate_recommendations(session_id, prompt)
                # If we got here without exception, the API call succeeded
                # Return the results even if empty
                return recs
            except Exception as e:
                print(f"Attempt {attempt + 1} failed with error: {e}")
                if attempt < 2:  # Don't print "Retrying..." on the last attempt
                    print("Retrying...")
        
        # Fallback to standard Yelp Search (Fusion)
        print("All attempts failed. Falling back to Yelp Fusion Search")
        return self.fallback_search(prompt)

    def fallback_search(self, prompt: str) -> List[Recommendation]:
        # Implement Yelp Fusion Search here
        print("Falling back to Yelp Fusion Search")
        return []
