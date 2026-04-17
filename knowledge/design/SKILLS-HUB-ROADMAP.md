# Skills Hub Enhancement Roadmap

**Project**: ServiceNow Skills Hub
**Author**: BMad Master (Architecture)
**Date**: 2026-02-26
**Updated**: 2026-02-26 — Simplified gamification (no new tables, tier system from existing data)
**Update Set**: TBD — Create new update set for each phase
**Execution Mode**: Fix Script (no MCP)

---

## Design Principle

> **Enhance OOB, don't over-engineer.** Minimize new tables. Use calculated values from existing data wherever possible. The gamification tier system uses ZERO new tables — all scoring is computed from `sys_user_has_skill`, `u_m2m_skill_endorsement`, and validation data.

---

## Gamification Tier System (Calculated, No Tables)

**Points are computed in real-time by the SkillsHubUtils Script Include:**

| Activity | Points | Source |
|----------|--------|--------|
| Each skill owned | +10 | `sys_user_has_skill` count |
| Proficiency: Novice | +2 | `skill_level` |
| Proficiency: Intermediate | +5 | `skill_level` |
| Proficiency: Proficient | +10 | `skill_level` |
| Proficiency: Advanced | +20 | `skill_level` |
| Proficiency: Expert | +35 | `skill_level` |
| Per endorsement received | +5 | `u_peer_endorsement_count` |
| Per endorsement given | +3 | `u_m2m_skill_endorsement` where endorser = user |
| Per manager-validated skill | +15 | `u_validation_status = validated` |
| Skills added this quarter | +8 bonus each | `sys_created_on` within quarter |

**Tiers:**

| Tier | Points | Icon | Description |
|------|--------|------|-------------|
| **Starter** | 0–49 | `fa-seedling` | Just getting started |
| **Contributor** | 50–149 | `fa-hand-holding-heart` | Building your portfolio |
| **Specialist** | 150–299 | `fa-star` | Deep expertise emerging |
| **Trailblazer** | 300–499 | `fa-fire` | Leading by example |
| **Luminary** | 500+ | `fa-sun` | Organizational skill champion |

---

## Phase Overview

| Phase | Name | Scope | Dependencies |
|-------|------|-------|-------------|
| **1** | Foundation & Data Model | Tables, fields, business rules, ACLs, roles | None |
| **2** | Process & Workflow | Skill requests, manager validation, endorsement workflow, notifications | Phase 1 |
| **3** | UI Enhancements | Manager assessment view, tier system UI, cross-category skills, portal navigation | Phase 1+2 |
| **4** | Analytics & Reporting | PA indicators, capacity dashboard, demand integration, gap analysis | Phase 1+2+3 |

---

## Phase 1: Foundation & Data Model

**Goal**: Fix all data model gaps, missing ACLs, missing business rules, and broken server-side handlers.

### Epic 1.1: Data Model Extensions

| # | Item | Table | Type | Description |
|---|------|-------|------|-------------|
| 1.1.1 | `u_manager_assessed_level` | `sys_user_has_skill` | String (choice) | Manager's independent proficiency assessment |
| 1.1.2 | `u_validation_status` | `sys_user_has_skill` | String (choice) | Values: pending, validated, disputed, expired |
| 1.1.3 | `u_validation_notes` | `sys_user_has_skill` | Journal | Manager notes on validation/dispute |
| 1.1.4 | `u_skill_category_group` | New table | — | Groups skills across categories: group_name, description |
| 1.1.5 | `u_m2m_skill_category_group` | New table | — | Junction: skill↔category_group↔category |
| 1.1.6 | `u_skill_request` | New table | — | Skill request tracking: requested_by, skill_name, category, justification, status, approved_by |
| 1.1.7 | `u_skill_profile_requirement` | New table | — | Role-based requirements: job_title/role, skill, required_level, priority |

### Epic 1.2: Business Rules & Logic

