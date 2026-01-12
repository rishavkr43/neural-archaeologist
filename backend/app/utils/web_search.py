from serpapi import GoogleSearch
from app.config import settings
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
import time


class WebSearcher:
    """Search the web and scrape content for context about repositories"""
    
    def __init__(self):
        self.api_key = settings.SERPAPI_API_KEY
    
    def scrape_article(self, url: str) -> str:
        """Scrape full content from a URL"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(['script', 'style', 'nav', 'footer', 'header']):
                script.decompose()
            
            # Try to find main content area
            content = None
            
            # Common content selectors
            content_selectors = [
                'article',
                '[class*="post-content"]',
                '[class*="article-content"]',
                '[class*="entry-content"]',
                '[class*="blog-content"]',
                'main',
                '[role="main"]'
            ]
            
            for selector in content_selectors:
                content = soup.select_one(selector)
                if content:
                    break
            
            # Fallback to body if no content area found
            if not content:
                content = soup.body
            
            if content:
                # Extract text from paragraphs
                paragraphs = content.find_all(['p', 'h1', 'h2', 'h3'])
                text = '\n\n'.join([p.get_text().strip() for p in paragraphs if p.get_text().strip()])
                
                # Limit to first 3000 characters for LLM processing
                return text[:3000] if text else ""
            
            return ""
        
        except Exception as e:
            print(f"Scraping error for {url}: {e}")
            return ""
    
    def search(self, query: str, num_results: int = 5) -> List[Dict]:
        """Search using SerpAPI and scrape full content"""
        try:
            params = {
                "q": query,
                "api_key": self.api_key,
                "num": num_results
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            # Extract organic results
            organic_results = results.get("organic_results", [])
            
            formatted_results = []
            for result in organic_results:
                url = result.get("link", "")
                
                # Scrape full content
                full_content = ""
                if url:
                    print(f"Scraping: {url}")
                    full_content = self.scrape_article(url)
                    time.sleep(1)  # Be polite, wait between requests
                
                formatted_results.append({
                    "title": result.get("title", ""),
                    "link": url,
                    "snippet": result.get("snippet", ""),
                    "source": result.get("source", ""),
                    "full_content": full_content  # NEW: Full scraped content
                })
            
            return formatted_results
        
        except Exception as e:
            print(f"Web search error: {e}")
            return []
    
    def search_repo_context(self, repo_name: str, owner: str = None) -> Dict:
        """Search for context about a specific repository"""
        results = {}
        
        # Search 1: Abandoned/deprecated
        query1 = f"{repo_name} abandoned deprecated"
        print(f"Searching: {query1}")
        results['abandonment_info'] = self.search(query1, num_results=2)  # Reduced to 2 for speed
        
        # Search 2: Migration/replacement (only if owner provided)
        if owner:
            query2 = f"{owner} {repo_name} migration"
            print(f"Searching: {query2}")
            results['migration_info'] = self.search(query2, num_results=2)
        
        return results