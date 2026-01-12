from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, END
from app.agents.scout import ScoutAgent
from app.agents.analyst import AnalystAgent
from app.agents.narrator import NarratorAgent


class InvestigationState(TypedDict):
    """State that flows through the investigation"""
    repo_url: str
    scout_data: dict
    analysis: dict
    report: dict
    confidence: int
    needs_web_search: bool
    web_search_done: bool
    current_round: int
    max_rounds: int
    messages: list


class Coordinator:
    """Coordinator orchestrates multi-agent investigation using LangGraph"""
    
    def __init__(self, progress_callback=None):
        self.progress_callback = progress_callback
        self.scout = ScoutAgent(progress_callback)
        self.analyst = AnalystAgent(progress_callback)
        self.narrator = NarratorAgent(progress_callback)
        
        # Build LangGraph workflow
        self.workflow = self.build_workflow()
    
    def emit_progress(self, message: str, data: dict = None):
        """Emit coordinator progress"""
        if self.progress_callback:
            self.progress_callback("coordinator", message, data or {})
    
    def scout_node(self, state: InvestigationState) -> InvestigationState:
        """Scout agent node - gathers data"""
        self.emit_progress("Routing to Scout Agent")
        
        # Determine if we should do web search
        do_web_search = state.get('needs_web_search', False) and not state.get('web_search_done', False)
        
        if do_web_search:
            self.emit_progress("Scout performing web search for additional evidence")
        else:
            self.emit_progress("Scout analyzing git repository")
        
        # Run scout
        scout_data = self.scout.investigate(
            repo_url=state['repo_url'],
            include_web_search=do_web_search
        )
        
        # Update state
        state['scout_data'] = scout_data
        state['current_round'] = state.get('current_round', 0) + 1
        
        if do_web_search:
            state['web_search_done'] = True
        
        return state
    
    def analyst_node(self, state: InvestigationState) -> InvestigationState:
        """Analyst agent node - analyzes patterns"""
        self.emit_progress("Routing to Analyst Agent")
        
        # Run analyst
        analysis = self.analyst.analyze(
            scout_data=state['scout_data'],
            previous_analysis=state.get('analysis')
        )
        
        # Update state
        state['analysis'] = analysis
        state['confidence'] = analysis['confidence']
        
        # Determine if we need more evidence
        if analysis['confidence'] < 70 and not state.get('web_search_done', False):
            state['needs_web_search'] = True
            self.emit_progress(
                f"Confidence {analysis['confidence']}% is below threshold (70%)",
                {"decision": "request_more_evidence"}
            )
        else:
            state['needs_web_search'] = False
            if analysis['confidence'] >= 70:
                self.emit_progress(
                    f"Confidence {analysis['confidence']}% meets threshold",
                    {"decision": "proceed_to_report"}
                )
        
        return state
    
    def narrator_node(self, state: InvestigationState) -> InvestigationState:
        """Narrator agent node - generates report"""
        self.emit_progress("Routing to Narrator Agent")
        
        # Run narrator
        report = self.narrator.generate_report(
            scout_data=state['scout_data'],
            analysis=state['analysis']
        )
        
        # Update state
        state['report'] = report
        
        return state
    
    def should_gather_more_evidence(self, state: InvestigationState) -> Literal["scout", "narrator"]:
        """Decide whether to gather more evidence or proceed to report"""
        
        # Check if we've hit max rounds
        if state.get('current_round', 0) >= state.get('max_rounds', 3):
            self.emit_progress("Max rounds reached, proceeding to report generation")
            return "narrator"
        
        # Check if we need web search and haven't done it yet
        if state.get('needs_web_search', False) and not state.get('web_search_done', False):
            self.emit_progress("Decision: Gather more evidence from web")
            return "scout"
        
        # Otherwise proceed to narrator
        self.emit_progress("Decision: Sufficient evidence, generating report")
        return "narrator"
    
    def build_workflow(self) -> StateGraph:
        """Build LangGraph workflow"""
        
        # Create graph
        workflow = StateGraph(InvestigationState)
        
        # Add nodes
        workflow.add_node("scout", self.scout_node)
        workflow.add_node("analyst", self.analyst_node)
        workflow.add_node("narrator", self.narrator_node)
        
        # Set entry point
        workflow.set_entry_point("scout")
        
        # Add edges
        workflow.add_edge("scout", "analyst")
        
        # Conditional edge from analyst
        workflow.add_conditional_edges(
            "analyst",
            self.should_gather_more_evidence,
            {
                "scout": "scout",      # Loop back for more evidence
                "narrator": "narrator"  # Proceed to report
            }
        )
        
        # End after narrator
        workflow.add_edge("narrator", END)
        
        # Compile
        return workflow.compile()
    
    def investigate(self, repo_url: str, max_rounds: int = 3) -> dict:
        """Run complete investigation"""
        
        self.emit_progress("Investigation started")
        self.emit_progress(f"Repository: {repo_url}")
        
        # Initialize state
        initial_state: InvestigationState = {
            "repo_url": repo_url,
            "scout_data": {},
            "analysis": {},
            "report": {},
            "confidence": 0,
            "needs_web_search": False,
            "web_search_done": False,
            "current_round": 0,
            "max_rounds": max_rounds,
            "messages": []
        }
        
        # Run workflow
        final_state = self.workflow.invoke(initial_state)
        
        self.emit_progress("Investigation complete!")
        
        # Return comprehensive result
        return {
            "report": final_state.get('report', {}),
            "confidence": final_state.get('confidence', 0),
            "rounds_taken": final_state.get('current_round', 0),
            "web_search_performed": final_state.get('web_search_done', False),
            "analysis": final_state.get('analysis', {}),
            "scout_data": final_state.get('scout_data', {})
        }