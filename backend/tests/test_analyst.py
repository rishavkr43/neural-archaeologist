from app.agents.scout import ScoutAgent
from app.agents.analyst import AnalystAgent


def progress_callback(agent_name, message, data=None):
    """Print progress messages"""
    print(f"[{agent_name.upper()}] {message}")
    if data:
        print(f"  Data: {data}")


print("=" * 60)
print("Testing Scout + Analyst Pipeline")
print("=" * 60)

# Step 1: Scout investigation
print("\n--- PHASE 1: SCOUT INVESTIGATION ---\n")
scout = ScoutAgent(progress_callback=progress_callback)
scout_data = scout.investigate(
    repo_url="https://github.com/uber/pyflame",
    include_web_search=True
)

# Step 2: Analyst analysis
print("\n--- PHASE 2: ANALYST ANALYSIS ---\n")
analyst = AnalystAgent(progress_callback=progress_callback)
analysis = analyst.analyze(scout_data)

# Display results
print("\n" + "=" * 60)
print("FINAL ANALYSIS:")
print("=" * 60)
print(f"\nHypothesis: {analysis['hypothesis']}")
print(f"Confidence: {analysis['confidence']}%")
print(f"Evidence Quality: {analysis.get('evidence_quality', 'N/A')}")
print(f"Likely Cause: {analysis.get('likely_cause', 'N/A')}")
print(f"Needs More Evidence: {analysis.get('needs_more_evidence', False)}")

print("\nReasoning:")
for i, reason in enumerate(analysis.get('reasoning', []), 1):
    print(f"  {i}. {reason}")

print("\nKey Findings:")
for i, finding in enumerate(analysis.get('key_findings', []), 1):
    print(f"  {i}. {finding}")