from app.agents.scout import ScoutAgent
from app.agents.analyst import AnalystAgent
from app.agents.narrator import NarratorAgent
import json


def progress_callback(agent_name, message, data=None):
    """Print progress messages"""
    print(f"[{agent_name.upper()}] {message}")


print("=" * 70)
print("COMPLETE MULTI-AGENT PIPELINE TEST")
print("=" * 70)

# Phase 1: Scout
print("\n" + "="*70)
print("PHASE 1: SCOUT INVESTIGATION")
print("="*70 + "\n")

scout = ScoutAgent(progress_callback=progress_callback)
scout_data = scout.investigate(
    repo_url="https://github.com/uber/pyflame",
    include_web_search=True
)

# Phase 2: Analyst
print("\n" + "="*70)
print("PHASE 2: ANALYST EVALUATION")
print("="*70 + "\n")

analyst = AnalystAgent(progress_callback=progress_callback)
analysis = analyst.analyze(scout_data)

print(f"\n✓ Hypothesis: {analysis['hypothesis']}")
print(f"✓ Confidence: {analysis['confidence']}%")

# Phase 3: Narrator
print("\n" + "="*70)
print("PHASE 3: NARRATIVE GENERATION")
print("="*70 + "\n")

narrator = NarratorAgent(progress_callback=progress_callback)
report = narrator.generate_report(scout_data, analysis)

# Display Final Report
print("\n" + "="*70)
print("FINAL ARCHAEOLOGICAL REPORT")
print("="*70 + "\n")

print("## EXECUTIVE SUMMARY")
print(f"Repository: {report['executive_summary']['repo_name']}")
print(f"Status: {report['executive_summary']['status']}")
print(f"Confidence: {report['executive_summary']['confidence']}%")
print(f"Total Commits: {report['executive_summary']['total_commits']}")
print(f"Active Period: {report['executive_summary']['active_months']:.1f} months")

print("\n## TIMELINE")
for event in report['timeline']:
    print(f"  • {event['date'][:10]} - {event['event']}: {event['description']}")

print("\n## NARRATIVE PREVIEW (First 500 chars)")
print(report['narrative'][:500] + "...")

print("\n" + "="*70)
print("✅ COMPLETE PIPELINE SUCCESS!")
print("="*70)

# Save full report to file
with open('full_report.md', 'w', encoding='utf-8') as f:
    f.write(f"# Archaeological Report: {report['executive_summary']['repo_name']}\n\n")
    f.write("## Executive Summary\n\n")
    f.write(f"- **Repository:** {report['executive_summary']['repo_url']}\n")
    f.write(f"- **Status:** {report['executive_summary']['status']}\n")
    f.write(f"- **Confidence:** {report['executive_summary']['confidence']}%\n")
    f.write(f"- **Total Commits:** {report['executive_summary']['total_commits']}\n")
    f.write(f"- **Contributors:** {report['executive_summary']['contributors']}\n\n")
    f.write("## Timeline\n\n")
    for event in report['timeline']:
        f.write(f"- **{event['date'][:10]}** - {event['event']}: {event['description']}\n")
    f.write("\n## Full Narrative\n\n")
    f.write(report['narrative'])
    f.write("\n\n## Top Contributors\n\n")
    f.write(report['contributor_profiles'])

print("\n📄 Full report saved to: full_report.md")