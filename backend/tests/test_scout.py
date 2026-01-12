from app.agents.scout import ScoutAgent


def progress_callback(agent_name, message, data=None):
    """Print progress messages"""
    print(f"[{agent_name.upper()}] {message}")
    if data:
        print(f"  Data: {data}")


# Test with uber/pyflame repository
print("=" * 60)
print("Testing Scout Agent")
print("=" * 60)

scout = ScoutAgent(progress_callback=progress_callback)

try:
    result = scout.investigate(
        repo_url="https://github.com/uber/pyflame",
        include_web_search=True
    )
    
    print("\n" + "=" * 60)
    print("RESULTS:")
    print("=" * 60)
    print(f"Total Commits: {result['total_commits']}")
    print(f"Contributors: {result['contributors_count']}")
    print(f"First Commit: {result['first_commit_date']}")
    print(f"Last Commit: {result['last_commit_date']}")
    print(f"Active Period: {result['active_period_months']} months")
    print(f"\nPatterns Detected: {list(result['patterns_detected'].keys())}")
    print(f"Web Results Found: {sum(len(v) for v in result['web_search_results'].values())} sources")
    
except Exception as e:
    print(f"\nERROR: {e}")