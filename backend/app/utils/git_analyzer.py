import os
import shutil
import requests
from datetime import datetime
from collections import defaultdict
from git import Repo, GitCommandError
from typing import Dict, List, Optional
import tempfile


from app.config import settings

class GitAnalyzer:
    """Analyzes git repositories and extracts commit history"""
    
    def __init__(self, repo_url: str):
        self.repo_url = repo_url
        # Extract owner and repo name from URL
        parts = repo_url.rstrip('/').replace('.git', '').split('/')
        self.repo_name = parts[-1]
        self.repo_owner = parts[-2] if len(parts) >= 2 else None
        self.temp_dir = None
        self.repo = None
        self.github_token = settings.GITHUB_TOKEN
        self._github_headers = self._build_github_headers()
    
    def _build_github_headers(self) -> Dict:
        """Build headers for GitHub API requests"""
        headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'NeuralArchaeologist'
        }
        if self.github_token:
            headers['Authorization'] = f'token {self.github_token}'
        return headers
    
    def fetch_github_repo_data(self) -> Optional[Dict]:
        """Fetch comprehensive repository metadata from GitHub API"""
        if not self.repo_owner or not self.repo_name:
            return None
        
        try:
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}"
            response = requests.get(url, headers=self._github_headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "stars": data.get('stargazers_count', 0),
                    "forks": data.get('forks_count', 0),
                    "watchers": data.get('subscribers_count', 0),
                    "open_issues": data.get('open_issues_count', 0),
                    "description": data.get('description', ''),
                    "topics": data.get('topics', []),
                    "license": data.get('license', {}).get('name') if data.get('license') else None,
                    "homepage": data.get('homepage', ''),
                    "is_fork": data.get('fork', False),
                    "parent_repo": data.get('parent', {}).get('full_name') if data.get('parent') else None,
                    "default_branch": data.get('default_branch', 'main'),
                    "created_at": data.get('created_at'),
                    "updated_at": data.get('updated_at'),
                    "pushed_at": data.get('pushed_at'),
                    "size_kb": data.get('size', 0),
                    "is_archived": data.get('archived', False),
                    "is_disabled": data.get('disabled', False),
                    "has_wiki": data.get('has_wiki', False),
                    "has_pages": data.get('has_pages', False),
                    "has_discussions": data.get('has_discussions', False),
                }
            return None
        except Exception as e:
            print(f"GitHub repo API error: {e}")
            return None
    
    def fetch_github_languages(self) -> Optional[Dict]:
        """Fetch language breakdown from GitHub API"""
        if not self.repo_owner or not self.repo_name:
            return None
        
        try:
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/languages"
            response = requests.get(url, headers=self._github_headers)
            
            if response.status_code == 200:
                languages = response.json()
                total_bytes = sum(languages.values())
                if total_bytes > 0:
                    return {
                        "breakdown": {lang: round(bytes_count / total_bytes * 100, 1) 
                                     for lang, bytes_count in languages.items()},
                        "primary_language": max(languages.items(), key=lambda x: x[1])[0] if languages else None,
                        "total_bytes": total_bytes
                    }
            return None
        except Exception as e:
            print(f"GitHub languages API error: {e}")
            return None
    
    def fetch_github_releases(self) -> Optional[List[Dict]]:
        """Fetch recent releases from GitHub API"""
        if not self.repo_owner or not self.repo_name:
            return None
        
        try:
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/releases"
            params = {'per_page': 10}
            response = requests.get(url, headers=self._github_headers, params=params)
            
            if response.status_code == 200:
                releases = response.json()
                return [{
                    "tag": r.get('tag_name'),
                    "name": r.get('name'),
                    "published_at": r.get('published_at'),
                    "is_prerelease": r.get('prerelease', False),
                    "download_count": sum(a.get('download_count', 0) for a in r.get('assets', []))
                } for r in releases[:10]]
            return None
        except Exception as e:
            print(f"GitHub releases API error: {e}")
            return None
    
    def fetch_github_contributors(self, limit: int = 10) -> Optional[List[Dict]]:
        """Fetch top contributors with profile data from GitHub API"""
        if not self.repo_owner or not self.repo_name:
            return None
        
        try:
            import re
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/contributors"
            
            # First get total count via Link header
            params = {'per_page': 1, 'anon': 'false'}
            response = requests.get(url, headers=self._github_headers, params=params)
            
            total_count = None
            if response.status_code == 200:
                link_header = response.headers.get('Link', '')
                if 'rel="last"' in link_header:
                    match = re.search(r'page=(\d+)>; rel="last"', link_header)
                    if match:
                        total_count = int(match.group(1))
                else:
                    # Small repo, fetch all
                    params['per_page'] = 100
                    response = requests.get(url, headers=self._github_headers, params=params)
                    if response.status_code == 200:
                        total_count = len(response.json())
            
            # Now get top contributors with details
            params = {'per_page': limit, 'anon': 'false'}
            response = requests.get(url, headers=self._github_headers, params=params)
            
            if response.status_code == 200:
                contributors = response.json()
                return {
                    "total_count": total_count,
                    "top_contributors": [{
                        "username": c.get('login'),
                        "avatar_url": c.get('avatar_url'),
                        "profile_url": c.get('html_url'),
                        "contributions": c.get('contributions', 0),
                        "type": c.get('type', 'User')  # User or Bot
                    } for c in contributors if c.get('type') != 'Bot'][:limit]
                }
            return None
        except Exception as e:
            print(f"GitHub contributors API error: {e}")
            return None
    
    def fetch_github_community_health(self) -> Optional[Dict]:
        """Fetch community health metrics from GitHub API"""
        if not self.repo_owner or not self.repo_name:
            return None
        
        try:
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/community/profile"
            headers = {**self._github_headers, 'Accept': 'application/vnd.github.v3+json'}
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "health_percentage": data.get('health_percentage', 0),
                    "has_readme": data.get('files', {}).get('readme') is not None,
                    "has_license": data.get('files', {}).get('license') is not None,
                    "has_contributing": data.get('files', {}).get('contributing') is not None,
                    "has_code_of_conduct": data.get('files', {}).get('code_of_conduct') is not None,
                    "has_issue_template": data.get('files', {}).get('issue_template') is not None,
                    "has_pull_request_template": data.get('files', {}).get('pull_request_template') is not None,
                }
            return None
        except Exception as e:
            print(f"GitHub community API error: {e}")
            return None
    
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
        contributors_by_email = {}  # email -> name mapping for deduplication
        commits_by_month = defaultdict(int)
        
        # Bot patterns - more precise to avoid filtering legitimate users
        # Note: users@noreply.github.com are legitimate privacy-conscious users
        bot_patterns = [
            '[bot]',           # GitHub bot indicator
            'github-actions',  # CI/CD bot
            'dependabot',      # Dependency bot
            'renovate',        # Dependency bot
            'greenkeeper',     # Dependency bot
            'semantic-release' # Release bot
        ]
        
        # Iterate through all commits
        for commit in self.repo.iter_commits():
            commit_date = datetime.fromtimestamp(commit.committed_date)
            author_name = commit.author.name
            author_email = commit.author.email.lower() if commit.author.email else 'unknown'
            
            commits_data.append({
                "hash": commit.hexsha[:7],
                "author": author_name,
                "email": author_email,
                "date": commit_date.isoformat(),
                "message": commit.message.strip()
            })
            
            # Deduplicate by email (like GitHub does)
            # But skip bots for contributor count
            is_bot = any(pattern in author_email or pattern in author_name.lower() for pattern in bot_patterns)
            if not is_bot:
                # Store name with most commits for this email
                if author_email not in contributors_by_email:
                    contributors_by_email[author_email] = author_name
            
            month_key = commit_date.strftime("%Y-%m")
            commits_by_month[month_key] += 1
        
        # Sort commits by date (oldest first)
        commits_data.sort(key=lambda x: x['date'])
        
        return {
            "total_commits": len(commits_data),
            "commits": commits_data,
            "contributors": list(contributors_by_email.values()),
            "contributors_count": len(contributors_by_email),
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
        """Get top contributors by commit count (email-based deduplication)"""
        contributor_commits = defaultdict(lambda: {'count': 0, 'name': ''})
        bot_patterns = ['[bot]', 'github-actions', 'dependabot', 'renovate', 'greenkeeper', 'semantic-release']
        
        for commit in commits_data.get('commits', []):
            email = commit.get('email', commit['author'].lower())
            name = commit['author']
            
            # Skip bots
            is_bot = any(pattern in email or pattern in name.lower() for pattern in bot_patterns)
            if is_bot:
                continue
            
            contributor_commits[email]['count'] += 1
            # Keep the most common name variant
            if not contributor_commits[email]['name']:
                contributor_commits[email]['name'] = name
        
        # Sort by commit count
        sorted_contributors = sorted(
            contributor_commits.items(),
            key=lambda x: x[1]['count'],
            reverse=True
        )[:top_n]
        
        return [
            {
                "name": data['name'],
                "commit_count": data['count'],
                "percentage": round((data['count'] / commits_data['total_commits']) * 100, 1)
            }
            for email, data in sorted_contributors
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
            
            # Get top contributors from git analysis
            git_top_contributors = self.get_top_contributors(commits_data)
            
            # Calculate active period
            if commits_data['first_commit_date'] and commits_data['last_commit_date']:
                first = datetime.fromisoformat(commits_data['first_commit_date'])
                last = datetime.fromisoformat(commits_data['last_commit_date'])
                active_months = ((last - first).days / 30)
            else:
                active_months = 0
            
            # Fetch all GitHub API data
            github_repo = self.fetch_github_repo_data()
            github_contributors = self.fetch_github_contributors(limit=10)
            github_languages = self.fetch_github_languages()
            github_releases = self.fetch_github_releases()
            github_community = self.fetch_github_community_health()
            
            # Use GitHub API contributor count if available, else fall back to git
            contributors_count = (
                github_contributors['total_count'] 
                if github_contributors and github_contributors.get('total_count') 
                else commits_data['contributors_count']
            )
            
            # Merge top contributors (prefer GitHub API data for avatars)
            top_contributors = (
                github_contributors['top_contributors'] 
                if github_contributors and github_contributors.get('top_contributors')
                else git_top_contributors
            )
            
            # Build final result with all enriched data
            result = {
                "repo_url": self.repo_url,
                "repo_name": self.repo_name,
                "repo_owner": self.repo_owner,
                "total_commits": commits_data['total_commits'],
                "contributors_count": contributors_count,
                "contributors_count_source": "github_api" if github_contributors else "git_analysis",
                "contributors": commits_data['contributors'],
                "first_commit_date": commits_data['first_commit_date'],
                "last_commit_date": commits_data['last_commit_date'],
                "active_period_months": round(active_months, 1),
                "patterns_detected": patterns,
                "commits_by_month": commits_data['commits_by_month'],
                "top_contributors": top_contributors,
                "commits_timeline": commits_data['commits'][:50],
                
                # GitHub enriched data
                "github_data": {
                    "available": github_repo is not None,
                    "repo_info": github_repo,
                    "languages": github_languages,
                    "releases": github_releases,
                    "community_health": github_community,
                }
            }
            
            return result
        
        finally:
            self.cleanup()