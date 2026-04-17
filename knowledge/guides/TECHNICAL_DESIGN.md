# Skills Hub - Technical Design Document

## 1. Application Overview

**Application Name:** Skills Hub
**Scope:** Global
**Platform:** ServiceNow (Service Portal)
**Primary Portal Page:** `skills_hub` (`?id=skills_hub`)

Skills Hub extends the out-of-box `sys_user_has_skill` and `cmn_skill` tables with peer endorsements, manager validation, gamification, cross-category skill grouping, and supply/demand analytics. All custom artifacts use the `u_` prefix to preserve upgrade compatibility.

### Design Principles

1. **Enhance OOB, don't replace** — All gamification is computed from existing data. No separate badge/challenge tables.
2. **Idempotent scripts** — Every fix script checks for existence before creating. Safe to re-run.
3. **Performance guards** — All business rules use `.changes()` early-exit. Scheduled jobs use filtered queries.
4. **Role-based security** — ACLs enforce authorization at table and field level.
5. **Global scope** — No scoped app dependency. All script includes are in the Global namespace.

---

## 2. Data Model

### 2.1 Tables

```
┌──────────────────────────────┐       ┌──────────────────────────┐
│       cmn_skill (OOB)        │       │   cmn_skill_category     │
│ ─────────────────────────── │       │   (OOB)                  │
│ name                         │◄──────│                          │
│ category (ref)               │       └──────────────────────────┘
└──────────┬───────────────────┘                   ▲
           │                                       │
           ▼                                       │
┌──────────────────────────────┐       ┌───────────┴──────────────┐
│   sys_user_has_skill (OOB)   │       │ u_m2m_skill_category_    │
│ + 6 custom u_ fields         │       │ group (Custom)           │
│ ─────────────────────────── │       │ ─────────────────────── │
│ user (ref → sys_user)        │       │ u_skill (ref → cmn_skill)│
│ skill (ref → cmn_skill)      │       │ u_category_group (ref)   │
│ skill_level (OOB)            │       │ u_category (ref)         │
│ u_interest_level             │       └──────────────────────────┘
│ u_last_manager_validation    │                   ▲
│ u_peer_endorsement_count     │                   │
│ u_manager_assessed_level     │       ┌───────────┴──────────────┐
│ u_validation_status          │       │ u_skill_category_group   │
│ u_validation_notes           │       │ (Custom)                 │
└──────────┬───────────────────┘       │ ─────────────────────── │
           │                           │ u_group_name             │
           ▼                           │ u_description            │
┌──────────────────────────────┐       └──────────────────────────┘
│ u_m2m_skill_endorsement      │
│ (Custom)                     │
│ ─────────────────────────── │
│ u_endorser (ref → sys_user)  │
│ u_skill_record (ref →        │
│   sys_user_has_skill)        │
│ u_comments (string 4000)     │
└──────────────────────────────┘

┌──────────────────────────────┐       ┌──────────────────────────┐
│ u_skill_request (Custom)     │       │ u_skill_profile_         │
│ ─────────────────────────── │       │ requirement (Custom)     │
│ u_requested_by (ref)         │       │ ─────────────────────── │
│ u_skill_name (string 200)    │       │ u_job_title (string 200) │
│ u_category (ref)             │       │ u_skill (ref → cmn_skill)│
│ u_justification (string 4000)│       │ u_required_level (choice)│
│ u_status (choice)            │       │ u_priority (choice)      │
│ u_approved_by (ref)          │       │ u_active (boolean)       │
│ u_approval_date (datetime)   │       └──────────────────────────┘
│ u_rejection_reason (str 4000)│
└──────────────────────────────┘

┌──────────────────────────────┐
│ u_story_skill_assignment     │
│ (Custom)                     │
│ ─────────────────────────── │
│ u_story (ref → rm_story/task)│
│ u_skill (ref → cmn_skill)    │
│ u_estimated_hours (decimal)  │
│ u_proficiency_required       │
│   (choice)                   │
│ u_active (boolean)           │
└──────────────────────────────┘
```

