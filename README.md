# 🏛️ Neural Archaeologist

**Multi-Agent AI System for Code History Excavation**

> When a senior engineer leaves, they take years of knowledge with them. GitHub Copilot tells you what code does—Neural Archaeologist tells you **WHY** it was built, **WHAT** happened to it, and **WHETHER** it's still valuable.

**Live Demo:** [https://neural-archaeologist.vercel.app/](https://neural-archaeologist.vercel.app/)

---

## 💡 The Problem

Companies spend **$50+ billion annually** on legacy code maintenance. When developers inherit codebases, they face:
- 🤔 **What was this built for?**
- 🤷 **Why was it abandoned?**
- 💰 **Is anything salvageable?**
- 🔄 **Should we migrate or rebuild?**

Current tools like **GitHub Copilot** explain what code does, but can't answer these deeper questions.

---

## 🚀 Our Solution

**Neural Archaeologist** uses **4 specialized AI agents** working together:

1. **🔍 Scout Agent** - Gathers data from git history + web (blogs, articles, news)
2. **🧠 Analyst Agent** - Detects patterns, forms hypotheses, assigns confidence scores
3. **🎯 Coordinator** - Makes dynamic routing decisions based on confidence
4. **🎭 Narrator Agent** - Transforms findings into three-act stories with timelines

### **How It Works:**
```
Round 1: Scout (git) → Analyst → 65% confidence (too low!)
Round 2: Coordinator → "Need more evidence!" → Scout (web search)
Round 3: Scout finds blog post → Analyst → 90% confidence ✓
Round 4: Narrator → Generates comprehensive report
```

**Key Innovation:** Agents **iterate autonomously** until confident—not a hardcoded pipeline.

---

## ✨ What Makes It Unique

### **vs GitHub Copilot**
| Feature | GitHub Copilot | Neural Archaeologist |
|---------|----------------|---------------------|
| Explains current code | ✅ | ✅ |
| Analyzes git history | ❌ | ✅ |
| Searches external context | ❌ | ✅ |
| Forms hypotheses | ❌ | ✅ |
| Multi-agent coordination | ❌ | ✅ |
| Generates narratives | ❌ | ✅ |

### **Unique Features**
✅ **Multi-Agent Coordination** - True collaboration, not chained prompts  
✅ **Confidence-Driven Iteration** - Loops back for more evidence if needed  
✅ **Multi-Source Intelligence** - Combines git + GitHub + web + scraped content  
✅ **Narrative Storytelling** - Three-act structure (Birth → Growth → Decline)  
✅ **Real-Time Transparency** - Watch agents work via WebSocket updates  
✅ **Salvageability Analysis** - Actionable migration recommendations  

---

## 🛠️ Tech Stack

**Backend:**
- **FastAPI** - Web framework with async support
- **LangGraph** - Multi-agent orchestration and state management
- **Groq (Llama 3.3 70B)** - LLM provider
- **GitPython** - Repository analysis
- **SerpAPI** - Web search + scraping
- **PostgreSQL** - Database
- **Socket.IO** - Real-time WebSocket communication

**Frontend:**
- **React 18 + Vite** - Fast, modern UI framework
- **TailwindCSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **Recharts** - Interactive visualizations
- **Socket.IO Client** - Real-time updates

---

## 🤖 Multi-Agent System

### **Agent Roles**

**🔍 Scout Agent (Information Gatherer)**
- Clones repository and parses git history
- Extracts commits, contributors, dates, patterns
- Searches web for external context (blogs, news, announcements)
- Scrapes full content from relevant articles
- Detects: activity spikes, sudden stops, gradual decay

**🧠 Analyst Agent (Pattern Detector)**
- Analyzes commit patterns using Groq LLM
- Forms hypotheses about what happened
- Assigns confidence scores (0-100%)
- Determines if more evidence is needed
- Re-analyzes when new data arrives

**🎯 Coordinator (Orchestrator)**
- Routes between agents using LangGraph
- Makes decisions: "confidence < 70% → get more evidence"
- Manages investigation state and rounds
- Prevents infinite loops (max 3 rounds)
- Ensures quality before final report

**🎭 Narrator Agent (Storyteller)**
- Generates three-act narrative structure
- Creates interactive timeline with key events
- Analyzes contributor impact
- Provides salvageability assessment
- Gives migration recommendations
- Cites sources when web search was performed

---

## 🚀 Quick Start

### **Prerequisites**
- Python 3.11+, Node.js 18+, PostgreSQL 14+

### **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env with:
# DATABASE_URL, GROQ_API_KEY, SERPAPI_API_KEY, SECRET_KEY

uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Setup**
```bash
cd frontend
npm install

# Create .env with:
# VITE_API_URL=http://localhost:8000

npm run dev
```

Visit `http://localhost:5173` and start investigating!

---

## 📊 Use Cases

- **M&A Due Diligence** - Assess technical debt before acquisition
- **Legacy System Assessment** - Prioritize which repos to maintain
- **Onboarding Engineers** - Generate project histories automatically
- **Technical Debt Documentation** - Preserve institutional knowledge
- **Open Source Research** - Understand why projects were abandoned

---

## 🏆 Why This Stands Out

✅ **Technical Complexity** - True multi-agent system with dynamic routing  
✅ **Real-World Value** - Solves $50B problem in technical debt  
✅ **Unique Approach** - "Digital archaeology" metaphor  
✅ **Demo Impact** - Live agent collaboration, visual confidence updates  
✅ **Production Ready** - Full authentication, database, real-time updates  

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with zeal🍉**