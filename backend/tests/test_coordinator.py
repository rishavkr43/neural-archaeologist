from app.agents.coordinator import Coordinator


def progress_callback(agent_name, message, data=None):
    """Print progress messages"""
    print(f"[{agent_name.upper()}] {message}")
    if data:
        print(f"  → {data}")


print("=" * 70)
print("TESTING LANGGRAPH COORDINATOR")
print("=" * 70)

# Create coordinator
coordinator = Coordinator(progress_callback=progress_callback)

# Run investigation
print("\n🚀 Starting investigation...\n")

result = coordinator.investigate(
    repo_url="https://github.com/uber/pyflame",
    max_rounds=3
)

# Display results
print("\n" + "=" * 70)
print("INVESTIGATION RESULTS")
print("=" * 70)

print(f"\n✓ Final Confidence: {result['confidence']}%")
print(f"✓ Rounds Taken: {result['rounds_taken']}")
print(f"✓ Web Search Performed: {result['web_search_performed']}")
print(f"✓ Hypothesis: {result['analysis']['hypothesis'][:100]}...")

print("\n" + "=" * 70)
print("EXECUTIVE SUMMARY")
print("=" * 70)

summary = result['report']['executive_summary']
print(f"Repository: {summary['repo_name']}")
print(f"Status: {summary['status']}")
print(f"Total Commits: {summary['total_commits']}")
print(f"Contributors: {summary['contributors']}")
print(f"Active Period: {summary['active_months']:.1f} months")

print("\n" + "=" * 70)
print("INVESTIGATION FLOW")
print("=" * 70)

if result['web_search_performed']:
    print("✓ Round 1: Scout (git only) → Analyst → Confidence low")
    print("✓ Round 2: Scout (with web) → Analyst → Confidence high")
    print("✓ Round 3: Narrator → Report generated")
else:
    print("✓ Round 1: Scout (git only) → Analyst → Confidence sufficient")
    print("✓ Round 2: Narrator → Report generated")

print("\n✅ LANGGRAPH COORDINATION SUCCESS!")