### 2.2 Custom Fields on OOB Tables

All fields on `sys_user_has_skill`:

| Field | Internal Name | Type | Max Length | Default | Notes |
|-------|---------------|------|-----------|---------|-------|
| Interest Level | `u_interest_level` | String (choice) | 40 | — | Values: high, neutral, low |
| Last Manager Validation | `u_last_manager_validation` | glide_date_time | — | — | Set by validation action |
| Peer Endorsement Count | `u_peer_endorsement_count` | Integer | — | 0 | Read-only, maintained by BRs |
| Manager Assessed Level | `u_manager_assessed_level` | String (choice) | 40 | — | Values: novice–expert |
| Validation Status | `u_validation_status` | String (choice) | 40 | pending | Values: pending, validated, disputed, expired |
| Validation Notes | `u_validation_notes` | journal_input | — | — | Manager notes on validation/dispute |

### 2.3 Choice Values

| Table.Field | Values |
|-------------|--------|
| `sys_user_has_skill.u_manager_assessed_level` | novice, intermediate, proficient, advanced, expert |
| `sys_user_has_skill.u_validation_status` | pending, validated, disputed, expired |
| `u_skill_request.u_status` | pending, approved, rejected |
| `u_skill_profile_requirement.u_required_level` | novice, intermediate, proficient, advanced, expert |
| `u_skill_profile_requirement.u_priority` | required, preferred, nice_to_have |
| `u_story_skill_assignment.u_proficiency_required` | novice, intermediate, proficient, advanced, expert |

---

## 3. Script Includes

### 3.1 SkillsHubUtils

**API Name:** `global.SkillsHubUtils`
**Client Callable:** Yes (GlideAjax)
**Pattern:** `Class.create()` with `LOG_SOURCE` and try-catch

| Method | Callable Via | Parameters | Returns | Logic |
|--------|-------------|------------|---------|-------|
| `searchExperts(searchTerm, interestFilter)` | GlideAjax | `sysparm_search_term`, `sysparm_interest_filter` | JSON array of users with matching skills | Queries `sys_user_has_skill` joined with `cmn_skill` and `sys_user`. Orders by `skill_level` descending. |
| `getManagerMatrix(managerId)` | GlideAjax | `sysparm_manager_id` | JSON object: `{ employees: [{ user, skills: [...] }] }` | Queries `sys_user` where `manager = managerId`, then queries each user's `sys_user_has_skill` records. |
| `validateSkill()` | GlideAjax | `sysparm_user_id`, `sysparm_skill_name` | JSON `{ success, message }` | Verifies `current_user == target.manager`. Sets `u_validation_status = 'validated'`, stamps `u_last_manager_validation`. |
| `disputeSkill()` | GlideAjax | `sysparm_user_id`, `sysparm_skill_name`, `sysparm_notes`, `sysparm_assessed_level` | JSON `{ success, message }` | Verifies manager. Sets `u_validation_status = 'disputed'`, writes notes and assessed level. |
| `bulkValidate()` | GlideAjax | `sysparm_user_id` | JSON `{ success, validated_count }` | Verifies manager. Queries all `sys_user_has_skill` where `u_validation_status != 'validated'`, validates each. |
| `setManagerAssessment()` | GlideAjax | `sysparm_user_id`, `sysparm_skill_name`, `sysparm_level` | JSON `{ success, message }` | Verifies manager. Sets `u_manager_assessed_level` without changing validation status. |
| `endorseSkill()` | GlideAjax | `sysparm_skill_record_id` | JSON `{ success, message }` | Creates `u_m2m_skill_endorsement`. Checks self-endorsement and duplicates. |
| `calculateUserTier()` | GlideAjax | `sysparm_user_id` (optional, defaults to current user) | JSON `{ points, tier_name, tier_icon, next_tier_name, next_tier_threshold, progress_percent }` | Reads scoring config from `skills_hub.tier_config` property. Calculates points from skills, endorsements, validations. |