| # | Item | Table | Trigger | Description |
|---|------|-------|---------|-------------|
| 1.2.1 | Increment endorsement count | `u_m2m_skill_endorsement` | After Insert | Increment `u_peer_endorsement_count` on the target `sys_user_has_skill` |
| 1.2.2 | Decrement endorsement count | `u_m2m_skill_endorsement` | After Delete | Decrement counter |
| 1.2.3 | Prevent self-endorsement | `u_m2m_skill_endorsement` | Before Insert | Block if endorser == skill_record.user |
| 1.2.4 | Prevent duplicate endorsement | `u_m2m_skill_endorsement` | Before Insert | Block if same endorser + same skill_record |
| 1.2.5 | Sync cross-category scores | `sys_user_has_skill` | After Update | When skill_level changes, update all same-name skills for user |
| 1.2.6 | Set validation status on manager validate | `sys_user_has_skill` | Before Update | When u_last_manager_validation changes, set status=validated |
| 1.2.7 | Skill expiration scheduled job | — | Daily | Flag skills not validated in >12 months as "expired" |

### Epic 1.3: Security (ACLs & Roles)

| # | Item | Table.Field | Operation | Rule |
|---|------|-------------|-----------|------|
| 1.3.1 | Endorsement write ACL | `u_m2m_skill_endorsement` | write | endorser == current user OR admin |
| 1.3.2 | Endorsement delete ACL | `u_m2m_skill_endorsement` | delete | endorser == current user OR admin |
| 1.3.3 | Manager assessed level write | `sys_user_has_skill.u_manager_assessed_level` | write | user.manager == current user OR admin |
| 1.3.4 | Validation status write | `sys_user_has_skill.u_validation_status` | write | user.manager == current user OR admin |
| 1.3.5 | Validation notes write | `sys_user_has_skill.u_validation_notes` | write | user.manager == current user OR admin |
| 1.3.6 | Skill request create | `u_skill_request` | create | authenticated users |
| 1.3.7 | Skill request write | `u_skill_request` | write | admin OR skill_admin role |
| 1.3.8 | Profile requirement CRUD | `u_skill_profile_requirement` | all | admin |

---

## Phase 2: Process & Workflow

**Goal**: Build the request, validation, and endorsement processes.

### Epic 2.1: Skill Request Process

| # | Item | Description |
|---|------|-------------|
| 2.1.1 | Service Catalog item | "Request New Skill" catalog item with variables: skill_name, category, justification |
| 2.1.2 | Approval workflow | Submit → Skills Admin reviews → Approve (creates cmn_skill) or Reject |
| 2.1.3 | Notifications | Submitted confirmation, approved, rejected email templates |
| 2.1.4 | Skills Admin role | New role `skill_admin` for approving skill requests |

### Epic 2.2: Manager Validation Process

| # | Item | Description |
|---|------|-------------|
| 2.2.1 | SkillsHubUtils new methods | validateSkill, disputeSkill, bulkValidate, setManagerAssessment, endorseSkill |
| 2.2.2 | Widget server scripts | Fix Manager Matrix (missing server script) and Find Expert (no-op endorse) |
| 2.2.3 | Validation notification to employee | Email when manager validates or disputes a skill |
| 2.2.4 | Periodic validation reminders | Scheduled job: email managers with pending validations monthly |

### Epic 2.3: Endorsement Workflow

| # | Item | Description |
|---|------|-------------|
| 2.3.1 | Endorse server action | Find Expert widget: actual server call to create `u_m2m_skill_endorsement` |
| 2.3.2 | Endorsement notification | Email to skill owner when endorsed |

---

## Phase 3: UI Enhancements

**Goal**: Upgrade all widgets with missing functionality and add tier system.

### Epic 3.1: Enhanced Manager Assessment View

