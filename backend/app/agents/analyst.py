from typing import Dict, Callable
from groq import Groq
from app.config import settings
import json


class AnalystAgent:
    """Analyst Agent - Analyzes patterns and forms hypotheses using LLM"""
    
    def __init__(self, progress_callback: Callable = None):
        self.progress_callback = progress_callback
        self.client = Groq(api_key=settings.GROQ_API_KEY)
    
    def emit_progress(self, message: str, data: Dict = None):
        """Emit progress message"""
        if self.progress_callback:
            self.progress_callback("analyst", message, data or {})
    
    def build_analysis_prompt(self, scout_data: Dict) -> str:
        """Build prompt for LLM analysis"""
        
        patterns_summary = []
        if scout_data.get('patterns_detected'):
            patterns = scout_data['patterns_detected']
            
            if 'activity_spike' in patterns:
                spike = patterns['activity_spike']
                patterns_summary.append(
                    f"- Activity spike in {spike['month']} with {spike['commit_count']} commits"
                )
            
            if 'sudden_stop' in patterns:
                stop = patterns['sudden_stop']
                patterns_summary.append(
                    f"- Sudden halt detected: last activity {stop['last_activity']} ({stop['months_since']:.0f} months ago)"
                )
            
            if 'gradual_decay' in patterns:
                decay = patterns['gradual_decay']
                patterns_summary.append(
                    f"- Gradual decay: {decay['decline_percentage']:.0f}% decline in activity over time"
                )
        
        # Summarize web findings
        web_summary = []
        if scout_data.get('web_search_results'):
            for category, results in scout_data['web_search_results'].items():
                for result in results:
                    web_summary.append(
                        f"- [{result['title']}] {result['snippet']}\n  Content: {result.get('full_content', '')[:500]}"
                    )
        
        prompt = f"""You are an expert code archaeologist analyzing a GitHub repository's history.

## Repository: {scout_data['repo_name']}
## Basic Stats:
- Total Commits: {scout_data['total_commits']}
- Contributors: {scout_data['contributors_count']}
- First Commit: {scout_data['first_commit_date']}
- Last Commit: {scout_data['last_commit_date']}
- Active Period: {scout_data['active_period_months']:.1f} months

## Patterns Detected:
{chr(10).join(patterns_summary) if patterns_summary else "No significant patterns detected"}

## Web Research Findings:
{chr(10).join(web_summary[:5]) if web_summary else "No web context found"}

## Top Contributors:
{chr(10).join([f"- {c['name']}: {c['commit_count']} commits ({c['percentage']}%)" for c in scout_data.get('top_contributors', [])[:3]])}

---

Your task: Analyze this data and provide a hypothesis about what happened to this repository.

Respond in JSON format with these fields:
{{
    "hypothesis": "Clear, concise statement about what happened",
    "confidence": 0-100 (integer),
    "reasoning": ["reason 1", "reason 2", "reason 3"],
    "evidence_quality": "strong/medium/weak",
    "needs_more_evidence": true/false,
    "key_findings": ["finding 1", "finding 2"],
    "likely_cause": "abandonment/archived/migration/active/maintenance-mode/unknown"
}}

Be objective. Base confidence on evidence strength. If web sources provide clear confirmation, confidence should be 80+. If only git patterns without external validation, keep confidence 60-70."""

        return prompt
    
    def parse_llm_response(self, response_text: str) -> Dict:
        """Parse and validate LLM response"""
        try:
            # Try to extract JSON from response
            # Sometimes LLM adds extra text, so find JSON block
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            
            if start != -1 and end != 0:
                json_str = response_text[start:end]
                result = json.loads(json_str)
                
                # Validate required fields
                required = ['hypothesis', 'confidence', 'reasoning']
                for field in required:
                    if field not in result:
                        raise ValueError(f"Missing required field: {field}")
                
                # Ensure confidence is valid
                result['confidence'] = max(0, min(100, int(result['confidence'])))
                
                return result
            else:
                raise ValueError("No JSON found in response")
        
        except Exception as e:
            self.emit_progress(f"Failed to parse LLM response: {e}")
            # Return default structure
            return {
                "hypothesis": "Unable to form hypothesis from available data",
                "confidence": 30,
                "reasoning": ["Insufficient data for analysis"],
                "evidence_quality": "weak",
                "needs_more_evidence": True,
                "key_findings": [],
                "likely_cause": "unknown"
            }
    
    def analyze(self, scout_data: Dict, previous_analysis: Dict = None) -> Dict:
        """Analyze Scout's findings and form hypothesis"""
        
        self.emit_progress("Analyst agent activated")
        self.emit_progress("Processing commit patterns...")
        
        try:
            # Build prompt
            prompt = self.build_analysis_prompt(scout_data)
            
            self.emit_progress("Consulting AI model for pattern analysis...")
            
            # Call Groq LLM
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert software archaeologist specializing in analyzing abandoned codebases. You provide data-driven insights based on git history and external sources."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=1000
            )
            
            # Parse response
            response_text = chat_completion.choices[0].message.content
            analysis = self.parse_llm_response(response_text)
            
            # Emit progress with confidence
            confidence = analysis['confidence']
            self.emit_progress(
                f"Analysis complete: {analysis['hypothesis'][:100]}...",
                {"confidence": confidence}
            )
            
            self.emit_progress(f"Confidence score: {confidence}%")
            
            # Determine if more evidence needed
            if confidence < 70:
                self.emit_progress(
                    "⚠️ Confidence below threshold (70%) - more evidence recommended",
                    {"needs_verification": True}
                )
                analysis['needs_more_evidence'] = True
            else:
                self.emit_progress(
                    "✓ Confidence sufficient for final report",
                    {"needs_verification": False}
                )
                analysis['needs_more_evidence'] = False
            
            return analysis
        
        except Exception as e:
            self.emit_progress(f"Analysis failed: {str(e)}")
            return {
                "hypothesis": f"Analysis error: {str(e)}",
                "confidence": 0,
                "reasoning": ["Technical error during analysis"],
                "evidence_quality": "weak",
                "needs_more_evidence": True,
                "key_findings": [],
                "likely_cause": "unknown",
                "error": str(e)
            }