#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Build ORCA — Marine EcOsystem Reasoning with Collaborative Agents (ISRO PS-26176). Pixel-perfect mobile prototype from provided HTML design + PDF spec. Full-stack: FastAPI + MongoDB with tool-grounded multi-agent query pipeline, deterministic risk engine, trip/alert/community/emergency systems and demo simulation engine."

backend:
  - task: "Health + conditions + demo scenario state"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/health, GET /api/conditions?scenario=, POST /api/demo/scenario persist scenario in app_state. Verify scenario switching returns correct level/wind/waves."
  - task: "Agent query pipeline + deterministic risk engine"
    implemented: true
    working: "NA"
    file: "backend/agents.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/query runs orchestrator->agents->evidence(conflict resolve)->deterministic risk. Verify GREEN scenario safety query => GREEN risk-card, RED => RED, hindi text => langTag 'हिंदी detected', cyclone intent => WARNING answer. Also GET /api/risk (dialOffset), /api/trace, /api/evidence."
  - task: "Plan, alerts (scenario-aware), trip active + end + history"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET /api/plan (7 days), GET /api/alerts?scenario (RED adds CRITICAL), GET /api/trip/active, POST /api/trip/end (adds history + summary), GET /api/trips."
  - task: "Community posts + poll voting (persistence)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET/POST /api/community/posts, POST helpful (idempotent), GET /api/community/poll (pct+meta), POST vote (single-vote guard). Verify persistence across calls."
  - task: "Emergency SOS status machine + rescue"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "POST /api/emergency/sos creates HELP_REQUESTED + sets scenario RED, GET /api/emergency/{id}, /rescue, POST /cancel. Verify create->get->cancel flow and rescue payload."
  - task: "Profile get/update + data sources"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "GET/PUT /api/profile (demo-user upsert), GET /api/data-sources."

frontend:
  - task: "Full ORCA prototype UI (21 screens + 12 sheets) wired to backend"
    implemented: true
    working: "NA"
    file: "frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Frontend verified visually via screenshots (onboarding, home, chat w/ agent trace anim, risk, trace, map, trip, community poll voting, SOS hold->emergency->rescue, geofence, demo panel, evidence sheet). Backend wired with mock fallback. Frontend automated testing NOT run yet — awaiting user permission."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Agent query pipeline + deterministic risk engine"
    - "Emergency SOS status machine + rescue"
    - "Community posts + poll voting (persistence)"
    - "Plan, alerts (scenario-aware), trip active + end + history"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Backend implemented per spec (deterministic risk engine, tool-grounded agent pipeline, no LLM used — grounded responses only). All data seeded on startup. Please test all /api endpoints. Note demo scenario is global state in app_state collection; some endpoints accept ?scenario= override. Verify risk levels change with scenario (GREEN/YELLOW/ORANGE/RED)."
