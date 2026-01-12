import os
import shutil
from datetime import datetime
from collections import defaultdict
from git import Repo, GitCommandError
from typing import Dict, List, Optional
import tempfile


class GitAnalyzer:
    """Analyzes git repositories and extracts commit history"""
    
    def __init__(self, repo_url: str):
        self.repo_url = repo_url
        self.repo_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')
        self.temp_dir = None
        self.repo = None
    
    def clone_repository(self) -> bool:
        """Clone the repository to a temporary directory"""
        try:
            # Create temp directory with unique timestamp
            import time
            timestamp = int(time.time())
            self.temp_dir = os.path.join(tempfile.gettempdir(), f"neural_arch_{self.repo_name}_{timestamp}")
            
            # Remove if exists (with retry for Windows)
            if os.path.exists(self.temp_dir):
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        shutil.rmtree(self.temp_dir)
                        break
                    except PermissionError:
                        if attempt < max_retries - 1:
                            time.sleep(1)  # Wait before retry
                        else:
                            # If still fails, use a different directory
                            timestamp = int(time.time())
                            self.temp_dir = os.path.join(tempfile.gettempdir(), f"neural_arch_{self.repo_name}_{timestamp}")
            
            # Clone repository
            self.repo = Repo.clone_from(self.repo_url, self.temp_dir, depth=None)
            return True
        
        except GitCommandError as e:
            raise Exception(f"Failed to clone repository: {str(e)}")
        except Exception as e:
            raise Exception(f"Error during cloning: {str(e)}")
    
    def analyze_commits(self) -> Dict:
        """Extract and analyze all commits"""
        if not self.repo:
            raise Exception("Repository not cloned yet")
        
        commits_data = []
        contributors = set()
        commits_by_month = defaultdict(int)
        
        # Iterate through all commits
        for commit in self.repo.iter_commits():
            commit_date = datetime.fromtimestamp(commit.committed_date)
            author = commit.author.name
            
            commits_data.append({
                "hash": commit.hexsha[:7],
                "author": author,
                "date": commit_date.isoformat(),
                "message": commit.message.strip()
            })
            
            contributors.add(author)
            month_key = commit_date.strftime("%Y-%m")
            commits_by_month[month_key] += 1
        
        # Sort commits by date (oldest first)
        commits_data.sort(key=lambda x: x['date'])
        
        return {
            "total_commits": len(commits_data),
            "commits": commits_data,
            "contributors": list(contributors),
            "contributors_count": len(contributors),
            "commits_by_month": dict(commits_by_month),
            "first_commit_date": commits_data[0]['date'] if commits_data else None,
            "last_commit_date": commits_data[-1]['date'] if commits_data else None
        }
    
    def detect_patterns(self, commits_data: Dict) -> Dict:
        """Detect patterns in commit activity"""
        patterns = {}
        commits_by_month = commits_data.get('commits_by_month', {})
        
        if not commits_by_month:
            return patterns
        
        # Find activity spike (month with highest commits)
        max_month = max(commits_by_month.items(), key=lambda x: x[1])
        avg_commits = sum(commits_by_month.values()) / len(commits_by_month)
        
        if max_month[1] > avg_commits * 1.5:  # 50% above average
            patterns['activity_spike'] = {
                "month": max_month[0],
                "commit_count": max_month[1],
                "average": round(avg_commits, 1)
            }
        
        # Detect sudden stop (no commits in last 6+ months)
        if commits_data.get('last_commit_date'):
            last_commit = datetime.fromisoformat(commits_data['last_commit_date'])
            months_since = (datetime.now() - last_commit).days / 30
            
            if months_since > 6:
                patterns['sudden_stop'] = {
                    "detected": True,
                    "last_activity": commits_data['last_commit_date'],
                    "months_since": round(months_since, 1)
                }
        
        # Detect gradual decay (compare first half vs second half)
        sorted_months = sorted(commits_by_month.items())
        if len(sorted_months) > 6:
            mid_point = len(sorted_months) // 2
            first_half_avg = sum(v for _, v in sorted_months[:mid_point]) / mid_point
            second_half_avg = sum(v for _, v in sorted_months[mid_point:]) / (len(sorted_months) - mid_point)
            
            if first_half_avg > second_half_avg * 1.5:
                patterns['gradual_decay'] = {
                    "detected": True,
                    "early_avg": round(first_half_avg, 1),
                    "later_avg": round(second_half_avg, 1),
                    "decline_percentage": round(((first_half_avg - second_half_avg) / first_half_avg) * 100, 1)
                }
        
        return patterns
    
    def get_top_contributors(self, commits_data: Dict, top_n: int = 5) -> List[Dict]:
        """Get top contributors by commit count"""
        contributor_commits = defaultdict(int)
        
        for commit in commits_data.get('commits', []):
            contributor_commits[commit['author']] += 1
        
        # Sort by commit count
        sorted_contributors = sorted(
            contributor_commits.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]
        
        return [
            {
                "name": name,
                "commit_count": count,
                "percentage": round((count / commits_data['total_commits']) * 100, 1)
            }
            for name, count in sorted_contributors
        ]
    
    def cleanup(self):
        """Remove temporary directory"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                import time
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        shutil.rmtree(self.temp_dir)
                        break
                    except PermissionError:
                        if attempt < max_retries - 1:
                            time.sleep(1)
                        
            except Exception as e:
                
                pass
    
    def analyze(self) -> Dict:
        """Complete analysis pipeline"""
        try:
            # Clone repository
            self.clone_repository()
            
            # Analyze commits
            commits_data = self.analyze_commits()
            
            # Detect patterns
            patterns = self.detect_patterns(commits_data)
            
            # Get top contributors
            top_contributors = self.get_top_contributors(commits_data)
            
            # Calculate active period
            if commits_data['first_commit_date'] and commits_data['last_commit_date']:
                first = datetime.fromisoformat(commits_data['first_commit_date'])
                last = datetime.fromisoformat(commits_data['last_commit_date'])
                active_months = ((last - first).days / 30)
            else:
                active_months = 0
            
            # Build final result
            result = {
                "repo_url": self.repo_url,
                "repo_name": self.repo_name,
                "total_commits": commits_data['total_commits'],
                "contributors_count": commits_data['contributors_count'],
                "contributors": commits_data['contributors'],
                "first_commit_date": commits_data['first_commit_date'],
                "last_commit_date": commits_data['last_commit_date'],
                "active_period_months": round(active_months, 1),
                "patterns_detected": patterns,
                "commits_by_month": commits_data['commits_by_month'],
                "top_contributors": top_contributors,
                "commits_timeline": commits_data['commits'][:50]  # First 50 commits for timeline
            }
            
            return result
        
        finally:
            self.cleanup()