**Manager Authorization Pattern:**
```javascript
var targetUser = new GlideRecord('sys_user');
targetUser.get(userId);
if (targetUser.manager.toString() !== gs.getUserID() && !gs.hasRole('admin')) {
    return JSON.stringify({ success: false, message: 'Not authorized' });
}
```

### 3.2 SkillsHubGrouping

**API Name:** `global.SkillsHubGrouping`
**Client Callable:** No (server-side only)

| Method | Parameters | Returns | Logic |
|--------|------------|---------|-------|
| `getGroupsForSkill(skillSysId)` | Skill sys_id | Array of category group objects | Queries `u_m2m_skill_category_group` for matching skill |
| `getSkillsInGroup(groupSysId)` | Group sys_id | Array of skill objects | Queries junction table for group members |
| `addSkillToCategories(userSysId, skillSysId, categorySysIds)` | User, skill, CSV of category IDs | `{ added, skipped, errors }` | Creates `sys_user_has_skill` for each category, with duplicate checking |
| `getUserSkillsGrouped(userSysId)` | User sys_id | Grouped skill map | Groups user's skills by skill name, returns category tags |

### 3.3 SkillsHubDetection

**API Name:** `global.SkillsHubDetection`
**Client Callable:** No (server-side only)

| Method | Parameters | Returns | Logic |
|--------|------------|---------|-------|
| `detectSkills(text)` | Text string | `[{ skillId, skillName, confidence }]` | Normalizes text (lowercase, strips HTML). Queries `cmn_skill`, matches exact name then alias variations. 20 built-in alias mappings (e.g., js→JavaScript, k8s→Kubernetes). |
| `tagStoryWithSkills(storyId)` | Story sys_id | `{ success, skillsTagged, skillsSkipped }` | Reads story `short_description + description`, runs `detectSkills()`, creates `u_story_skill_assignment` for each match (with duplicate check). |
| `batchTagStories(encodedQuery)` | GlideRecord encoded query | `{ success, storiesProcessed, totalSkillsTagged }` | Queries `rm_story` (falls back to `task`), calls `tagStoryWithSkills()` for each. |

---

## 4. Business Rules

| # | Name | Table | When | Trigger | Filter | Logic |
|---|------|-------|------|---------|--------|-------|
| 1 | Skills Hub - Increment Endorsement Count | `u_m2m_skill_endorsement` | After | Insert | — | `u_skill_record.u_peer_endorsement_count++` |
| 2 | Skills Hub - Decrement Endorsement Count | `u_m2m_skill_endorsement` | After | Delete | — | `u_skill_record.u_peer_endorsement_count--` (min 0) |
| 3 | Skills Hub - Prevent Self Endorsement | `u_m2m_skill_endorsement` | Before | Insert | — | Abort if `u_endorser == u_skill_record.user` |
| 4 | Skills Hub - Prevent Duplicate Endorsement | `u_m2m_skill_endorsement` | Before | Insert | — | Abort if record exists with same endorser + skill_record |
| 5 | Skills Hub - Set Validation Status on Manager Validate | `sys_user_has_skill` | Before | Update | `u_last_manager_validationCHANGES` | Sets `u_validation_status = 'validated'` |
| 6 | Skills Hub - Sync Cross-Category Skill Scores | `sys_user_has_skill` | After | Update | `skill_levelCHANGES` | Finds all `sys_user_has_skill` for same user + same skill name, syncs `skill_level` |
| 7 | Skills Hub - Create Skill Request on RITM | `sc_req_item` | After | Insert | `cat_item.name == 'Request New Skill'` | Creates `u_skill_request` from RITM variables |
| 8 | Skills Hub - Process Skill Request Approval | `u_skill_request` | Before | Update | `u_statusCHANGES` | On approved: creates `cmn_skill`, stamps approver/date. On rejected: stamps approver/date. |

### Business Rule Execution Order

Insert on `u_m2m_skill_endorsement`:
1. Before: Prevent Self Endorsement (abort check)
2. Before: Prevent Duplicate Endorsement (abort check)
3. After: Increment Endorsement Count

