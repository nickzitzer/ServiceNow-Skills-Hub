# Skills Hub - Regression Testing Playbook

**Application:** Skills Hub
**Scope:** Global
**Portal Page:** `?id=skills_hub`
**Version:** Post-Phase 4 Implementation
**Last Updated:** 2026-03-25

---

## Test Environment Setup

### Required Test Users

| User | Role(s) | Setup Notes |
|------|---------|-------------|
| **Employee A** | `skill_user` | Has 5+ skills assigned, at least 2 endorsed |
| **Employee B** | `skill_user` | Has 3+ skills assigned, same department as Employee A |
| **Manager M** | `skill_user` | Direct manager of Employee A and Employee B (set via `sys_user.manager`) |
| **Skill Admin** | `skill_admin` | Can manage skill requests, profile requirements, category groups |
| **Non-authenticated** | (none) | For negative access testing |

### Prerequisite Data

- [ ] At least 10 skills exist in `cmn_skill` across 2+ categories
- [ ] Employee A has at least one skill that also exists in a different category (for cross-category grouping tests)
- [ ] At least one `u_skill_profile_requirement` record exists linking a job title to a skill
- [ ] At least one `u_skill_category_group` with linked skills exists
- [ ] Manager M's `sys_user.manager` field is set so Employee A and B report to Manager M

---

## Phase 1: Foundation (Scripts 01-09)

### TC-1.1 Custom Tables Exist

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `sys_db_object.list` | Tables page loads | |
| 2 | Search for `u_skill_request` | Table exists with label "Skill Request" | |
| 3 | Search for `u_skill_profile_requirement` | Table exists with label "Skill Profile Requirement" | |
| 4 | Search for `u_skill_category_group` | Table exists with label "Skill Category Group" | |
| 5 | Search for `u_m2m_skill_category_group` | Table exists with label "Skill Category Group Member" | |
| 6 | Search for `u_m2m_skill_endorsement` | Table exists with label "Skill Endorsement" | |

### TC-1.2 Custom Fields on sys_user_has_skill

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `sys_user_has_skill.list` and open any record | Record form loads | |
| 2 | Verify field `u_interest_level` exists | Choice field with values: high, neutral, low | |
| 3 | Verify field `u_peer_endorsement_count` exists | Integer field, default 0 | |
| 4 | Verify field `u_last_manager_validation` exists | Date/Time field | |
| 5 | Verify field `u_validation_status` exists | Choice field: pending, validated, disputed, expired | |
| 6 | Verify field `u_manager_assessed_level` exists | Choice field matching proficiency levels | |
| 7 | Verify field `u_validation_notes` exists | String/text field | |

### TC-1.3 Roles Exist

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `sys_user_role.list`, search `skill_user` | Role exists | |
| 2 | Search for `skill_admin` | Role exists | |

### TC-1.4 Business Rules - Endorsement Count Integrity (SH-024)

**Login as:** Employee B

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Note Employee A's endorsement count on a specific skill | Record the starting count (e.g., N) | |
| 2 | Create a `u_m2m_skill_endorsement` record: endorser=Employee B, skill_record=Employee A's skill | Record is created | |
| 3 | Check Employee A's `u_peer_endorsement_count` on that skill | Count = N + 1 | |
| 4 | Delete the endorsement record created in step 2 | Record is deleted | |
| 5 | Check Employee A's `u_peer_endorsement_count` again | Count = N (decremented back) | |

### TC-1.5 Business Rules - Self-Endorsement Prevention (SH-024)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Attempt to create `u_m2m_skill_endorsement`: endorser=Employee A, skill_record=Employee A's own skill | Insert is **aborted** | |
| 2 | Check for error message | "You cannot endorse your own skill." displayed | |

### TC-1.6 Business Rules - Duplicate Endorsement Prevention (SH-024)

**Login as:** Employee B

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Endorse Employee A's skill (first time) | Endorsement record created successfully | |
| 2 | Attempt to endorse the same skill again | Insert is **aborted** | |
| 3 | Check for error message | "You have already endorsed this skill." displayed | |

