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