Update on `sys_user_has_skill`:
1. Before: Set Validation Status (if `u_last_manager_validation` changes)
2. After: Sync Cross-Category Skill Scores (if `skill_level` changes)

---

## 5. Scheduled Jobs

| Job | Table | Schedule | Logic |
|-----|-------|----------|-------|
| Skills Hub - Skill Expiration Check | `sysauto_script` | Daily at 02:00 | Queries `sys_user_has_skill` where `u_validation_status = 'validated'` AND `u_last_manager_validation < gs.monthsAgo(12)`. Sets status to `expired`. |
| Skills Hub - Monthly Validation Reminder | `sysauto_script` | Monthly, 1st at 08:00 | Queries `sys_user_has_skill` where `u_validation_status != 'validated'` AND `user.active = true` AND `user.manager != ''`. Groups by manager. Fires `skills_hub.validation_reminder` event per manager with parm1=manager_sys_id, parm2=pending_count. |

### Event Registration

| Event Name | Description | Handled By |
|------------|-------------|------------|
| `skills_hub.validation_reminder` | Monthly validation reminder for managers | Email notification: "Skills Hub - Monthly Validation Reminder" |

---

## 6. Email Notifications

| # | Name | Table/Event | Trigger | Recipient | Key Template Variables |
|---|------|------------|---------|-----------|----------------------|
| 1 | Skills Hub - Skill Request Submitted | `u_skill_request` | Insert, status=pending | `u_requested_by` | `${u_skill_name}`, `${u_category.name}`, `${u_justification}` |
| 2 | Skills Hub - Skill Request Approved | `u_skill_request` | Update, status→approved | `u_requested_by` | `${u_skill_name}`, `${u_approved_by.name}`, `${u_approval_date}` |
| 3 | Skills Hub - Skill Request Rejected | `u_skill_request` | Update, status→rejected | `u_requested_by` | `${u_skill_name}`, `${u_rejection_reason}` |
| 4 | Skills Hub - Skill Validated by Manager | `sys_user_has_skill` | Update, validation_status→validated | `user` | `${skill.name}`, `${skill_level}`, `${u_last_manager_validation}` |
| 5 | Skills Hub - Skill Disputed by Manager | `sys_user_has_skill` | Update, validation_status→disputed | `user` | `${skill.name}`, `${skill_level}`, `${u_manager_assessed_level}`, `${u_validation_notes}` |
| 6 | Skills Hub - Skill Endorsed | `u_m2m_skill_endorsement` | Insert | `u_skill_record.user` | `${u_skill_record.skill.name}`, `${u_endorser.name}` |
| 7 | Skills Hub - Monthly Validation Reminder | Event: `skills_hub.validation_reminder` | Event fired | parm1 (manager sys_id) | `${event.parm2}` (pending count) |