### TC-1.7 Business Rules - Validation Status Auto-Set (SH-005)

**Login as:** Admin or Manager M

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Open Employee A's `sys_user_has_skill` record | Form loads | |
| 2 | Set `u_last_manager_validation` to current date/time and save | Record saves | |
| 3 | Check `u_validation_status` | Automatically set to "validated" | |

### TC-1.8 Business Rules - Cross-Category Sync (SH-016)

**Prerequisite:** Employee A has the same skill name in two different categories.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Change `skill_level` on one of the duplicate-named skills | Record saves | |
| 2 | Check the other `sys_user_has_skill` record with the same skill name | `skill_level` is synced to the new value | |

### TC-1.9 ACLs - Endorsement Table (SH-023)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | **As Employee A** (skill_user): Query `u_m2m_skill_endorsement.list` | Can read records | |
| 2 | **As Employee A**: Create a new endorsement for Employee B's skill | Can create | |
| 3 | **As non-authenticated user**: Attempt to access `u_m2m_skill_endorsement.list` | Access denied | |

### TC-1.10 ACLs - Interest Level Field (SH-023)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | **As Employee A**: Edit own `u_interest_level` on own skill record | Can write | |
| 2 | **As Employee B**: Attempt to edit Employee A's `u_interest_level` | Write denied (field read-only) | |

---

## Phase 2: Process & Workflow (Scripts 10-17)

### TC-2.1 Catalog Item - Request New Skill (SH-009)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to Service Catalog, search "Request New Skill" | Catalog item found | |
| 2 | Fill in: Skill Name (required), Category (reference), Justification (multi-line) | Form accepts input | |
| 3 | Submit the request | RITM created, `u_skill_request` record created with status "pending" | |
| 4 | Check email | Requester receives "Skill Request Submitted" notification | |

### TC-2.2 Skill Request Approval Flow (SH-009)

**Login as:** Skill Admin

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Open the `u_skill_request` record from TC-2.1 | Record shows status "pending" | |
| 2 | Set status to "approved" and save | Record updates | |
| 3 | Check `cmn_skill` table | New skill created matching the request | |
| 4 | Check requester's email | "Skill Request Approved" notification received | |

### TC-2.3 Skill Request Rejection (SH-009)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Create a new skill request as Employee B | `u_skill_request` record with status "pending" | |
| 2 | **As Skill Admin**: Set status to "rejected" with a reason | Record updates | |
| 3 | Check Employee B's email | "Skill Request Rejected" notification with reason | |

### TC-2.4 Manager Validate Skill (SH-005)

**Login as:** Manager M

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Open Employee A's skill record (via Manager Matrix or backend) | Record loads | |
| 2 | Set `u_last_manager_validation` to now | Record saves | |
| 3 | Verify `u_validation_status` = "validated" | Auto-set by business rule | |
| 4 | Check Employee A's email | "Skill Validated by Manager" notification received | |

### TC-2.5 Manager Dispute Skill (SH-006)

**Login as:** Manager M

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Open Employee A's skill record | Record loads | |
| 2 | Set `u_validation_status` to "disputed" | Field accepts value | |
| 3 | Enter `u_validation_notes` with justification | Notes saved | |
| 4 | Optionally set `u_manager_assessed_level` | Value saved | |
| 5 | Check Employee A's email | "Skill Disputed by Manager" notification with notes | |

### TC-2.6 Bulk Validate (SH-007)

**Login as:** Manager M (or test via Scripts - Background)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Ensure Employee B has 3+ skills with `u_validation_status` != "validated" | Precondition met | |
| 2 | Call `SkillsHubUtils.bulkValidate()` for Employee B | Method executes | |
| 3 | Check all of Employee B's skills | All `u_validation_status` = "validated", all `u_last_manager_validation` set | |

