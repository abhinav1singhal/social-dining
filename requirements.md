# Requirements Document — Social Dining Group Planner (“YelpTogether”)

## 1. Document Control
**Project Name:** YelpTogether (Working Title)  
**Version:** 1.0  
**Last Updated:** November 2025  
**Prepared By:** [Your Name]  
**Hackathon:** *Yelp AI API Hackathon*  
**Primary Data Source:** Yelp AI API  
**Project Type:** Web Application (Frontend + Backend)

## 2. Overview

### 2.1 Purpose
YelpTogether helps groups agree on a dining location by collecting individual preferences and using the Yelp AI API to recommend the best compromise restaurants.

### 2.2 Problem Statement
Group dining decisions are difficult due to varying tastes, budgets, dietary needs, and indecision.

### 2.3 Solution Summary
- Shared planning session  
- Preference collection  
- AI-generated group recommendations  
- Voting system  
- Multi-turn refinement via Yelp AI API  

---

## 3. Scope

### 3.1 In-Scope (MVP)
- Session creation  
- Preference submissions  
- Yelp AI-powered recommendations  
- Voting  
- Final venue selection  

### 3.2 Out-of-Scope
- Other POI/location APIs  
- Paid reservations  
- Login systems  
- Mobile native apps  

---

## 4. Compliance with Hackathon Rules
- Uses Yelp AI API as **primary and exclusive** data source  
- No mixing with Google Places or other POI APIs  
- Code written after hackathon start  
- Public demo + repo + video included  

---

## 5. Functional Requirements

### FR-1: Session Creation
Host creates a session containing location, time, and optional group size.

### FR-2: Join Session
Participants join via unique link.

### FR-3: Preference Submission
Users submit:
- dietary preferences  
- cuisines liked/disliked  
- budget  
- vibe  
- distance & noise tolerance  

### FR-4: Group Profile Aggregation
Backend combines all inputs into a group summary.

### FR-5: Yelp AI API Recommendation Engine
`POST https://api.yelp.com/ai/chat/v2` with:
- `query`: group request  
- `chat_id`: session-based  

### FR-6: Displaying Results
Shows:
- name  
- rating  
- price  
- categories  
- Yelp link  
- AI explanation  

### FR-7: Voting
Participants vote on venues.

### FR-8: Final Choice
App highlights top venue + backup.

### FR-9: Multi-turn Refinement
Optional follow-ups using same `chat_id`.

---

## 6. Non-Functional Requirements
- Fast response  
- Clean UI  
- Mobile-friendly  
- Secure env vars  
- Public availability  

---

## 7. User Flows

### Host
Create → Share → Collect → Generate AI suggestions → Vote → Finalize

### Participant
Join → Submit preferences → Vote → View final venue

---

## 8. Data Model

### Session
- id  
- host_name  
- location  
- date_time  
- chat_id  

### Participant
- id  
- session_id  
- name  
- dietary  
- cuisine_likes/dislikes  
- budget  
- vibe  

### Venue
- id  
- session_id  
- name  
- address  
- rating  
- price  
- categories  
- yelp_url  
- explanation  

### Vote
- id  
- session_id  
- participant_id  
- venue_id  
- score  

---

## 9. Backend API Endpoints

### POST /sessions
Creates session.

### POST /sessions/{id}/participants
Adds participant.

### POST /sessions/{id}/recommendations
Triggers Yelp AI call.

### POST /sessions/{id}/vote
Saves vote.

### GET /sessions/{id}
Returns full session.

---

## 10. System Architecture

### Frontend
- React / Next.js  
- Hosted on GCP/Firebase/Vercel  

### Backend
- FastAPI  
- Cloud Run  
- Postgres/Firestore  

---

## 11. Risks
- Yelp API quota issues  
- Latency  
- Late participants  
- Mobile UX issues  

---

## 12. Deliverables
- Public repo  
- Hosted web app  
- 3-minute demo video  
- Devpost submission  

---

## 13. Acceptance Criteria
- Must call Yelp AI API  
- Must aggregate preferences  
- Must show at least 3 recommendations  
- Must allow voting  
- Must include AI explanations  
- Must be publicly deployed  
