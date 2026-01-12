from typing import Dict, Callable
from app.utils.git_analyzer import GitAnalyzer
from app.utils.web_search import WebSearcher


class ScoutAgent:
    """Scout Agent - Gathers information from git and web"""
    
    def __init__(self, progress_callback: Callable = None):
        self.progress_callback = progress_callback
    
    def emit_progress(self, message: str, data: Dict = None):
        """Emit progress message"""
        if self.progress_callback:
            self.progress_callback("scout", message, data or {})
    
    def investigate(self, repo_url: str, include_web_search: bool = True) -> Dict:
        """Main investigation method"""
        
        self.emit_progress("Scout agent activated")
        self.emit_progress(f"Cloning repository: {repo_url}")
        
        try:
            # Git analysis
            analyzer = GitAnalyzer(repo_url)
            git_data = analyzer.analyze()
            
            self.emit_progress(f"Repository cloned successfully")
            self.emit_progress(f"Found {git_data['total_commits']} commits across {git_data['active_period_months']:.1f} months")
            
            # Report patterns
            if git_data['patterns_detected']:
                patterns = git_data['patterns_detected']
                
                if 'activity_spike' in patterns:
                    spike = patterns['activity_spike']
                    self.emit_progress(
                        f"Detected activity spike: {spike['month']} ({spike['commit_count']} commits)"
                    )
                
                if 'sudden_stop' in patterns:
                    stop = patterns['sudden_stop']
                    self.emit_progress(
                        f"Detected sudden halt: Last activity {stop['last_activity']} ({stop['months_since']:.0f} months ago)"
                    )
                
                if 'gradual_decay' in patterns:
                    decay = patterns['gradual_decay']
                    self.emit_progress(
                        f"Detected gradual decay: {decay['decline_percentage']:.0f}% decline in activity"
                    )
            
            # Web search (optional)
            web_results = {}
            if include_web_search:
                self.emit_progress("Searching web for additional context...")
                
                try:
                    searcher = WebSearcher()
                    # Extract owner from URL
                    parts = repo_url.rstrip('/').split('/')
                    owner = parts[-2] if len(parts) >= 2 else None
                    repo_name = git_data['repo_name']
                    
                    web_results = searcher.search_repo_context(repo_name, owner)
                    
                    total_results = sum(len(v) for v in web_results.values())
                    self.emit_progress(f"Found {total_results} web sources")
                    
                except Exception as e:
                    self.emit_progress(f"Web search failed: {str(e)}")
                    web_results = {}
            
            # Combine results
            final_result = {
                **git_data,
                "web_search_results": web_results
            }
            
            self.emit_progress("Scout investigation complete", {"confidence_boost": 40})
            
            return final_result
        
        except Exception as e:
            self.emit_progress(f"Scout investigation failed: {str(e)}")
            raise e