# Neural Archaeologist - System Architecture

## Multi-Agent LangGraph Flow

This document explains how agents coordinate using LangGraph for adaptive investigation.

### Flow Diagram

```

┌─────────────────────────────────────────────────────────────────┐
│                         START                                   │
│                    (User submits repo URL)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  SCOUT AGENT   │
                    │  (Git Only)    │
                    │                │
                    │ • Clone repo   │
                    │ • Analyze      │
                    │   commits      │
                    │ • Detect       │
                    │   patterns     │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ ANALYST AGENT  │
                    │ (First Pass)   │
                    │                │
                    │ • Analyze      │
                    │   patterns     │
                    │ • Form         │
                    │   hypothesis   │
                    │ • Calculate    │
                    │   confidence   │
                    └────────┬───────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │   COORDINATOR    │
                   │   DECISION       │
                   │                  │
                   │ Confidence < 70% │
                   └────┬────────┬────┘
                        │        │
              ┌─────────┘        └─────────┐
              │                            │
     Confidence < 70%              Confidence ≥ 70%
     Need more evidence             Good enough!
              │                            │
              ▼                            │
    ┌────────────────┐                    │
    │  SCOUT AGENT   │                    │
    │  (With Web)    │                    │
    │                │                    │
    │ • Search web   │                    │
    │ • Scrape       │                    │
    │   articles     │                    │
    │ • Gather       │                    │
    │   evidence     │                    │
    └────────┬───────┘                    │
             │                            │
             ▼                            │
    ┌────────────────┐                    │
    │ ANALYST AGENT  │                    │
    │ (Second Pass)  │                    │
    │                │                    │
    │ • Re-analyze   │                    │
    │   with web     │                    │
    │   evidence     │                    │
    │ • Update       │                    │
    │   confidence   │                    │
    └────────┬───────┘                    │
             │                            │
             ▼                            │
    ┌─────────────────┐                   │
    │  COORDINATOR    │                   │
    │  RE-CHECK       │                   │
    │                 │                   │
    │ Confidence ≥ 70%│                   │
    │ OR Max Rounds   │                   │
    └────────┬────────┘                   │
             │                            │
             └──────────┬─────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  NARRATOR AGENT  │
              │                  │
              │ • Generate story │
              │ • Create timeline│
              │ • Add citations  │
              │   (if web data)  │
              │ • Build report   │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │       END        │
              │                  │
              │  Return Report   │
              │  Confidence: 90% │
              └──────────────────┘

```
### Key Components

**Scout Agent**: Gathers data from git and web 
**Analyst Agent**: Analyzes patterns and assigns confidence
**Coordinator**: Makes routing decisions based on confidence
**Narrator Agent**: Generates final narrative report

### Decision Logic

- **IF confidence < 70%**: Loop back to Scout for web search
- **IF confidence ≥ 70%**: Proceed to Narrator
- **Max Rounds**: 3 (prevents infinite loops)

### State Management

State flows through all agents containing:
- repo_url
- scout_data
- analysis
- confidence
- needs_web_search
- web_search_done
- current_round

### Example Run

Round 1: Scout (git) → Analyst → 65% confidence (low)
Round 2: Scout (web) → Analyst → 90% confidence (high)
Round 3: Narrator → Final report
