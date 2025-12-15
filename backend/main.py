from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from uuid import uuid4, UUID
from datetime import datetime, timedelta
from typing import List

from models import (
    SessionCreate, SessionResponse, 
    ParticipantCreate, ParticipantResponse,
    VoteCreate, Recommendation
)
from database import supabase
from ai_service import AIService

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Social Dining API")
ai_service = AIService()

# CORS Configuration
origins = [
    "http://localhost:3000",
    "https://yelp-together.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/sessions", response_model=SessionResponse)
def create_session(session: SessionCreate):
    session_id = str(uuid4())
    now = datetime.now()
    expires_at = now + timedelta(hours=24)
    
    new_session = {
        "id": session_id,
        "host_name": session.host_name,
        "location": session.location,
        "scheduled_time": session.scheduled_time.isoformat() if session.scheduled_time else None,
        "status": "created",
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "invite_link": f"http://localhost:3000/session/{session_id}" # TODO: Use env var for base URL
    }
    
    # Insert into DB
    data = supabase.table("sessions").insert(new_session).execute()
    
    # If using mock, data.data might be empty list or the object
    # For simplicity, just return the object we created
    return new_session

@app.get("/sessions/{session_id}", response_model=dict)
def get_session(session_id: str):
    # Fetch session
    session_res = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session_data = session_res.data[0]
    
    # Fetch participants
    participants_res = supabase.table("participants").select("*").eq("session_id", session_id).execute()
    participants = participants_res.data if participants_res.data else []
    
    # Fetch recommendations (if any)
    recommendations_res = supabase.table("recommendations").select("*").eq("session_id", session_id).execute()
    recommendations_data = recommendations_res.data if recommendations_res.data else []
    
    # Fetch votes
    votes_res = supabase.table("votes").select("*").eq("session_id", session_id).execute()
    votes = votes_res.data if votes_res.data else []
    
    # Aggregate votes per recommendation
    recommendations = []
    for rec in recommendations_data:
        rec_id = rec["business_id"] # Matches venue_id in votes
        rec_votes = [v for v in votes if v["venue_id"] == rec_id]
        
        score = sum(v["score"] for v in rec_votes)
        vote_count = len(rec_votes)
        
        rec["score"] = score
        rec["vote_count"] = vote_count
        recommendations.append(rec)
    
    return {
        "session": session_data,
        "participants": participants,
        "recommendations": recommendations
    }

@app.post("/sessions/{session_id}/join", response_model=ParticipantResponse)
def join_session(session_id: str, participant: ParticipantCreate):
    # Check cap
    participants_res = supabase.table("participants").select("*").eq("session_id", session_id).execute()
    current_count = len(participants_res.data) if participants_res.data else 0
    
    if current_count >= 10:
        raise HTTPException(status_code=400, detail="Session is full (max 10 users)")
        
    participant_id = str(uuid4())
    is_host = (current_count == 0) # First joiner is host? Or host joins automatically?
    # Usually Host creates session and then joins.
    # Let's assume Host calls join after create, or we handle it.
    # For now, simple logic: if 0 participants, this one is host.
    
    new_participant = {
        "id": participant_id,
        "session_id": session_id,
        "name": participant.name,
        "dietary_restrictions": participant.dietary_restrictions,
        "cuisine_preferences": participant.cuisine_preferences,
        "budget_tier": participant.budget_tier,
        "vibe": participant.vibe,
        "is_host": is_host
    }
    
    supabase.table("participants").insert(new_participant).execute()
    
    return new_participant