| # | Item | Description |
|---|------|-------------|
| 3.1.1 | Inline validation modal | Click skill → modal with: current self-assessment, manager assessment dropdown, notes field, validate/dispute buttons |
| 3.1.2 | Bulk validation | "Validate All" button, "Validate by Skill" dropdown |
| 3.1.3 | Filter/sort controls | Filter by: validation status, skill name, proficiency gap |
| 3.1.4 | Export capability | Export matrix to CSV/Excel |
| 3.1.5 | Gap visualization | Color-code cells where self vs manager assessment differs |

### Epic 3.2: Tier System UI (No New Tables)

| # | Item | Description |
|---|------|-------------|
| 3.2.1 | Tier calculation method | `calculateUserTier()` in SkillsHubUtils — returns tier, points, next tier threshold |
| 3.2.2 | My Profile tier badge | Display current tier with icon, points, and progress bar to next tier |
| 3.2.3 | Leaderboard widget | Team/department rankings by skill score (calculated, no stored data) |
| 3.2.4 | Tier milestone toast | Client-side notification when user reaches new tier |

### Epic 3.3: Cross-Category Skill Grouping

| # | Item | Description |
|---|------|-------------|
| 3.3.1 | Modified "Add Skill" modal | Show skill name + checkboxes for all categories it can belong to |
| 3.3.2 | Group-by-name display | In My Profile, group skills by name with category tags underneath |
| 3.3.3 | Score sync UI | Visual indicator showing linked skills across categories |

### Epic 3.4: Portal & Navigation

| # | Item | Description |
|---|------|-------------|
| 3.4.1 | Application module | Add to ServiceNow left nav: "Skills Hub" → portal page |
| 3.4.2 | Tab navigation widget | Proper tab bar: My Profile | Manager View | Find Expert | Leaderboard |
| 3.4.3 | Responsive layout fixes | Ensure mobile/tablet compatibility |

---

## Phase 4: Analytics & Reporting

**Goal**: Build the demand dashboard directly in ServiceNow using Performance Analytics.

### Epic 4.1: Performance Analytics Setup

| # | Item | Description |
|---|------|-------------|
| 4.1.1 | PA Indicator: Skills Supply | Count of users per skill at each proficiency level |
| 4.1.2 | PA Indicator: Skills Demand | Stories/tasks requiring each skill (from rm_story or custom mapping) |
| 4.1.3 | PA Indicator: Capacity Utilization | Supply ÷ Demand ratio per skill |
| 4.1.4 | PA Indicator: Endorsement Velocity | Endorsements per skill per month |
| 4.1.5 | PA Indicator: Validation Rate | % of skills validated by managers |
| 4.1.6 | PA Indicator: Skill Growth | New skills added per month |
| 4.1.7 | PA Breakdown: By Department | All indicators broken down by department |
| 4.1.8 | PA Breakdown: By Proficiency Level | All indicators broken down by level |

### Epic 4.2: Skills Demand Integration

| # | Item | Description |
|---|------|-------------|
| 4.2.1 | `u_story_skill_assignment` table | M2M: story↔skill with estimated_hours, proficiency_required |
| 4.2.2 | Skill tagging on stories | UI Action or business rule to tag stories with required skills |
| 4.2.3 | Automated skill detection | Script to pattern-match story descriptions to skills (like the PDF dashboard does) |

### Epic 4.3: Dashboard Widgets (ServiceNow Native)

| # | Item | Description |
|---|------|-------------|
| 4.3.1 | Top Skills Demand Over Time | PA widget: line chart of top 10 skills demand by month |
| 4.3.2 | Skill Hours by Category | PA widget: stacked area chart of hours by skill category |
| 4.3.3 | Proficiency Level Distribution | PA widget: stacked bar chart of proficiency levels by quarter |
| 4.3.4 | Capacity Utilization Gauge | PA widget: gauge showing supply vs demand ratio |
| 4.3.5 | Skills Demand Heatmap | PA widget or custom widget: skills × months heatmap |
| 4.3.6 | Trending Skills | PA widget: horizontal bar chart of recent demand |
| 4.3.7 | Story Complexity Trend | PA widget: line chart of avg skills per story over time |
| 4.3.8 | Gap Analysis Report | Custom widget: Skills with supply < demand, ranked by severity |
| 4.3.9 | Executive Summary Dashboard | PA Dashboard assembling all widgets with drill-down |

