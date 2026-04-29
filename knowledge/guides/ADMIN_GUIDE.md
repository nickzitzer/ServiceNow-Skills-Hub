# Skills Hub - Administrator Guide

**Audience:** Skills Hub administrators, ServiceNow administrators, and support teams.
**Last updated:** 2026-04-29

## Overview

Skills Hub is a ServiceNow Service Portal experience that extends the out-of-box skill tables with employee profiles, skill discovery, endorsements, manager review, skill requests, and a searchable Skill Library.

Administrators are responsible for maintaining the skill library, supporting the request process, monitoring data quality, and troubleshooting portal behavior.

## Key Tables

| Table | Purpose |
| --- | --- |
| `cmn_skill` | Out-of-box skill library. Skills Hub uses this as the source of skills. |
| `cmn_skill_category` | Out-of-box skill categories. |
| `cmn_skill_level_type` | Out-of-box grouping for skill rating scales. |
| `cmn_skill_level` | Out-of-box rating levels under a level type. |
| `sys_user_has_skill` | Out-of-box user skill profile records. Extended with review fields. |
| `u_m2m_skill_endorsement` | Peer endorsements for user skill records. |
| `u_skill_request` | Requested skills submitted through the catalog flow. |
| `u_skill_profile_requirement` | Optional role/profile skill requirements. |
| `u_story_skill_assignment` | Optional demand and story skill tagging data. |

## Roles

| Role | Typical audience | Capabilities |
| --- | --- | --- |
| `skill_user` | Employees | View and maintain own skills, use Find Experts, add skills, create endorsements. |
| `skill_manager` | Managers | Review direct report skills when manager controls are enabled. |
| `skill_admin` | Skill catalog owners | Review requested skills and maintain skill records. |
| `admin` | Platform admins | Full platform administration and troubleshooting. |

The Team Review tab appears based on direct reports in the `sys_user.manager` field. Role configuration may still be used for write access and administrative functions.

## Skill Library Administration

Skills Hub uses `cmn_skill` as the library of available skills.

### Creating or Updating Skills

1. Navigate to `cmn_skill.list`.
2. Create or open a skill record.
3. Maintain the skill name and description.
4. Set `active` appropriately, if available.
5. Set `level_type` to the correct `cmn_skill_level_type`.
6. Link the skill to categories through the available category relationship.

### Rating Scale Setup

Each skill can reference a level type. The user interface reads child levels from `cmn_skill_level` and uses the numeric `value` field for scoring and ordering.

Verify:

- `cmn_skill.level_type` is populated for skills that need a specific rating scale.
- `cmn_skill_level.skill_level_type` or equivalent type reference points to the level type.
- `cmn_skill_level.value` is populated consistently.
- Level names and descriptions match the intended rating model.

## Skill Request Administration

Employees can request a missing skill through the Request New Skill catalog item.

The request form should collect:

- Skill name
- Category
- Description

The description should help administrators understand what the skill means. It should not be framed as a personal business justification.

### Reviewing Requests

1. Open the submitted request or related `u_skill_request` record.
2. Check whether the requested skill already exists.
3. Confirm the best category and naming convention.
4. Create or update the `cmn_skill` record as appropriate.
5. Communicate the outcome through the configured request process.

If approval workflow is not enabled in the target deployment, use the organization's standard request fulfillment process to close the loop.

## Manager Review Administration

Manager review state is stored on `sys_user_has_skill`.

| Field | Purpose |
| --- | --- |
| `u_validation_status` | `pending`, `validated`, `disputed`, or `expired`. |
| `u_validation_notes` | Manager dispute or review notes. |
| `u_manager_assessed_level` | Manager-suggested level. |
| `u_last_manager_validation` | Timestamp of latest manager validation or review. |

The Team Review UI depends on these fields for status filters, dispute indicators, and review modals.

## Endorsement Administration

Endorsements are stored in `u_m2m_skill_endorsement`.

Expected safeguards:

- Users cannot endorse their own skill.
- Duplicate endorsements for the same skill record and endorser are blocked.
- Endorsement counts are maintained on the related `sys_user_has_skill` record.

If counts appear incorrect, recalculate from `u_m2m_skill_endorsement` for the affected skill record.

## Portal Widgets

| Widget ID | Purpose |
| --- | --- |
| `skills-hub-container` | Main tab container for Skills Hub. |
| `skills-hub-profile` | My Skills profile management. |
| `skills-hub-find` | Find Experts search and endorsement flow. |
| `skills-hub-library` | Skill Library search, category filter, pagination, and add action. |
| `skills-hub-matrix` | Team Review manager matrix. |

## Accessibility and UX Administration

The current portal includes accessibility-oriented updates:

- Descriptive button names for search, clear, add, and status actions.
- Keyboard focus outlines on interactive controls.
- Table captions and scoped column headers in Skill Library.
- Visible labels for filters and lookup controls.
- Compact table layouts for large skill lists.

These updates support 508 and ADA readiness, but they do not replace a formal accessibility audit. Before production release, test with keyboard-only navigation and the organization's approved screen reader/browser combinations.

## Common Support Scenarios

### Team Review tab does not show

- Confirm the user has active direct reports.
- Check the `manager` field on direct report `sys_user` records.
- Confirm the portal page has the latest container widget version.

### Skill levels show unexpected labels

- Check the skill's `level_type`.
- Check related `cmn_skill_level` records.
- Confirm the `value` field is populated and ordered correctly.

### Skill Library Add button says Added

The current user already has a `sys_user_has_skill` record for that skill.

### Category picker or clear button layout looks wrong

Confirm the toolbar repair script has been applied:

- `82_repair_skill_library_toolbar_layout.js`
- `83_verify_skill_library_toolbar_layout.js`

### Request form language is wrong

Confirm the request cleanup scripts were applied and that the form uses "description" language instead of "business justification" language.

### Manager filters do not match counts

Confirm the manager filter repair scripts were applied:

- `74_repair_manager_review_filter.js`
- `75_verify_manager_review_filter.js`

## Verification Scripts

Use the numbered verification scripts after applying implementation scripts. Recent stabilization scripts include:

| Scripts | Purpose |
| --- | --- |
| `66`-`73` | Profile search, category picker, and add-skill focus behavior. |
| `74`-`75` | Team Review filter repair. |
| `76`-`79` | Skill Library tab, verification, and table density polish. |
| `80`-`83` | Skill Library UX/accessibility polish and toolbar layout repair. |

Verification scripts are designed to be read-only.