All emails use HTML content type with Cleveland Clinic branding (#0072CE header).

---

## 7. Service Portal Widgets

### 7.1 Widget Inventory

| Widget ID | Widget Name | Phase | Has Server | Has Client | Has Template | Has CSS |
|-----------|-------------|-------|------------|------------|-------------|---------|
| `skills-hub-profile` | Skills Hub - My Profile | Baseline + P3 | Yes | Yes | Yes | Yes |
| `skills-hub-find` | Skills Hub - Find Expert | Baseline + P2 | Yes | Yes | Yes | Yes |
| `skills-hub-matrix` | Skills Hub - Manager Matrix | Baseline + P2 | Yes | Yes | Yes | Yes |
| `skills-hub-container` | Skills Hub - Container | Baseline | Yes | Yes | Yes | Yes |
| `skills-hub-leaderboard` | Skills Hub - Leaderboard | Phase 3 | Yes | Yes | Yes | Yes |
| `skills-hub-tabs` | Skills Hub - Tab Navigation | Phase 3 | Yes | Yes | Yes | Yes |
| `skills-hub-gap-analysis` | Skills Hub - Gap Analysis | Phase 4 | Yes | Yes | Yes | Yes |

### 7.2 Inter-Widget Communication

The Tab Navigation widget broadcasts tab changes via `$rootScope`:

```javascript
// Tab Navigation (sender)
$rootScope.$broadcast('skills-hub-tab-change', { tab: tabId });

// Other widgets (receivers)
$scope.$on('skills-hub-tab-change', function(event, data) {
    // Show/hide based on data.tab
});
```

Tab state is also persisted in the URL via `window.history.replaceState`:
```
?id=skills_hub&tab=profile
?id=skills_hub&tab=manager
?id=skills_hub&tab=expert
?id=skills_hub&tab=leaderboard
```

### 7.3 My Profile Widget — Server Actions

| Action | Parameters | Logic |
|--------|------------|-------|
| `update_proficiency` | `skill_id`, `level` | Updates `skill_level` on `sys_user_has_skill` for current user |
| `update_interest` | `skill_id`, `level` | Updates `u_interest_level` for current user |
| `remove_skill` | `skill_id` | Deletes `sys_user_has_skill` record for current user |
| `add_skill` | `cmn_skill_id` | Creates `sys_user_has_skill` for current user (single category) |
| `add_skill` (multi) | `category_skill_ids` (CSV) | Creates `sys_user_has_skill` across multiple categories |
| `getCategories` | — | Returns all active `cmn_skill_category` records |

### 7.4 Manager Matrix Widget — Server Actions

| Action | Parameters | Logic |
|--------|------------|-------|
| `validate` | `user_id`, `skill_name` | Calls `SkillsHubUtils.validateSkill()` with manager auth check |
| `dispute` | `user_id`, `skill_name`, `notes`, `assessed_level` | Calls `SkillsHubUtils.disputeSkill()` |
| `bulkValidate` | `user_id` | Calls `SkillsHubUtils.bulkValidate()` |

### 7.5 Find Expert Widget — Server Actions

| Action | Parameters | Logic |
|--------|------------|-------|
| `endorse` | `skill_record_id` | Creates `u_m2m_skill_endorsement` with self/duplicate checks |

### 7.6 Leaderboard Widget

**Server:** Accepts `scope` parameter (team/department). Calculates points for all users in scope using the same scoring algorithm as `calculateUserTier`. Sorts descending, assigns rank numbers. Returns `data.leaderboard[]`.

**Client:** `switchScope(scope)` toggles team/department. `getRankClass(rank)` returns gold/silver/bronze CSS. Highlights current user's row.

### 7.7 Gap Analysis Widget

**Server:** Builds supply map from `sys_user_has_skill` (active users) and demand map from `u_story_skill_assignment` (active records). Calculates gap = supply - demand. Assigns severity: critical (< -5), warning (< 0), balanced (>= 0). Sorts by worst gap first.

**Client:** `filterBySeverity(severity)`, `sortBy(field)` with toggle ascending/descending.

---

## 8. Access Controls (ACLs)

### 8.1 Table-Level ACLs

| Table | Operation | Role | Advanced Script |
|-------|-----------|------|----------------|
| `u_m2m_skill_endorsement` | Read | `skill_user` | — |
| `u_m2m_skill_endorsement` | Create | `skill_user` | `current.u_endorser == gs.getUserID() \|\| gs.hasRole('admin')` |
| `u_m2m_skill_endorsement` | Write | `skill_user` | — |
| `u_m2m_skill_endorsement` | Delete | `skill_user` | `current.u_endorser == gs.getUserID() \|\| gs.hasRole('admin')` |
| `u_skill_request` | Read | `skill_user` | — |
| `u_skill_request` | Create | `skill_user` | — |
| `u_skill_request` | Write | `skill_admin` | — |
| `u_skill_request` | Delete | `admin` | — |
| `u_skill_profile_requirement` | Read | `skill_user` | — |
| `u_skill_profile_requirement` | Create | `admin` | — |
| `u_skill_profile_requirement` | Write | `admin` | — |
| `u_skill_profile_requirement` | Delete | `admin` | — |

### 8.2 Field-Level ACLs

| Table.Field | Operation | Advanced Script |
|-------------|-----------|----------------|
| `sys_user_has_skill.u_manager_assessed_level` | Write | `current.user.manager == gs.getUserID() \|\| gs.hasRole('admin')` |
| `sys_user_has_skill.u_validation_status` | Write | `current.user.manager == gs.getUserID() \|\| gs.hasRole('admin')` |
| `sys_user_has_skill.u_validation_notes` | Write | `current.user.manager == gs.getUserID() \|\| gs.hasRole('admin')` |

The baseline ACL on `sys_user_has_skill.u_interest_level` (Write) uses a dynamic condition restricting to the record owner.

---

## 9. Performance Analytics (Requires `com.snc.pa` Plugin)

### 9.1 Indicators

| Indicator | Type | Fact Table | Aggregate | Condition | Direction |
|-----------|------|-----------|-----------|-----------|-----------|
| Skills Supply | Collect (1) | `sys_user_has_skill` | COUNT | `user.active=true` | Maximize |
| Skills Demand | Collect (1) | `u_story_skill_assignment` | COUNT | `u_active=true` | Minimize |
| Capacity Utilization | Scripted (2) | — | — | `(supply/demand)*100` capped at 100 | Maximize |
| Endorsement Velocity | Collect (1) | `u_m2m_skill_endorsement` | COUNT | — | Maximize |
| Validation Rate | Collect (1) | `sys_user_has_skill` | COUNT | `u_validation_status=validated^user.active=true` | Maximize |
| Skill Growth | Collect (1) | `sys_user_has_skill` | COUNT | `user.active=true` | Maximize |

### 9.2 Breakdowns

| Breakdown | Fact Table | Dimension |
|-----------|-----------|-----------|
| By Department | `sys_user_has_skill` | `user.department` |
| By Proficiency Level | `sys_user_has_skill` | `skill_level` |

### 9.3 Dashboard

**Name:** Skills Hub - Analytics Dashboard
**Tabs:** Overview (3 widgets), Demand Analysis (2 widgets), Capacity (2 widgets)

Scripts 29 and 30 detect whether the PA plugin is active and gracefully skip creation if not. If PA is activated later, re-run scripts 29 and 30.

---

## 10. Service Catalog

### Catalog Item: Request New Skill

| Property | Value |
|----------|-------|
| Name | Request New Skill |
| Category | Skills Hub |
| Short Description | Request a new skill to be added to the Skills Hub catalog |

| Variable | Type | Order | Mandatory |
|----------|------|-------|-----------|
| `u_skill_name` | Single Line Text (16) | 100 | Yes |
| `u_skill_category` | Reference → cmn_skill_category (8) | 200 | Yes |
| `u_justification` | Multi-line Text (6) | 300 | Yes |

**Processing:** A business rule on `sc_req_item` (after insert) detects when the catalog item is "Request New Skill" and creates a `u_skill_request` record from the RITM variables. A second business rule on `u_skill_request` (before update) handles approval/rejection.

---

## 11. Navigation

### Application Menu

| Property | Value |
|----------|-------|
| Title | Skills Hub |
| Category | Custom Applications |
| Order | 1000 |

### Modules

| Module | Order | URL |
|--------|-------|-----|
| My Profile | 100 | `/sp?id=skills_hub&tab=profile` |
| Manager View | 200 | `/sp?id=skills_hub&tab=manager` |
| Find Expert | 300 | `/sp?id=skills_hub&tab=expert` |
| Leaderboard | 400 | `/sp?id=skills_hub&tab=leaderboard` |

---

## 12. Gamification Tier System

### Point Calculation

Points are computed in real-time by `SkillsHubUtils.calculateUserTier()`. No stored score — always current.

| Source | Points | Query |
|--------|--------|-------|
| Each skill owned | +10 | `sys_user_has_skill` WHERE `user = target` |
| Proficiency: Novice | +2 | Per `skill_level` value |
| Proficiency: Intermediate | +5 | Per `skill_level` value |
| Proficiency: Proficient | +10 | Per `skill_level` value |
| Proficiency: Advanced | +20 | Per `skill_level` value |
| Proficiency: Expert | +35 | Per `skill_level` value |
| Each endorsement received | +5 | `u_m2m_skill_endorsement` WHERE `u_skill_record.user = target` |
| Each endorsement given | +3 | `u_m2m_skill_endorsement` WHERE `u_endorser = target` |
| Each manager-validated skill | +15 | `sys_user_has_skill` WHERE `u_validation_status = validated` |
| Each skill added this quarter | +8 | `sys_user_has_skill` WHERE `sys_created_on >= quarter start` |

### Tier Definitions

| Tier | Min Points | Icon |
|------|-----------|------|
| Starter | 0 | `fa-seedling` |
| Contributor | 50 | `fa-hand-holding-heart` |
| Specialist | 150 | `fa-star` |
| Trailblazer | 300 | `fa-fire` |
| Luminary | 500 | `fa-sun` |

Configuration is stored in `skills_hub.tier_config` system property as JSON. Changes take effect on next page load.

---

## 13. Deployment

### Script Execution Order

Scripts must be run in numerical order. Each phase depends on the previous.

| Phase | Scripts | Prerequisites |
|-------|---------|--------------|
| Phase 1: Foundation | 01–09 | None |
| Phase 2: Process & Workflow | 10–17 | Phase 1 complete |
| Phase 3: UI Enhancements | 18–26 | Phase 2 complete |
| Phase 4: Analytics & Reporting | 27–33 | Phase 3 complete |

### Verification

Each phase includes a read-only verification script (09, 17, 26, 33) that checks all artifacts were created correctly. Run these after each phase to confirm deployment.

### Plugin Dependencies

| Plugin | Required By | Behavior if Absent |
|--------|------------|-------------------|
| `com.snc.pa` | Scripts 29, 30 | Gracefully skips PA indicator/dashboard creation |
| Agile Development (`rm_story`) | Script 28, 32 | Falls back to `task` table |

### Update Set Promotion Order

1. Skills Hub - Phase 1 - Foundation
2. Skills Hub - Phase 2 - Process & Workflow
3. Skills Hub - Phase 3 - UI Enhancements
4. Skills Hub - Phase 4 - Analytics & Reporting

Always promote in order. Each set depends on artifacts from previous sets.

---

## 14. Supportability

### Key Tables to Monitor

| Table | What to Check | Query |
|-------|---------------|-------|
| `sys_user_has_skill` | Orphaned records | `user.active=false` |
| `u_m2m_skill_endorsement` | Count integrity | Compare `COUNT(endorsements)` vs `u_peer_endorsement_count` |
| `u_skill_request` | Stale pending requests | `u_status=pending^sys_created_on<gs.daysAgo(30)` |
| `sys_update_xml` | Update set leakage | `update_set=<default_set_id>^nameLIKESkills Hub` |

### Log Entries

All Skills Hub code logs with the prefix `[Skills Hub]`. To review:

```
System Logs > All > message CONTAINS [Skills Hub]
```

### Common Support Scenarios

| Scenario | Resolution |
|----------|-----------|
| Endorsement count mismatch | Run GlideAggregate to recount and update (see Admin Guide) |
| Skill sync not working across categories | Verify BR "Sync Cross-Category Skill Scores" is active |
| Manager can't validate | Verify the manager field is set on the employee's `sys_user` record |
| Notifications not sending | Check notification is active, check Email Log for errors |
| Tier not calculating | Verify `skills_hub.tier_config` property exists and contains valid JSON |
| PA dashboard empty | Verify `com.snc.pa` plugin is active, wait for data collection job |

### Health Check Script

Run verification scripts in this order for a full health check:
```
09_verification.js → 17_verification_phase2.js → 26_verification_phase3.js → 33_verification_phase4.js
```

All are read-only and safe to run in production.
