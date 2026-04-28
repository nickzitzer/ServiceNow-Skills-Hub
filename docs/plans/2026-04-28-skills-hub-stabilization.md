# Skills Hub Stabilization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stabilize the current Skills Hub experience before adding specialized-skill governance.

**Architecture:** Keep the current ServiceNow artifact model intact and deliver changes as numbered background fix scripts. Patch the existing Service Portal widgets in place, add only minimal metadata/choice values needed to close current workflow gaps, and avoid replacing the skill taxonomy or governance model in this pass.

**Tech Stack:** ServiceNow Global scope, Script Includes, Service Portal `sp_widget` records, `sys_user_has_skill`, `u_m2m_skill_endorsement`, `u_skill_request`, `cmn_skill`, `cmn_skill_category`, background fix scripts.

---

## Stabilization Scope

This pass addresses the feedback that blocks day-to-day usage:

- My Profile stats and tier recalculate immediately after skill changes.
- Blank skill rows are filtered out of profile/search results.
- Manager-disputed skills have a visible response loop for the employee and manager.
- Endorsements can be viewed, and search results identify endorsements already made by the current user.
- Find Expert supports business-unit, department, and group filtering.
- Add-skill/search UX is more compact and keeps selected pills inside the search box area.
- Profile cards support a compact mode for large skill portfolios.
- Skills show stale assessment indicators when manager validation is more than one year old.
- Avatar initials/images are visually centered and fill the circle.

Out of scope for this pass:

- Full specialized-skill governance tiers.
- New PHI/Epic authorization metadata.
- Quarterly skill-owner attestations.
- Production RBAC enforcement for sensitive skills.

## Task 1: My Profile Stability, Compact View, and Endorsement Viewer

**Files:**
- Create: `scripts/implementation/39_stabilize_my_profile.js`

**Work:**
- Patch `Skills Hub - My Profile` server script.
- Add `review_requested` as a `sys_user_has_skill.u_validation_status` choice.
- Filter empty skill names before grouping.
- Fix tier-point calculation to iterate grouped entries, not parent skill groups.
- Return refreshed `data.skills`, `data.stats`, and `data.tier` after proficiency, interest, add, and remove actions.
- Add server actions:
  - `getEndorsements`: returns endorsers/comments for a `sys_user_has_skill` record.
  - `respondToDispute`: lets the employee accept manager level or request review with notes.
- Patch client script to apply full server refreshes, show endorsement modal, support compact mode, and handle dispute responses.
- Patch template/CSS to show endorsement viewer affordance, dispute response actions, stale validation indicators, compact cards, and avatar sizing.

**Acceptance Criteria:**
- Changing a skill proficiency updates profile stats and tier without browser reload.
- Adding/removing skills updates stats and tier without browser reload.
- Blank skills no longer render at the beginning of My Competencies.
- Clicking an endorsement count opens a list of endorsers.
- Disputed skills show manager notes and allow “accept manager level” or “request review.”
- Skills validated over 365 days ago show a stale assessment indicator.
- Compact mode reduces vertical card footprint for large portfolios.

## Task 2: Find Expert Search Filters and Endorsement State

**Files:**
- Create: `scripts/implementation/40_stabilize_find_expert.js`

**Work:**
- Patch `Skills Hub - Find Expert` server script.
- Add initial filter option data for department, business unit, and group.
- Add filter parameters to expert search.
- Treat `sys_user.u_business_unit` as the preferred business-unit field when present, falling back to company/department display where needed.
- Add group filtering through `sys_user_grmember`.
- Exclude blank skill names from typeahead and results.
- Include `endorsed_by_me` and live endorsement counts per skill entry.
- Patch client script to send filters, refresh endorsement counts after an endorsement, and visually mark “endorsed by me.”
- Patch template/CSS to keep selected pills within the search box area and add compact filters.

**Acceptance Criteria:**
- Searches can be limited by department, business unit, and group.
- Selected skill pills stay visually attached to the search input.
- Results show which skill entries the current user already endorsed.
- Endorsing a result updates the icon/count without another full search.

## Task 3: Manager Dispute Loop

**Files:**
- Create: `scripts/implementation/41_stabilize_manager_disputes.js`

**Work:**
- Patch `Skills Hub - Manager Matrix` server script and client/template.
- Support `review_requested` status as a first-class state.
- Show disputed skills with notes and assessed level.
- Allow managers to re-open/redispute review-requested skills or validate them.
- Set `u_last_manager_validation` only when the manager validates, not when a dispute is opened.
- Include skill record sys_id in manager matrix data where available to reduce ambiguity for duplicate skill names.

**Acceptance Criteria:**
- Disputed skills do not disappear from manager workflow.
- Employee responses appear as review-requested items.
- Managers can validate a review-requested item to close the loop.
- Manager matrix stats count pending, disputed, review-requested, and validated states accurately.

## Task 4: Verification

**Files:**
- Create: `scripts/implementation/42_verify_stabilization.js`

**Work:**
- Add a read-only background verification script.
- Verify patched widgets exist and contain expected markers.
- Verify required `u_validation_status` choices exist.
- Verify no blank `sys_user_has_skill.skill.name` records are included in sample queries.
- Verify endorsement records and count fields can be queried.

**Acceptance Criteria:**
- Verification logs PASS/FAIL lines for each stabilization capability.
- Script does not modify data.

## Execution Order

1. Run `39_stabilize_my_profile.js`.
2. Run `40_stabilize_find_expert.js`.
3. Run `41_stabilize_manager_disputes.js`.
4. Run `42_verify_stabilization.js`.
5. Export a new update set after validation in the instance.
