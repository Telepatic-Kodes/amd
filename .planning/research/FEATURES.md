# Feature Landscape: v2.0 UX/UI Excellence

**Domain:** AI Marketing Dashboard with Multi-Agent Operations
**Researched:** 2026-02-05
**Context:** Subsequent milestone adding Control Center, Content Pipeline, LinkedIn Integration, and Guided UX to existing v1.0 foundation
**Confidence:** MEDIUM (WebSearch verified with multiple sources, patterns validated across 2026 best practices)

---

## Executive Summary

This research examines best-in-class implementations of four feature categories for v2.0: Control Center dashboards for multi-agent systems, content publishing pipelines, LinkedIn API integration, and guided UX/wizard systems. These features address AMD's core problem: 37 AI agents across 6 departments with non-technical users struggling to understand agent activity, next steps, and content publication paths.

**Key insight:** The 2026 landscape shows convergence around "progressive disclosure with human-in-the-loop" patterns. Best-in-class products don't show everything at once—they reveal complexity gradually, provide clear next actions, and escalate edge cases to humans while automating routine decisions.

---

## Table Stakes Features

Features users expect. Missing = product feels incomplete.

### 1. Control Center / Mission Control Dashboard

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| **Real-time agent status display** | Users need to see "what's happening now" across all agents | Medium | Existing agent execution data |
| **Agent activity feed/log** | Chronological event stream is standard in operations dashboards | Low | Execution logs with timestamps |
| **Agent roster with roles** | Users expect to see "who does what" at a glance | Low | Agent metadata (name, role, capacity) |
| **Global task queue** | Kanban-like view of pending/active/completed tasks is table stakes | Medium | Task state tracking |
| **Role-based access control** | Multi-department setup requires permission boundaries | High | User authentication system |
| **Responsive layout** | Mobile/tablet access expected for monitoring on-the-go | Medium | Existing mobile foundation |