### TC-2.7 Scheduled Job - Skill Expiration (SH-011)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `sysauto_script.list`, search "Skills Hub - Skill Expiration Check" | Job exists, active, runs daily at 02:00 | |
| 2 | Create a test `sys_user_has_skill` with `u_validation_status`="validated" and `u_last_manager_validation` = 13 months ago | Record created | |
| 3 | Run the scheduled job manually (Execute Now) | Job completes without error | |
| 4 | Check the test record | `u_validation_status` = "expired" | |
| 5 | Verify skills with `u_validation_status`="pending" were NOT changed | Unchanged | |

### TC-2.8 Scheduled Job - Monthly Manager Reminder (SH-012)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Search `sysauto_script.list` for "Skills Hub" monthly job | Job exists and is active | |
| 2 | Ensure Manager M has direct reports with pending skills | Precondition met | |
| 3 | Execute the job manually | Job completes | |
| 4 | Check Manager M's email | Summary email listing employees with unvalidated skills | |

### TC-2.9 Email Notification - Endorsement (SH-018)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | **As Employee B**: Endorse Employee A's skill | Endorsement created | |
| 2 | Check Employee A's email | "Skill Endorsed" notification received | |

---

## Phase 3: UI Enhancements (Scripts 18-26)

### TC-3.1 Service Portal - Page Load (SH-001)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `?id=skills_hub` | Page loads without errors | |
| 2 | Verify page loads within 3 seconds | Acceptable performance | |
| 3 | Verify My Profile widget displays | Shows user name, title, department | |
| 4 | Verify all assigned skills are listed | Skills match `sys_user_has_skill` records for this user | |
| 5 | Each skill shows: name, proficiency, interest, endorsement count | All fields populated | |

### TC-3.2 My Profile - Inline Interest Edit (SH-001)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Click interest level on one of your skills | Interest selector appears (high/neutral/low) | |
| 2 | Change interest level to "high" | UI updates immediately | |
| 3 | Refresh the page | Interest level persists as "high" | |
| 4 | Check `sys_user_has_skill` record backend | `u_interest_level` = "high" | |

### TC-3.3 My Profile - Update Proficiency (SH-001)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Change proficiency on a skill (e.g., Novice → Intermediate) | UI updates | |
| 2 | Refresh page | New proficiency persists | |
| 3 | Check backend `sys_user_has_skill` | `skill_level` matches | |

### TC-3.4 My Profile - Add Skill (SH-015)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Click "Add Skill" button | Modal opens | |
| 2 | Search for an existing skill from `cmn_skill` | Skill appears in search results | |
| 3 | Select proficiency and interest, submit | New skill added to profile | |
| 4 | Verify the skill appears in the list | Skill shown with selected proficiency/interest | |
| 5 | Try adding the **same skill** again | Blocked with "already have this skill" message | |

### TC-3.5 My Profile - Remove Skill (SH-001)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Click remove/delete on a skill | Confirmation prompt appears | |
| 2 | Confirm removal | Skill removed from profile | |
| 3 | Check backend | `sys_user_has_skill` record deleted | |

### TC-3.6 My Profile - Tier Display (SH-013)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Check tier badge is displayed | Badge shows tier name and FontAwesome icon | |
| 2 | Verify total points are displayed | Points value shown | |
| 3 | Verify progress bar shows progress to next tier | Bar filled proportionally | |
| 4 | Verify points calculation matches formula (see below) | Points are accurate | |

**Points formula:**
- Skills owned: +10 each
- Proficiency: Novice +2, Intermediate +5, Proficient +10, Advanced +20, Expert +35
- Endorsements received: +5 each
- Endorsements given: +3 each
- Manager-validated skills: +15 each
- Skills added this quarter: +8 each

**Tiers:** Starter (0-49), Contributor (50-149), Specialist (150-299), Trailblazer (300-499), Luminary (500+)

### TC-3.7 Find Expert - Search (SH-002)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to Find Expert tab | Widget loads | |
| 2 | Enter a skill name that at least one other user has | Search returns results | |
| 3 | Verify results show: user name, proficiency, interest, endorsement count | All fields displayed | |
| 4 | Verify results are sorted by proficiency descending | Highest proficiency first | |
| 5 | Enter an empty search | No results returned (not all users) | |
| 6 | Search with interest filter enabled | Only non-low interest results shown | |

