from typing import Dict, Callable
from groq import Groq
from app.config import settings
from datetime import datetime


class NarratorAgent:
    """Narrator Agent - Transforms findings into compelling narrative"""
    
    def __init__(self, progress_callback: Callable = None):
        self.progress_callback = progress_callback
        self.client = Groq(api_key=settings.GROQ_API_KEY)
    
    def emit_progress(self, message: str, data: Dict = None):
        """Emit progress message"""
        if self.progress_callback:
            self.progress_callback("narrator", message, data or {})
    
    def has_web_evidence(self, scout_data: Dict) -> bool:
        """Check if web search was performed and found results"""
        web_results = scout_data.get('web_search_results', {})
        if not web_results:
            return False
        
        # Check if any category has results with actual content
        for category, results in web_results.items():
            if results and len(results) > 0:
                for result in results:
                    if result.get('full_content') or result.get('snippet'):
                        return True
        return False
    
    def build_narrative_prompt(self, scout_data: Dict, analysis: Dict) -> str:
        """Build prompt for narrative generation"""
        
        # Extract key dates
        first_commit = scout_data.get('first_commit_date', 'Unknown')
        last_commit = scout_data.get('last_commit_date', 'Unknown')
        
        # Format patterns
        patterns_text = []
        if scout_data.get('patterns_detected'):
            for pattern_name, pattern_data in scout_data['patterns_detected'].items():
                patterns_text.append(f"- {pattern_name}: {pattern_data}")
        
        # Check if we have web evidence
        has_web = self.has_web_evidence(scout_data)
        
        # Build different prompts based on evidence availability
        if has_web:
            # DETAILED PROMPT WITH CITATIONS
            web_evidence_detailed = []
            citation_counter = 1
            
            for category, results in scout_data.get('web_search_results', {}).items():
                for result in results:
                    full_content = result.get('full_content', '')
                    snippet = result.get('snippet', '')
                    
                    evidence_entry = f"""
[Source {citation_counter}] {result['title']}
URL: {result['link']}
Snippet: {snippet}
Full Content: {full_content[:1000] if full_content else 'Content unavailable'}
"""
                    web_evidence_detailed.append(evidence_entry)
                    citation_counter += 1
            
            prompt = f"""You are a master storyteller specializing in software archaeology. Create a compelling narrative report about this repository.

## Data Summary:

**Repository:** {scout_data['repo_name']}
**Hypothesis:** {analysis['hypothesis']}
**Confidence:** {analysis['confidence']}%
**Likely Cause:** {analysis.get('likely_cause', 'unknown')}

**Timeline:**
- First Commit: {first_commit}
- Last Commit: {last_commit}
- Total Commits: {scout_data['total_commits']}
- Contributors: {scout_data['contributors_count']}
- Active Period: {scout_data['active_period_months']:.1f} months

**Git Patterns:**
{chr(10).join(patterns_text) if patterns_text else "No significant patterns"}

**External Evidence (CRITICAL - Use these sources with specific citations):**
{chr(10).join(web_evidence_detailed)}

**Key Findings:**
{chr(10).join([f"- {f}" for f in analysis.get('key_findings', [])])}

---

Generate a comprehensive archaeological report in markdown format:

# 📖 THE STORY: [Clever Title]

## ACT I: THE BIRTH
Write 2-3 paragraphs about the project's origins.
**If sources mention creation reasons, cite them: "According to [Source X]..."**

## ACT II: THE GOLDEN AGE
Write 2-3 paragraphs about peak activity and growth.
**Use specific facts from git data and any relevant sources.**

## ACT III: THE DECLINE
Write 2-3 paragraphs about what happened.
**CRITICAL:** Use specific evidence from sources:
- If GitHub archive found: "The repository was officially archived as shown on GitHub..."
- If blog post found: "According to [Company's/Author's name from source], the team..."
- Include specific quotes or detailed facts from the scraped content above
- Be very specific: "moved to [alternative tool]", "deprecated in favor of [X]"

# 🔍 KEY FINDINGS
Bullet points of discoveries

# 💡 SALVAGEABILITY ANALYSIS
Rate: ✅ HIGHLY SALVAGEABLE / ⚠️ PARTIALLY SALVAGEABLE / ❌ NOT SALVAGEABLE
Explain based on evidence

# 🛠️ RECOMMENDATIONS
3-5 actionable recommendations

# 📚 SOURCES
List sources cited in your narrative:
- [Source 1] Title - URL
- [Source 2] Title - URL

**CRITICAL:** When you reference external sources in Act III, be SPECIFIC. Don't say "sources suggest" - say "According to Uber's engineering blog" or "The GitHub archive page indicates". Use actual information from the full content provided.
"""
        
        else:
            # SIMPLE PROMPT WITHOUT CITATIONS
            prompt = f"""You are a master storyteller specializing in software archaeology. Create a compelling narrative report about this repository based on git history analysis.

## Data Summary:

**Repository:** {scout_data['repo_name']}
**Hypothesis:** {analysis['hypothesis']}
**Confidence:** {analysis['confidence']}%
**Likely Cause:** {analysis.get('likely_cause', 'unknown')}

**Timeline:**
- First Commit: {first_commit}
- Last Commit: {last_commit}
- Total Commits: {scout_data['total_commits']}
- Contributors: {scout_data['contributors_count']}
- Active Period: {scout_data['active_period_months']:.1f} months

**Git Patterns Detected:**
{chr(10).join(patterns_text) if patterns_text else "No significant patterns"}

**Key Findings:**
{chr(10).join([f"- {f}" for f in analysis.get('key_findings', [])])}

---

Generate a comprehensive archaeological report in markdown format:

# 📖 THE STORY: [Clever Title]

## ACT I: THE BIRTH
Write 2-3 paragraphs about likely origins based on commit patterns and dates.

## ACT II: THE GOLDEN AGE
Write 2-3 paragraphs about peak activity period based on commit data.

## ACT III: THE DECLINE
Write 2-3 paragraphs about decline based on commit patterns.
**Note:** Base this ONLY on git patterns (sudden stops, decay, etc.) since no external sources were found.

# 🔍 KEY FINDINGS
Bullet points of discoveries from git analysis

# 💡 SALVAGEABILITY ANALYSIS
Rate: ✅ HIGHLY SALVAGEABLE / ⚠️ PARTIALLY SALVAGEABLE / ❌ NOT SALVAGEABLE
Base on code age, activity patterns, and technical relevance

# 🛠️ RECOMMENDATIONS
3-5 actionable recommendations for someone inheriting this code

**Note:** This analysis is based solely on git history patterns. External verification was not performed.
"""
        
        return prompt
    
    def extract_citations(self, scout_data: Dict) -> list:
        """Extract citations from web sources if they exist"""
        citations = []
        citation_num = 1
        
        if scout_data.get('web_search_results'):
            for category, results in scout_data['web_search_results'].items():
                for result in results:
                    citations.append({
                        "number": citation_num,
                        "title": result.get('title', 'Unknown'),
                        "url": result.get('link', ''),
                        "source": result.get('source', 'Unknown'),
                        "snippet": result.get('snippet', '')
                    })
                    citation_num += 1
        
        return citations
    
    def generate_timeline(self, scout_data: Dict, analysis: Dict) -> list:
        """Generate timeline events"""
        timeline = []
        
        # First commit
        if scout_data.get('first_commit_date'):
            timeline.append({
                "date": scout_data['first_commit_date'],
                "event": "Project Inception",
                "description": f"First commit to {scout_data['repo_name']}",
                "type": "birth"
            })
        
        # Activity spike
        if 'activity_spike' in scout_data.get('patterns_detected', {}):
            spike = scout_data['patterns_detected']['activity_spike']
            timeline.append({
                "date": spike['month'],
                "event": "Peak Development",
                "description": f"Activity spike: {spike['commit_count']} commits this month",
                "type": "peak"
            })
        
        # Sudden stop
        if 'sudden_stop' in scout_data.get('patterns_detected', {}):
            stop = scout_data['patterns_detected']['sudden_stop']
            timeline.append({
                "date": stop['last_activity'],
                "event": "Development Ceased",
                "description": f"Last commit - {stop['months_since']:.0f} months ago",
                "type": "decline"
            })
        
        # Add current date
        timeline.append({
            "date": datetime.now().isoformat(),
            "event": "Archaeological Investigation",
            "description": "Neural Archaeologist analysis completed",
            "type": "present"
        })
        
        return sorted(timeline, key=lambda x: x['date'])
    
    def format_contributor_profiles(self, scout_data: Dict) -> str:
        """Format contributor information"""
        profiles = []
        total_commits = scout_data.get('total_commits', 1)
        
        for contributor in scout_data.get('top_contributors', [])[:5]:
            name = contributor.get('name', contributor.get('username', 'Unknown'))
            commits = contributor.get('commit_count', contributor.get('contributions', 0))
            
            # Calculate percentage if missing (GitHub API data doesn't have it)
            if 'percentage' in contributor:
                percentage = contributor['percentage']
            else:
                percentage = round((commits / total_commits) * 100, 1) if total_commits > 0 else 0
            
            profile = f"""
### {name}
- **Commits:** {commits} ({percentage}% of total)
- **Impact:** {'Lead Developer' if percentage > 30 else 'Core Contributor' if percentage > 10 else 'Regular Contributor'}
"""
            profiles.append(profile)
        
        return "\n".join(profiles) if profiles else "No contributor data available"
    
    def generate_report(self, scout_data: Dict, analysis: Dict) -> Dict:
        """Generate complete narrative report"""
        
        self.emit_progress("Narrator agent activated")
        self.emit_progress("Synthesizing findings into narrative...")
        
        try:
            # Check if we have web evidence
            has_web = self.has_web_evidence(scout_data)
            
            if has_web:
                self.emit_progress("Crafting narrative with external source citations...")
            else:
                self.emit_progress("Crafting narrative from git analysis only...")
            
            # Generate narrative using LLM
            prompt = self.build_narrative_prompt(scout_data, analysis)
            
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a master storyteller and investigative journalist who creates engaging narratives about software projects. When external sources are provided, ALWAYS cite them specifically. When only git data is available, base your narrative on commit patterns. Write in clear, compelling prose."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=3500
            )
            
            narrative = chat_completion.choices[0].message.content
            
            self.emit_progress("Generating timeline...")
            timeline = self.generate_timeline(scout_data, analysis)
            
            self.emit_progress("Creating contributor profiles...")
            contributor_profiles = self.format_contributor_profiles(scout_data)
            
            # Extract citations only if web evidence exists
            citations = self.extract_citations(scout_data) if has_web else []
            
            # Build complete report
            report = {
                "narrative": narrative,
                "timeline": timeline,
                "contributor_profiles": contributor_profiles,
                "citations": citations,
                "has_external_sources": has_web,
                "executive_summary": {
                    "repo_name": scout_data['repo_name'],
                    "repo_url": scout_data['repo_url'],
                    "total_commits": scout_data['total_commits'],
                    "contributors": scout_data['contributors_count'],
                    "first_commit": scout_data.get('first_commit_date'),
                    "last_commit": scout_data.get('last_commit_date'),
                    "active_months": scout_data['active_period_months'],
                    "hypothesis": analysis['hypothesis'],
                    "confidence": analysis['confidence'],
                    "status": analysis.get('likely_cause', 'unknown')
                },
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "confidence": analysis['confidence'],
                    "evidence_quality": analysis.get('evidence_quality', 'unknown'),
                    "sources_found": len(citations)
                }
            }
            
            self.emit_progress("Report generation complete!")
            
            return report
        
        except Exception as e:
            self.emit_progress(f"Report generation failed: {str(e)}")
            return {
                "narrative": f"# Error\n\nFailed to generate narrative: {str(e)}",
                "timeline": [],
                "contributor_profiles": "Error generating profiles",
                "citations": [],
                "has_external_sources": False,
                "executive_summary": {},
                "metadata": {"error": str(e)},
                "error": str(e)
            }