**Sources:**
- [Multi-Agent Design Patterns (InfoQ, 2026)](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)
- [DevOps Dashboard Guide (CloudZero)](https://www.cloudzero.com/blog/devops-dashboard/)
- [Mission Control Dashboard UX (Medium)](https://medium.com/grace-kwan/case-study-mission-control-d410e562ec0e)

### 2. Content Publishing Pipeline

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| **Draft/Review/Approved/Published states** | Industry-standard 4-state minimum for content workflows | Low | Content database with status field |
| **Content preview** | Users expect "what will this look like" before publishing | Medium | Existing content rendering |
| **Version history** | Rollback capability is table stakes for content systems | Medium | Content versioning schema |
| **Change tracking** | Teams need to see "who changed what when" | Low | Audit log with user attribution |
| **Edit locks** | Prevent concurrent editing conflicts (expected in collaboration tools) | Medium | Session management |
| **Publishing to draft location first** | Staging environment is standard practice | Low | Separate staging/production endpoints |

**Sources:**
- [Content Publishing Workflow (Activepieces)](https://www.activepieces.com/blog/content-publishing-workflow)
- [Content Workflow Guide 2026 (Planable)](https://planable.io/blog/content-workflow/)
- [Drafts & Publishing Workflow (Sanity)](https://www.sanity.io/glossary/drafts--publishing-workflow)

### 3. LinkedIn API Publishing

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| **OAuth 2.0 authentication** | LinkedIn requires OAuth 2.0; API keys alone not supported | High | OAuth flow implementation |
| **Text post publishing** | Core capability, minimum viable integration | Medium | LinkedIn Posts API |
| **Rate limit handling** | LinkedIn has strict limits; apps must handle 429 errors gracefully | Medium | Retry logic with exponential backoff |
| **Error feedback** | Users expect clear messages when posts fail (auth, rate limit, validation) | Low | Error handling UI |
| **Post scheduling** | Expected feature in all social publishing tools | High | Job queue system |
| **"Published via" attribution** | LinkedIn marks third-party posts; users need to understand this | Low | User education/documentation |

**Sources:**
- [LinkedIn Posts API (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-01)
- [LinkedIn API Rate Limits (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits)
- [Schedule LinkedIn Posts Guide 2026 (Buffer)](https://buffer.com/resources/how-to-schedule-linkedin-posts/)

### 4. Guided UX / Wizard Systems

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| **Progress indicator** | Users need to see "step X of Y" to build confidence | Low | Step tracking state |
| **Back/Next navigation** | Standard wizard pattern; users expect ability to review previous steps | Low | Navigation state management |
| **Step validation** | Prevent advancing with incomplete/invalid data | Medium | Form validation per step |
| **Linear step flow** | Simplest pattern (sequential steps, no branching initially) | Low | Step sequence definition |
| **3-5 steps maximum** | Research shows 10+ steps overwhelm users, 3-5 is sweet spot | N/A | Design constraint |
| **Clear step labels** | Users need to know what each step accomplishes | Low | Content writing |

**Sources:**
- [Wizard UI Pattern Best Practices (Eleken)](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained)
- [Wizards: Design Recommendations (NN/g)](https://www.nngroup.com/articles/wizards/)
- [Progressive Disclosure Examples (UserPilot)](https://userpilot.com/blog/progressive-disclosure-examples/)

---

## Differentiators

Features that set AMD apart. Not expected, but highly valued when present.

### 1. Control Center Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Interrupt/escalation controls** | "Human-in-the-loop" for edge cases—pause agent before critical actions | High | Requires agent integration points |
| **Agent performance metrics** | Show success rate, avg steps to resolution, cost-per-task | Medium | Analytics aggregation |
| **Predictive agent recommendations** | "Agent X is best for this task" based on historical data | High | ML model or heuristics |
| **Agent capacity visualization** | Real-time view of "who's busy, who's available" | Medium | Load balancing metrics |
| **Cross-department agent orchestration** | Coordinate agents from different departments for complex workflows | High | Inter-agent communication protocol |
| **Smart notifications** | Context-aware alerts (not everything, just what needs human attention) | Medium | Notification rules engine |

**Why differentiating:** Most multi-agent dashboards show status; few provide proactive recommendations or human intervention points. 2026 trend: "outcome-focused metrics" (did agent achieve the goal?) vs. just "task completed."

### 2. Content Pipeline Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI-powered workflow routing** | Content auto-routed to right reviewer based on type/topic | High | Rules engine or ML classification |
| **Parallel approval tracks** | Multiple reviewers can approve simultaneously (not sequential) | Medium | Approval state machine |
| **Conditional approval rules** | "Budget posts need CFO approval, others don't" | Medium | Rule configuration UI |
| **Bulk actions** | Approve/reject multiple items at once | Low | Multi-select UI pattern |
| **Smart deadline suggestions** | "Based on your schedule, publish Tuesday at 10am" | Medium | Calendar integration + heuristics |
| **Content performance predictions** | "This post will likely get X engagement" before publishing | High | ML model trained on historical data |

**Why differentiating:** Standard workflows are linear; smart routing and conditional rules adapt to organizational complexity without adding manual overhead.

### 3. LinkedIn Integration Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Optimal posting time recommendations** | Analyze user's network activity to suggest best post times | Medium | LinkedIn Analytics API + heuristics |
| **Hashtag suggestions** | Context-aware hashtag recommendations based on content | Medium | NLP + trending topics API |
| **Post performance tracking** | Show engagement metrics post-publish (likes, comments, shares) | High | LinkedIn Analytics API integration |
| **Multi-account management** | Publish to company page + personal profiles from one place | High | Multiple OAuth tokens per user |
| **Image optimization** | Auto-resize/compress images to LinkedIn's optimal specs | Low | Image processing library |
| **Post templates** | Pre-designed formats for common post types (announcement, article share, poll) | Low | Template library + variable substitution |

**Why differentiating:** Basic integrations publish posts; smart integrations optimize for engagement and reduce manual busywork.

### 4. Guided UX Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Contextual help tooltips** | Just-in-time explanations without cluttering the UI | Low | Tooltip component library |
| **Smart field pre-fill** | Wizard pre-populates fields based on user history or context | Medium | User preference storage |
| **Conditional step branching** | Show/hide steps based on previous answers | High | Dynamic wizard state machine |
| **Progress persistence** | "Pick up where you left off" if user abandons mid-wizard | Medium | Draft state storage |
| **Role-aware wizard flows** | Different steps for different user roles (manager vs. creator) | High | Role-based wizard configuration |
| **Outcome-driven messaging** | "You're creating a campaign that will reach 10K users" (not just "Step 2 of 5") | Low | Content writing + dynamic values |

**Why differentiating:** Basic wizards guide users through steps; smart wizards adapt to user context and reduce cognitive load through progressive disclosure.

---

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time collaboration (Google Docs style)** | High complexity, rarely needed for content workflows (not live editing use case) | Use edit locks + change notifications |
| **Custom workflow builder UI** | Users won't configure complex workflows; they want sensible defaults | Provide 2-3 pre-built workflow templates |
| **Video post support (LinkedIn)** | LinkedIn video API is complex, requires media upload handling, transcoding | Defer to post-MVP; focus on text + images first |
| **Agent creation/editing from Control Center** | Scope creep—Control Center is for monitoring, not configuration | Keep agent management separate |
| **Infinite scroll for agent logs** | Performance killer with large datasets, hard to navigate | Use pagination with "load more" |
| **Traffic light colors for non-status data** | Users instinctively read red as "error" even if just a data point | Reserve red/yellow/green for actual status indicators |
| **Everything-on-one-screen dashboard** | Information overload; cognitive burden too high | Use tabbed interface or drill-down pattern |
| **Perfect symmetry in dashboard layout** | Looks minimalist but eliminates visual hierarchy—users don't know where to look | Use size, color, position to create priority hierarchy |
| **Automatic post publishing (no human approval)** | Too risky for brand reputation; users expect final control | Always require explicit "publish" action |
| **10+ step wizards** | Completion rates drop dramatically; users feel overwhelmed | Break into multiple shorter wizards or reduce steps to 3-5 |
| **Wizard steps without validation** | Users discover errors at final step, lose confidence | Validate each step before allowing "Next" |

**Key insight from research:** The most common anti-pattern is **feature bloat masquerading as completeness**. Best-in-class products launched with narrow scope then expanded based on actual user needs, not hypothetical completeness.

---

## Feature Dependencies

Visual representation of how features build on each other:

```
EXISTING v1.0 FOUNDATION
├── 4-item navigation (Spanish)
├── 3-step onboarding (<2 min)
├── 10 industry feed templates
├── Rich text editor (TipTap)
├── File import (PDF/DOCX/TXT)
├── Product tour (7 steps)
├── Mobile responsive
└── Basic content management (create/edit states)

NEW v2.0 FEATURES
├── Control Center
│   ├── Requires: Agent execution data (exists?)
│   ├── Requires: Real-time data sync
│   └── Enables: Agent monitoring, task queue management
│
├── Content Pipeline
│   ├── Depends on: Existing content create/edit
│   ├── Adds: Review/Approved/Published states
│   ├── Adds: Version history, approval workflows
│   └── Enables: Team collaboration, audit trails
│
├── LinkedIn Integration
│   ├── Depends on: Content Pipeline (Approved state)
│   ├── Requires: OAuth 2.0 flow
│   ├── Requires: Job queue for scheduling
│   └── Enables: Social publishing, post scheduling
│
└── Guided UX
    ├── Applies to: Content creation, LinkedIn setup, agent configuration
    ├── Requires: Wizard component library
    └── Enables: Reduced time-to-value, fewer support requests
```

**Critical path:** Content Pipeline → LinkedIn Integration. LinkedIn publishing requires content to reach "Approved" state first, so pipeline must be implemented before LinkedIn publishing can work.

---

## MVP Recommendations

For v2.0 milestone, prioritize features by user pain points and technical dependencies.

### Phase 1: Control Center Essentials (Week 1-2)
**Table stakes only:**
1. Real-time agent status display (what's running now)
2. Agent activity feed (chronological log)
3. Agent roster with roles (who does what)
4. Responsive layout (mobile monitoring)

**Defer to post-MVP:**
- Agent performance metrics (analytics)
- Interrupt/escalation controls (complex)
- Predictive recommendations (ML required)

**Rationale:** Users need visibility first. Analytics and smart features can come later once monitoring is established.

### Phase 2: Content Pipeline Foundation (Week 3-4)
**Table stakes only:**
1. Add Review/Approved/Published states to existing content
2. Content preview (reuse existing rendering)
3. Simple version history (timestamp + user)
4. Edit locks (prevent conflicts)

**One differentiator:**
- Bulk actions (approve/reject multiple items)

**Defer to post-MVP:**
- AI-powered routing (complex)
- Parallel approval tracks (state machine complexity)
- Performance predictions (ML required)

**Rationale:** Focus on core workflow states first. Bulk actions provide immediate productivity win without high complexity.

### Phase 3: LinkedIn Integration MVP (Week 5-6)
**Table stakes only:**
1. OAuth 2.0 authentication flow
2. Text post publishing (LinkedIn Posts API)
3. Basic error handling (auth failures, rate limits)
4. Simple post scheduling (date/time picker)

**One differentiator:**
- Image optimization (auto-resize to LinkedIn specs)

**Defer to post-MVP:**
- Multi-account management (complex OAuth handling)
- Performance tracking (requires Analytics API)
- Hashtag suggestions (NLP complexity)
- Optimal timing recommendations (heuristics)

**Rationale:** Get content flowing to LinkedIn first. Image optimization is low-complexity win that improves post quality.

### Phase 4: Guided UX Layer (Week 7-8)
**Table stakes only:**
1. Wizard component library (reusable)
2. Progress indicator (step X of Y)
3. Back/Next navigation
4. Step validation (per-step form validation)

**Apply to:**
- LinkedIn OAuth setup (first-time connection)
- Content creation wizard (optional alternative to full editor)
- Agent task setup (if time permits)

**One differentiator:**
- Contextual help tooltips (low complexity, high value)

**Defer to post-MVP:**
- Conditional branching (state machine complexity)
- Progress persistence (requires draft storage)
- Role-aware flows (configuration UI needed)

**Rationale:** Build reusable wizard infrastructure once, apply to multiple flows. Tooltips are quick wins for reducing confusion.

---

## Complexity Analysis

| Feature Category | Low Complexity | Medium Complexity | High Complexity |
|------------------|----------------|-------------------|-----------------|
| **Control Center** | Agent roster, activity feed | Real-time status, task queue, responsive layout | RBAC, metrics, predictions |
| **Content Pipeline** | Status states, change tracking, bulk actions | Preview, version history, edit locks | AI routing, parallel approvals |
| **LinkedIn Integration** | Error messages, image optimization | Text publishing, rate limit handling | OAuth flow, scheduling, multi-account, analytics |
| **Guided UX** | Progress indicator, navigation, tooltips | Step validation, wizard library | Branching, persistence, role-aware flows |

**Low complexity:** 1-2 days per feature
**Medium complexity:** 3-5 days per feature
**High complexity:** 1-2 weeks per feature

---

## User Expectations by Feature

Based on 2026 research, what users expect from each feature category:

### Control Center Expectations

**Must have:**
- "Can I see what's happening right now?" (real-time view)
- "What needs my attention?" (task queue/notifications)
- "Who's doing what?" (agent roster with status)

**Nice to have:**
- "How are agents performing?" (metrics)
- "Can I stop this before it does something wrong?" (interrupt controls)

**Don't care about:**
- Raw agent logs (unless debugging)
- Technical metrics (latency, memory usage)
- Configuration options (separate concern)

### Content Pipeline Expectations

**Must have:**
- "What's waiting for my approval?" (review queue)
- "What will this look like when published?" (preview)
- "Who changed this and when?" (audit trail)
- "Can I roll back if needed?" (version history)

**Nice to have:**
- "Can I approve 10 items at once?" (bulk actions)
- "Who needs to approve this next?" (workflow visibility)

**Don't care about:**
- Complex approval routing (want simple defaults)
- Custom workflow builders (too much configuration)

### LinkedIn Integration Expectations

**Must have:**
- "Did my post publish successfully?" (clear success/error states)
- "Can I schedule for later?" (date/time picker)
- "What if I hit rate limits?" (graceful handling + explanation)

**Nice to have:**
- "When should I post for max engagement?" (timing suggestions)
- "What hashtags are relevant?" (smart suggestions)

**Don't care about:**
- Detailed LinkedIn analytics (can check on LinkedIn)
- Post variations/A-B testing (too complex for MVP)

### Guided UX Expectations

**Must have:**
- "How many more steps?" (progress indicator)
- "Can I go back?" (back button)
- "What does this field mean?" (contextual help)
- "Did I fill this out correctly?" (validation feedback)

**Nice to have:**
- "Can I save and finish later?" (progress persistence)
- "Can you fill in the obvious stuff?" (smart pre-fill)

**Don't care about:**
- Wizard customization (want it to just work)
- Animated transitions (performance over polish)

---

## Competitive Intelligence

What best-in-class products do in each category:

### Control Center Benchmarks

**Microsoft Semantic Kernel (2026):**
- Hub-and-spoke architecture with central orchestrator
- Agent dependency graph visualization
- Human-in-the-loop interrupt points

**SuperAgent (open-source):**
- Visual dashboard for monitoring agent behavior
- Performance metrics per agent
- Cost tracking per request

**Key takeaway:** Leaders focus on **visibility + control**, not just monitoring. Users need ability to intervene, not just observe.

### Content Pipeline Benchmarks

**Sanity CMS:**
- Draft/Published states with scheduled publishing
- Real-time collaboration indicators ("X is editing")
- Version history with visual diff

**Planable:**
- Multi-level approval workflows
- Shareable content previews (no login required)
- Bulk approval actions

**Key takeaway:** Simple state machines (Draft → Review → Approved → Published) handle 90% of use cases. Complexity should be opt-in, not default.

### LinkedIn Integration Benchmarks

**Buffer:**
- Multi-account management (personal + company pages)
- Optimal timing suggestions based on audience data
- Post performance analytics post-publish

**Hootsuite:**
- Bulk scheduling (upload CSV of posts)
- Team collaboration (assign posts to team members)
- Approval workflows before publishing

**Key takeaway:** Basic publishing is table stakes; differentiators are in **workflow optimization** (when to post, what performs well).

### Guided UX Benchmarks

**Stripe Onboarding:**
- 3-step account setup wizard
- Contextual help without cluttering UI
- Progress persistence (can abandon and resume)

**Notion Template Wizards:**
- Role-based wizard flows (different steps for different use cases)
- Smart pre-fill from user profile
- Clear outcome messaging ("You're creating a project dashboard")

**Key takeaway:** Best wizards feel **effortless** through smart defaults and progressive disclosure, not through feature richness.

---

## Research Confidence Assessment

| Category | Confidence | Reasoning |
|----------|-----------|-----------|
| **Control Center patterns** | MEDIUM | WebSearch verified with multiple 2026 sources (InfoQ, Medium, industry blogs); patterns consistent across multi-agent systems |
| **Content Pipeline states** | HIGH | Multiple authoritative CMS sources (Sanity, Contentstack, Drupal) agree on standard state transitions |
| **LinkedIn API specifics** | HIGH | Official Microsoft Learn documentation for LinkedIn API; rate limits and OAuth requirements verified |
| **Guided UX principles** | HIGH | Nielsen Norman Group (NN/g) + multiple UX design pattern libraries agree on wizard best practices |
| **Complexity estimates** | LOW | Based on general web dev experience, not AMD-specific codebase analysis |
| **User expectations** | MEDIUM | Inferred from feature reviews, case studies, and UX pattern documentation; not from AMD user interviews |

**Gaps to address:**
1. **AMD-specific agent data structure:** Research assumes agent execution data exists; needs verification of current data model.
2. **Existing authentication system:** LinkedIn OAuth integration complexity depends on current auth setup; needs investigation.
3. **Job queue infrastructure:** Post scheduling requires background job system; unclear if exists currently.

---

## Sources

### Primary (HIGH confidence)
- [LinkedIn Posts API Documentation (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-01)
- [LinkedIn API Rate Limits (Microsoft Learn)](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits)
- [Wizards: Design Guidelines (Nielsen Norman Group)](https://www.nngroup.com/articles/wizards/)
- [Progressive Disclosure (Nielsen Norman Group)](https://www.nngroup.com/articles/progressive-disclosure/)

### Secondary (MEDIUM confidence)
- [Multi-Agent Design Patterns (InfoQ, January 2026)](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)
- [Content Publishing Workflow (Activepieces, 2026)](https://www.activepieces.com/blog/content-publishing-workflow)
- [Drafts & Publishing Workflow (Sanity CMS)](https://www.sanity.io/glossary/drafts--publishing-workflow)
- [DevOps Dashboard Guide (CloudZero)](https://www.cloudzero.com/blog/devops-dashboard/)
- [Dashboard Design Principles (DesignRush, 2026)](https://www.designrush.com/agency/ui-ux-design/dashboard/trends/dashboard-design-principles)
- [AI Agent Monitoring Best Practices (UptimeRobot, 2026)](https://uptimerobot.com/knowledge-hub/monitoring/ai-agent-monitoring-best-practices-tools-and-metrics/)

### Tertiary (LOW confidence, flagged for validation)
- [Mission Control Dashboard Case Study (Medium)](https://medium.com/grace-kwan/case-study-mission-control-d410e562ec0e) - Single case study, needs validation
- [Content Workflow Guide (Planable)](https://planable.io/blog/content-workflow/) - Vendor documentation, may be biased toward their features

---

## Next Steps for Roadmap Creation

Based on this feature landscape research, recommend the following for roadmap structure:

### Suggested Phase Ordering

**Phase 1: Control Center Foundation** (2 weeks)
- Why first: Visibility is the #1 user pain point ("what are agents doing?")
- Addresses: Agent monitoring, task queue
- Risk: Depends on agent data availability (needs verification)

**Phase 2: Content Pipeline Enhancement** (2 weeks)
- Why second: Builds on existing content management (evolutionary, not revolutionary)
- Addresses: Review/Approved states, version history
- Risk: Low—extends existing system

**Phase 3: LinkedIn Publishing Integration** (2 weeks)
- Why third: Requires content pipeline states (approved content → publish)
- Addresses: OAuth flow, post publishing, scheduling
- Risk: High—OAuth + API integration complexity

**Phase 4: Guided UX Layer** (2 weeks)
- Why last: Applies to all previous phases; easier to add after core features exist
- Addresses: Wizard for LinkedIn setup, contextual help
- Risk: Medium—requires refactoring existing flows into wizard pattern

### Research Flags for Phases

| Phase | Likely Needs Deeper Research | Reason |
|-------|------------------------------|--------|
| **Phase 1** | YES | Agent data model and real-time sync approach unclear |
| **Phase 2** | NO | Standard CMS patterns; well-documented |
| **Phase 3** | YES | OAuth flow specifics, rate limit handling strategy, job queue selection |
| **Phase 4** | NO | Wizard patterns well-established; implementation straightforward |

### Critical Path Dependencies

1. **Content Pipeline MUST precede LinkedIn Integration** (approved state required before publishing)
2. **Control Center can be parallel to Content Pipeline** (independent features)
3. **Guided UX can be applied incrementally** (doesn't block other features)

---

## Metadata

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days—feature expectations stable)
**Recommended refresh triggers:**
- LinkedIn API changes (monitor Microsoft Learn changelog)
- Multi-agent pattern updates (InfoQ, Google research publications)
- User feedback contradicts assumptions

**Total sources consulted:** 35+ web sources across 9 search queries
**Time spent researching:** ~2 hours across Control Center, Content Pipeline, LinkedIn API, and Guided UX domains