### TC-3.8 Find Expert - Endorse (SH-003)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Search for a skill held by Employee B | Employee B appears in results | |
| 2 | Click "Endorse" on Employee B's skill | Endorsement created | |
| 3 | Verify endorsement count increases in the UI | Count incremented | |
| 4 | Try endorsing the same skill again | Blocked - duplicate endorsement | |
| 5 | Try endorsing your own skill (if it appears) | Blocked - self-endorsement | |

### TC-3.9 Manager Matrix - View (SH-004)

**Login as:** Manager M

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to Skills Hub portal | Manager Matrix tab is visible | |
| 2 | Click Manager Matrix tab | Widget loads showing direct reports | |
| 3 | Verify Employee A and Employee B appear | Both listed with their skills | |
| 4 | Each skill shows: proficiency, interest, endorsements, validation status | All fields present | |

### TC-3.10 Manager Matrix - Tab Visibility (SH-004)

**Login as:** Employee A (not a manager)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to Skills Hub portal | Page loads | |
| 2 | Check tab navigation | Manager Matrix tab is **NOT visible** | |

### TC-3.11 Manager Matrix - Inline Validate/Dispute (SH-017)

**Login as:** Manager M

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Click a skill in the Manager Matrix | Inline modal opens | |
| 2 | Verify modal shows employee's self-assessed level | Level displayed | |
| 3 | Select a manager assessed level from dropdown | Value accepted | |
| 4 | Click "Validate" | Status changes to "validated", timestamp recorded | |
| 5 | Open a different skill, enter notes, click "Dispute" | Status = "disputed", notes saved | |
| 6 | Use filter controls to filter by validation status | Results filtered correctly | |

### TC-3.12 Manager Matrix - Bulk Validate (SH-007)

**Login as:** Manager M

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Find an employee with multiple unvalidated skills | Bulk Validate button visible | |
| 2 | Click "Bulk Validate" | All pending skills set to "validated" | |
| 3 | Verify button is disabled/hidden after all validated | No action available | |

### TC-3.13 Leaderboard (SH-014)

**Login as:** Employee A

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to Leaderboard tab | Widget loads | |
| 2 | Verify users are ranked by points within department | Sorted by points descending | |
| 3 | Each row shows: rank, name, tier badge, points, skill count, endorsement count | All columns present | |
| 4 | Current user's row is highlighted | Employee A's row stands out visually | |
| 5 | Verify results are limited (top 25 or paginated) | Not showing unlimited rows | |

### TC-3.14 Skill Grouping Display (SH-016)

**Login as:** Employee A (who has a same-named skill in 2 categories)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | View My Profile | Skills with same name across categories are grouped | |
| 2 | Grouped skill shows category tags | Both categories displayed | |
| 3 | Change proficiency on the grouped skill | Change applies | |
| 4 | Check backend: both `sys_user_has_skill` records | Both updated to new proficiency | |

### TC-3.15 Tab Navigation (SH-026)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Verify tabs display: My Portfolio, Find an Expert, Leaderboard | Three tabs visible | |
| 2 | Click each tab | Content switches without full page reload | |
| 3 | Active tab is visually highlighted | Clear active state | |
| 4 | Refresh the page while on a non-default tab | Tab state persists (URL parameter) | |

### TC-3.16 Navigation Modules (SH-025)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | In platform UI, check left nav for "Skills Hub" menu | Application menu exists | |
| 2 | Verify modules: My Portfolio, Find Expert, Manager View, Leaderboard | Four modules present | |
| 3 | Click each module | Opens Skills Hub portal with correct tab | |
| 4 | **As Employee A (non-manager)**: Check Manager View module | Module hidden or inaccessible | |

---

## Phase 4: Analytics & Reporting (Scripts 27-33)