---

## Script Execution Order (Per Phase)

### Phase 1 Execution Order
```
01_create_update_set.js          — Create and set update set
02_create_tables.js              — New tables (request, profile req, category groups)
03_create_fields.js              — New fields on sys_user_has_skill
04_create_choices.js             — Choice values for validation_status, required_level, etc.
05_create_roles.js               — skill_admin, skill_manager roles
06_create_business_rules.js      — Endorsement, validation, cross-category sync rules
07_create_acls.js                — All ACLs
08_seed_data.js                  — Tier config properties, sample profile requirements
09_verification.js               — Verify all records in correct update set
```

### Phase 2 Execution Order
```
10_create_update_set_phase2.js   — Create Phase 2 update set
11_create_catalog_item.js        — "Request New Skill" item + variables
12_create_workflow.js            — Business rules for skill request approval
13_create_notifications.js       — Email templates (5 notifications)
14_update_skills_hub_utils.js    — New GlideAjax methods for validation/endorsement
15_update_widget_server_scripts.js — Fix Manager Matrix + Find Expert server scripts
16_create_scheduled_jobs.js      — Validation reminders
17_verification_phase2.js        — Verify
```

### Phase 3 Execution Order
```
18_create_update_set_phase3.js   — Create Phase 3 update set
19_create_tier_system.js         — calculateUserTier() method in SkillsHubUtils
20_update_my_profile_tier.js     — Tier badge display in My Profile widget
21_create_leaderboard_widget.js  — Team skill score leaderboard
22_create_skill_grouping_logic.js — Cross-category sync script include
23_update_add_skill_modal.js     — Category checkboxes
24_create_nav_modules.js         — Application menu + modules
25_create_tab_navigation.js      — Tab bar widget
26_verification_phase3.js        — Verify
```

### Phase 4 Execution Order
```
27_create_update_set_phase4.js   — Create Phase 4 update set
28_create_demand_tables.js       — Story-skill assignment table
29_create_pa_indicators.js       — PA indicators + breakdowns
30_create_pa_dashboard.js        — Dashboard with all widgets
31_create_gap_analysis_widget.js — Custom capacity widget
32_create_skill_detection.js     — Automated skill tagging script include
33_verification_phase4.js        — Verify
```

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| `sys_user_has_skill` is OOB table — customizations may conflict with upgrades | High | Use `u_` prefix for all custom fields, document all changes |
| `cmn_skill` category model may not support multi-category | Medium | Use separate junction table rather than modifying OOB |
| PA requires Performance Analytics plugin | High | Verify plugin is activated; if not, use Report widgets as fallback |
| Fix scripts run in Global scope — need careful update set management | Medium | Verify update set before and after each script |
| Large number of business rules on `sys_user_has_skill` may impact performance | Medium | Use `.changes()` guards on all rules, set proper execution order |

---

## Tables Summary (Simplified)

**New custom tables (4 total):**
1. `u_skill_request` — Skill request tracking
2. `u_skill_profile_requirement` — Role-based skill requirements
3. `u_skill_category_group` — Cross-category skill groups
4. `u_m2m_skill_category_group` — Junction: skill↔group↔category

**Existing tables extended:**
- `sys_user_has_skill` — 3 new `u_` fields (manager assessment, validation status, notes)

**Existing custom table (already deployed):**
- `u_m2m_skill_endorsement` — Peer endorsements (from original update set)

**Removed (over-engineered):**
- ~~`u_skill_badge`~~ — Replaced by calculated tier system
- ~~`u_user_badge`~~ — Replaced by calculated tier system
- ~~`u_skill_challenge`~~ — Removed (future consideration)
- ~~`u_user_challenge`~~ — Removed (future consideration)
