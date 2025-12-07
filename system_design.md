# System Design Proposal: YelpTogether

## 1. Executive Summary
**YelpTogether** is a collaborative web application designed to solve the "where should we eat?" problem. By leveraging the **Yelp AI API**, it aggregates individual group preferences (dietary restrictions, budget, vibe) into a single optimized query to recommend the best dining options for the entire group.

## 2. System Architecture

### High-Level Architecture
The system follows a standard **Client-Server** architecture with a clear separation of concerns.

```mermaid
graph TD
    User[User / Browser] -->|HTTPS| Frontend[Frontend (Next.js)]
    Frontend -->|REST API (Polling)| Backend[Backend (FastAPI)]
    Backend -->|SQL| DB[(Database - PostgreSQL)]
    Backend -->|HTTPS| YelpAI[Yelp AI API]
    Backend -->|HTTPS| YelpSearch[Yelp Fusion API (Fallback)]
```

### Technology Stack Selection
*   **Frontend**: **Next.js (React)** - chosen for rapid UI development.
    *   *State Management*: **SWR** or **React Query** for efficient polling.
*   **Backend**: **FastAPI (Python)**.
*   **Database**: **PostgreSQL**.
*   **Hosting**: Vercel (Frontend), Cloud Run (Backend).
*   **External Services**: 
    *   **Yelp AI API**: Primary recommendation engine.
    *   **Yelp Fusion API**: Fallback if AI fails 3 times.

## 3. Database Design

### Schema (ER Diagram)

```mermaid
erDiagram
    SESSION ||--o{ PARTICIPANT : has
    SESSION ||--o{ RECOMMENDATION : generates
    SESSION ||--o{ VOTE : receives
    PARTICIPANT ||--o{ VOTE : casts

    SESSION {
        uuid id PK
        string host_name
        string location
        datetime scheduled_time
        string status "created, voting, finalized"
        string yelp_chat_id "for multi-turn context"
        datetime created_at
        datetime expires_at "24h TTL"
    }

    PARTICIPANT {
        uuid id PK
        uuid session_id FK
        string name
        string dietary_restrictions "csv"
        string cuisine_preferences "csv"
        string budget_tier "$, $$, $$$, $$$$"
        string vibe
        boolean is_host
    }
    
    %% Constraint: Max 10 Participants per Session

    RECOMMENDATION {
        uuid id PK
        uuid session_id FK
        string yelp_business_id
        string name
        float rating
        string price
        string image_url
        string ai_reasoning
        json raw_data
    }

    VOTE {
        uuid id PK
        uuid session_id FK
        uuid participant_id FK
        uuid recommendation_id FK
        int score "1=up, -1=down"
    }
```

## 4. API Design (REST)

### Core Endpoints

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/sessions` | Create a new dining session | `{ host_name, location, time }` | `{ session_id, invite_link }` |
| `GET` | `/api/sessions/{id}` | Get session status & participants | - | `{ session_details, participants, recommendations }` |
| `POST` | `/api/sessions/{id}/join` | Join a session | `{ name, preferences }` | `{ participant_id }` |
| `POST` | `/api/sessions/{id}/generate` | Trigger Yelp AI recommendations | - | `{ recommendations: [] }` |
| `POST` | `/api/sessions/{id}/vote` | Submit a vote | `{ participant_id, venue_id, vote_type }` | `{ status: "ok" }` |
| `POST` | `/api/sessions/{id}/finalize` | Close voting and pick winner | - | `{ winner: {} }` |

## 5. Yelp AI Integration Strategy

### Prompt Engineering
The core value proposition relies on effectively prompting the Yelp AI API. We will aggregate participant data into a structured natural language query.

**Input Aggregation Logic:**
1.  **Location**: Fixed from Session.
2.  **Cuisines**: Union of "Likes", Filter out "Dislikes".
3.  **Dietary**: Strict constraint (e.g., "Must have vegan options").
4.  **Budget**: Average or Range (e.g., "$$ - $$$").
5.  **Vibe**: Concatenate keywords (e.g., "Cozy, Rooftop, Quiet").

**Example Constructed Prompt:**
> "Find a restaurant in **San Francisco, CA** for a group of **5 people**. 
> **Constraints**: Must have **Gluten-Free** and **Vegetarian** options. 
> **Preferences**: The group likes **Italian** and **Thai**. Avoid **Sushi**.
> **Budget**: Moderate ($$). 
> **Vibe**: We want a place that is **good for conversation** and has **outdoor seating**.
> Please provide 5 recommendations with a brief explanation for why it fits this specific group."

### Multi-turn Flow & Error Handling
1.  **Initial Request**: Send aggregated prompt.
2.  **Loading State**: Frontend shows "AI is thinking..." animation (fun food-related spinner).
3.  **Empty/Bad Result**: 
    *   If 0 results, prompt Host: "No matches found. Adjust criteria?"
    *   **Retry Logic**: Allow up to 3 AI attempts with refined prompts.
    *   **Fallback**: After 3 failures, switch to standard **Yelp Fusion Search API** to ensure users get *something*.

## 6. Frontend UX Flow

1.  **Landing Page**: "Start a Session" (Host) or "Join Session" (Participant via link).
2.  **Preference Form**: 
    *   *Dietary*: Checkboxes.
    *   *Cuisine*: Multi-select chips.
    *   *Vibe*: Hybrid (Chips + Free Text).
3.  **Lobby / Waiting Room**: 
    *   **Polling**: Client polls `/api/sessions/{id}` every 3-5s to update participant list.
    *   **Cap**: Max 10 users per session.
4.  **Results Carousel**: 
    *   Shows "AI Thinking..." animation during generation.
    *   Cards: Name, Rating, Price, **AI "Why this fits" blurb**.
5.  **Voting Phase**: 
    *   Users thumbs-up/down.
    *   **Ties**: Host breaks ties (UI highlights tied options for Host).
6.  **Result Page**: Confetti animation, final restaurant details, map link.

## 7. Implementation Plan (Hackathon MVP)

### Phase 1: Setup (Hours 0-2)
- Initialize Repo (Next.js + FastAPI).
- Set up Database (Supabase/Neon).
- Deploy "Hello World" to Vercel & Cloud Run.

### Phase 2: Core Logic (Hours 2-10)
- **Backend**: Implement `POST /sessions` and `POST /join`.
- **Frontend**: Build "Create Session" and "Preference Form" UI.
- **Integration**: Connect Frontend to Backend.

### Phase 3: AI & Voting (Hours 10-18)
- **Backend**: Implement `POST /generate` connecting to Yelp AI.
- **Backend**: Implement Voting logic.
- **Frontend**: Display Results and Voting UI.

### Phase 4: Polish (Hours 18-24)
- UI Styling (Tailwind/CSS).
- Mobile responsiveness check.
- Demo video recording.