### TC-4.1 Demand Table (SH-021)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `u_story_skill_assignment.list` | Table exists | |
| 2 | Verify fields: story (reference), skill (cmn_skill ref), estimated_hours (decimal), proficiency_required (choice), active | All fields present | |
| 3 | Create a record linking a story/task to a skill | Record created | |
| 4 | Verify `proficiency_required` defaults to "intermediate" | Default applied | |

### TC-4.2 PA Indicators (SH-019)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `pa_indicators.list`, search "Skills Hub" | 6 indicators found | |
| 2 | Verify indicators: Supply, Demand, Capacity Utilization, Endorsement Velocity, Validation Rate, Skill Growth | All present and active | |
| 3 | Verify breakdowns by department and proficiency level exist | Breakdowns available | |

### TC-4.3 PA Dashboard (SH-019)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to PA Dashboards, search "Skills Hub" | Dashboard exists | |
| 2 | Verify 3 tabs: Supply/Demand Overview, Capacity Analysis, Growth Trends | All tabs present | |
| 3 | Dashboard loads data without errors | Widgets render | |

### TC-4.4 Gap Analysis Widget (SH-020)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to Gap Analysis widget (via PA Dashboard or standalone) | Widget loads | |
| 2 | Verify rows show: skill name, supply count, demand count, gap severity | All columns present | |
| 3 | Results sorted by gap severity (largest first) | Correct sort order | |
| 4 | Create a skill with high demand but low supply | Skill appears near top of gap list | |

### TC-4.5 Skill Detection (SH-022)

**Test via:** Scripts - Background

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Run: `new SkillsHubDetection().detectSkillsInText("We need Python and JavaScript expertise for this project")` | Returns array with matched skills | |
| 2 | Verify "Python" and "JavaScript" are matched (assuming they exist in `cmn_skill`) | Both in results | |
| 3 | Verify "Java" is NOT matched (partial word of JavaScript) | Not in results (no false positives) | |
| 4 | Run with empty string | Returns empty array | |

---

## Cross-Cutting Tests

### TC-5.1 Non-Authenticated Access

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Log out of ServiceNow | Session ended | |
| 2 | Navigate to `?id=skills_hub` | Redirected to login page | |

### TC-5.2 Performance - My Profile with Many Skills

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Assign 50 skills to a test user | Skills created | |
| 2 | Load Skills Hub as that user | Page loads within 3 seconds | |
| 3 | All 50 skills render correctly | No missing or broken entries | |

### TC-5.3 Performance - Manager Matrix with Large Team

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Set up a manager with 30 direct reports, each with 5+ skills | Data seeded | |
| 2 | Load Manager Matrix as that manager | Widget loads within 5 seconds | |
| 3 | All direct reports and skills render | No truncation or errors | |

### TC-5.4 Update Set Integrity

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Query `sys_update_xml` for Skills Hub update set(s) | Records found | |
| 2 | Verify all custom tables, fields, scripts, ACLs are captured | No records in "Default" update set | |
| 3 | Verify record count matches expected artifact count per phase | Counts align | |

### TC-5.5 System Logs - No Errors

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | After running all tests, check System Logs | No `[Skills Hub]` error entries | |
| 2 | Check for JavaScript errors in browser console during portal use | No JS errors | |

---

## Defect Reporting Template

When logging defects, include:

- **Test Case ID:** (e.g., TC-1.4)
- **User Story:** (e.g., SH-024)
- **Environment:** Instance name, browser, user account used
- **Steps to Reproduce:** Numbered steps
- **Expected Result:** What should happen
- **Actual Result:** What actually happened
- **Severity:** Critical / Major / Minor / Cosmetic
- **Screenshots/Logs:** Attach system log excerpts, browser console output, screenshots

---

## Sign-Off

| Phase | Tester | Date | Status |
|-------|--------|------|--------|
| Phase 1: Foundation | | | |
| Phase 2: Process & Workflow | | | |
| Phase 3: UI Enhancements | | | |
| Phase 4: Analytics & Reporting | | | |
| Cross-Cutting | | | |
| **Overall** | | | |
