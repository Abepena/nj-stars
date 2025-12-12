# Full-Stack Integration Audit Master Prompt

## Purpose
This prompt guides Claude Code to perform a comprehensive audit of frontend components against backend models, API routes, and CMS configuration to identify gaps, missing integrations, and produce a production-readiness report.

## Usage
Copy and paste this prompt to Claude Code when you need a full-stack integration audit.

---

## MASTER PROMPT

```
Perform a comprehensive full-stack integration audit for this project. Your goal is to identify all gaps between frontend components and backend capabilities, producing a visual HTML audit report and an implementation checklist.

## AUDIT SCOPE

### 1. Frontend Component Analysis
Scan all frontend components and pages:
- `frontend/src/app/` - All page routes and layouts
- `frontend/src/components/` - All React components
- `frontend/src/lib/` - API clients, utilities, hooks
- `frontend/src/hooks/` - Custom React hooks

For each component/page, identify:
- What data it expects (props, API responses)
- What API endpoints it calls
- What user actions trigger backend calls
- Any mock/placeholder data being used
- Any TODO comments or incomplete features

### 2. Backend Analysis
Scan all backend models and API routes:
- `backend/apps/*/models.py` - All Django models
- `backend/apps/*/views.py` - All API views
- `backend/apps/*/serializers.py` - All serializers
- `backend/apps/*/urls.py` - All URL routes
- `backend/apps/cms/models.py` - Wagtail CMS pages

For each endpoint, identify:
- What data it returns
- What authentication is required
- What query parameters it accepts
- Whether it's documented
- Whether it has tests

### 3. Integration Gap Analysis
Cross-reference frontend and backend to find:

**Category A - Frontend with No Backend:**
- Components using mock/hardcoded data
- Components calling non-existent endpoints
- Features with placeholder implementations

**Category B - Backend with No Frontend:**
- API endpoints not consumed by frontend
- Models with no corresponding UI
- CMS fields not displayed anywhere

**Category C - Partial Integration:**
- Endpoints called but responses not fully utilized
- Forms that submit but lack validation feedback
- Features missing error handling

**Category D - Missing Features:**
- Commented-out features
- TODO items
- Expected features not yet implemented

### 4. CMS Integration Check
For Wagtail CMS:
- Which page types exist vs. which have frontend templates
- Which StreamField blocks are defined vs. rendered
- Which CMS fields are exposed via API
- Admin panel customizations needed

## OUTPUT FORMAT

### Output 1: Visual HTML Audit Report
Create `documentation/audits/{title}_{MM-YY}__audit.html` with:

1. **Executive Summary Dashboard**
   - Total components audited
   - Integration health score (percentage)
   - Critical gaps count
   - Pie/bar charts for status distribution

2. **Component Integration Matrix**
   - Table: Component | API Endpoint | Status | Priority | Notes
   - Color-coded: Green (complete), Yellow (partial), Red (missing), Gray (N/A)

3. **API Coverage Map**
   - Visual representation of all endpoints
   - Which are consumed, which are orphaned

4. **Feature Status Cards**
   - Each major feature as a card
   - Shows frontend status, backend status, integration status

5. **CMS Integration Grid**
   - Page types and their field coverage
   - StreamField block rendering status

Use modern CSS (flexbox/grid), dark theme option, collapsible sections, and make it print-friendly.

### Output 2: Implementation Checklist
Create `documentation/audits/{title}_{MM-YY}__AUDIT_IMPLEMENTATION.md` with:

```markdown
# Full-Stack Integration Implementation Checklist
Generated: {date}

## Priority Legend
- 🔴 P0 - Critical: Blocking production launch
- 🟠 P1 - High: Core functionality gaps
- 🟡 P2 - Medium: Important but has workarounds
- 🟢 P3 - Low: Nice to have, can defer

## Integration Tasks

### Section 1: Frontend Components Needing Backend
| Component | Missing Backend | Priority | Estimated Effort |
|-----------|-----------------|----------|------------------|
| ... | ... | ... | ... |

#### Detailed Tasks
- [ ] **P0** ComponentName: Description of work needed
  - Backend: Create model/endpoint
  - Frontend: Connect to new endpoint
  - Files: list affected files

### Section 2: Backend Endpoints Needing Frontend
...

### Section 3: Partial Integrations to Complete
...

### Section 4: CMS Configuration Needed
...

### Section 5: Missing Feature Implementations
...

## Recommended Implementation Order
1. Phase 1 (Week 1): Critical P0 items
2. Phase 2 (Week 2): High priority P1 items
3. Phase 3 (Week 3-4): Medium priority P2 items
4. Backlog: P3 items for future sprints

## Testing Checklist
- [ ] All new endpoints have tests
- [ ] All integrations have E2E tests
- [ ] Error states are handled
- [ ] Loading states are implemented
```

## EXECUTION STEPS

1. First, scan all frontend files and create a component inventory
2. Then, scan all backend files and create an API inventory
3. Cross-reference to find gaps
4. Generate the HTML audit file
5. Generate the implementation checklist
6. Provide a summary of findings

Begin the audit now.
```

---

## Notes for Future Use
- Run this audit before major releases
- Run after significant feature additions
- Use the implementation checklist for sprint planning
- Update audit quarterly or when architecture changes