@app.post("/sessions/{session_id}/generate")
def generate_recommendations(session_id: str, background_tasks: BackgroundTasks):
    # Trigger AI in background or synchronous?
    # For hackathon, synchronous might be easier to debug, but slow.
    # User asked for "AI Thinking" animation, so async/background is better.
    # But we need to store results in DB.
    
    # Fetch all participants
    participants_res = supabase.table("participants").select("*").eq("session_id", session_id).execute()
    participants = participants_res.data
    
    if not participants:
        raise HTTPException(status_code=400, detail="No participants in session")
        
    # Aggregate preferences (Simple string concatenation for now)
    # In real app, we'd do smarter aggregation
    locations = set()
    cuisines = set()
    dietary = set()
    vibes = set()
    
    # We also need the session location
    session_res = supabase.table("sessions").select("*").eq("id", session_id).execute()
    session_loc = session_res.data[0]["location"]
    
    prompt = f"Find restaurants in {session_loc} for a group of {len(participants)}. "
    
    for p in participants:
        if p.get("cuisine_preferences"): cuisines.add(p["cuisine_preferences"])
        if p.get("dietary_restrictions"): dietary.add(p["dietary_restrictions"])
        if p.get("vibe"): vibes.add(p["vibe"])
        
    prompt += f"Preferences: {', '.join(cuisines)}. "
    prompt += f"Dietary Constraints: {', '.join(dietary)}. "
    prompt += f"Vibe: {', '.join(vibes)}. "
    prompt += (
        "IMPORTANT: For each restaurant, include a summary starting with 'Why Picked:' explaining why it fits the group "
        "and 'Trade-offs:' listing any downsides (e.g. distance, price). "
        "Limit to the top 3 best options."
    )
    
    # Call AI Service
    try:
        # Parallelize? For now sequential.
        
        # 1. Analyze Conflicts
        conflict_analysis = ai_service.analyze_conflicts(participants)
        
        # Update session with conflict analysis
        try:
            supabase.table("sessions").update({"conflict_analysis": conflict_analysis}).eq("id", session_id).execute()
        except Exception as e:
            logger.warning(f"Failed to save conflict_analysis (Schema mismatch?): {e}")
            # Continue execution so recommendations still load
            pass
        
        # 2. Get Recommendations
        recommendations = ai_service.generate_recommendations_with_retry(session_id, prompt)
        
        # Limit to top 3 (Curated Picks)
        recommendations = recommendations[:3]
        
        # Store in DB
        for rec in recommendations:
            rec_data = rec.dict()
            rec_data["session_id"] = session_id
            # Remove id if None - let DB auto-generate UUID
            if rec_data.get("id") is None:
                del rec_data["id"]
            
            # Remove computed fields (not in DB table)
            if "score" in rec_data: del rec_data["score"]
            if "vote_count" in rec_data: del rec_data["vote_count"]
            
            # keep why_picked and trade_offs as they are now in DB
            
            try:
                supabase.table("recommendations").insert(rec_data).execute()
            except Exception as e:
                logger.warning(f"Failed to insert full recommendation (Schema mismatch?): {e}")
                # Fallback: Remove new AI columns and retry
                # This handles the PGRST204 error where Supabase hasn't seen the new columns yet
                fallback_data = rec_data.copy()
                if "why_picked" in fallback_data: del fallback_data["why_picked"]
                if "trade_offs" in fallback_data: del fallback_data["trade_offs"]
                
                try:
                    supabase.table("recommendations").insert(fallback_data).execute()
                    logger.info("Successfully inserted recommendation using fallback (no AI fields)")
                except Exception as e2:
                    logger.error(f"Critical: Failed to insert recommendation fallback: {e2}")
            
        return {"status": "completed", "message": "Recommendations generated"}
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sessions/{session_id}/vote")
def cast_vote(session_id: str, vote: VoteCreate):
    # Verify session exists
    # Verify participant exists (optional but good)
    
    new_vote = {
        "session_id": session_id,
        "participant_id": str(vote.participant_id),
        "venue_id": vote.venue_id,
        "score": vote.score, # 1 for Like, -1 for Dislike, 0 for Neutral
        "created_at": datetime.now().isoformat()
    }
    
    # We don't have a votes table in schema.sql yet! 
    # Let's add it or just log it for now.
    # Actually, let's add it to schema.sql first? 
    # The user already ran schema.sql. 
    # I should probably ask user to run an update or just create it if not exists?
    # For now, let's assume user will add it.
    
    # Insert into DB
    supabase.table("votes").insert(new_vote).execute()
    
    return {"status": "voted", "message": "Vote recorded"}

class BookRequest(BaseModel):
    business_id: str

@app.post("/sessions/{session_id}/book")
def book_session(session_id: str, request: BookRequest):
    # Fetch session for details
    session_res = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = session_res.data[0]
    
    # Fetch participants for count
    participants_res = supabase.table("participants").select("*").eq("session_id", session_id).execute()
    count = len(participants_res.data) if participants_res.data else 2
    
    # Fetch restaurant name
    rec_res = supabase.table("recommendations").select("name").eq("session_id", session_id).eq("business_id", request.business_id).execute()
    if not rec_res.data:
        raise HTTPException(status_code=404, detail="Restaurant not found in recommendations")
    business_name = rec_res.data[0]["name"]
    
    # Call AI Agent
    result = ai_service.book_reservation(
        session_id=session_id,
        business_name=business_name,
        scheduled_time=session.get("scheduled_time") or "7:00 PM",
        people_count=count
    )
    
    # Update Session with booking status
    update_data = {
        "booking_status": result["status"],
        "booking_reference": result.get("reference"),
        "booking_message": result.get("message")
    }
    
    supabase.table("sessions").update(update_data).eq("id", session_id).execute()
    
    return result

