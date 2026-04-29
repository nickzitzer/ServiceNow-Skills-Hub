# Skills Hub - Technical Design

**Audience:** ServiceNow developers, platform administrators, architects, and support engineers.
**Last updated:** 2026-04-29

## 1. Application Overview

Skills Hub is a ServiceNow Service Portal solution for employee skills management, expert discovery, skill library browsing, endorsements, and manager review.

| Property | Value |
| --- | --- |
| Platform | ServiceNow |
| Scope | Global |
| Portal page | `/sp?id=skills_hub` |
| Primary data foundation | `cmn_skill`, `cmn_skill_level_type`, `cmn_skill_level`, `sys_user_has_skill` |
| Delivery mode | Update sets and idempotent fix scripts |

### Design Principles

1. Extend out-of-box ServiceNow skill records where possible.
2. Keep user skill data on `sys_user_has_skill`.
3. Use the skill's configured level type instead of forcing one global rating scale.
4. Make manager review state visible and auditable on the skill record.
5. Keep fix scripts idempotent and verifiable.
6. Avoid finalizing skill grouping and specialized tiering until the combined governance model is designed.

## 2. Data Model

### Core Tables

| Table | Type | Purpose |
| --- | --- | --- |
| `cmn_skill` | OOB | Skill library source. |
| `cmn_skill_category` | OOB | Skill taxonomy and category filtering. |
| `cmn_skill_level_type` | OOB | Rating scale grouping. |
| `cmn_skill_level` | OOB | Rating levels under a level type. |
| `sys_user_has_skill` | OOB | User skill profile records. |
| `u_m2m_skill_endorsement` | Custom | Peer endorsements for user skill records. |
| `u_skill_request` | Custom | Requested skills from the catalog flow. |
| `u_skill_profile_requirement` | Custom | Optional role/profile requirements. |
| `u_story_skill_assignment` | Custom | Optional demand and story skill tagging. |

### Extended Fields on `sys_user_has_skill`

| Field | Purpose |
| --- | --- |
| `u_interest_level` | Employee interest in using or developing the skill. |
| `u_peer_endorsement_count` | Denormalized endorsement count. |
| `u_validation_status` | Manager review state: pending, validated, disputed, expired. |
| `u_validation_notes` | Manager notes for disputes or reviews. |
| `u_manager_assessed_level` | Manager-suggested level. |
| `u_last_manager_validation` | Timestamp of latest manager validation or review. |

### Skill Level Alignment

Skills Hub resolves level labels from the skill's configured level type.

1. Read `cmn_skill.level_type`.
2. Query `cmn_skill_level` where the level type reference matches the skill's level type.
3. Order levels by the numeric `value` field.
4. Use the level record and label in profile, search, and manager views.

This avoids hard-coding a single Novice-to-Expert scale when ServiceNow already supports per-skill rating scales.

## 3. Portal Architecture

### Page

The primary Service Portal page is:

```text
/sp?id=skills_hub
```

### Widgets

| Widget ID | Name | Purpose |
| --- | --- | --- |
| `skills-hub-container` | Skills Hub - Container | Hosts the tabbed portal experience. |
| `skills-hub-profile` | Skills Hub - My Profile | My Skills profile management. |
| `skills-hub-find` | Skills Hub - Find Expert | Expert search and endorsement flow. |
| `skills-hub-library` | Skills Hub - Skill Library | Searchable, paginated skill library with category filter and add action. |
| `skills-hub-matrix` | Skills Hub - Manager Matrix | Team Review manager experience. |

### Current Tab Model

| Tab | Widget | Visibility |
| --- | --- | --- |
| My Skills | `skills-hub-profile` | All users |
| Find Experts | `skills-hub-find` | All users |
| Skill Library | `skills-hub-library` | All users |
| Team Review | `skills-hub-matrix` | Users with direct reports |

## 4. Widget Behavior

### My Skills

My Skills lets the current user manage profile skills. Key behaviors include:

- Card and list views for profile skills.
- Add Skill modal with ServiceNow-style lookup.
- Category-aware skill selection.
- Skill level display using `cmn_skill_level`.
- Endorsement detail modal showing endorser name, role, and department.
- Stale assessment indicators for skills not assessed recently.
- Dispute visibility and review actions when manager feedback exists.

### Find Experts

Find Experts searches users by skill and supporting filters.

Supported behavior includes:

- Skill lookup and search.
- Department, business unit, and group hierarchy filtering where configured.
- Expert cards showing name, role, department, skill context, and endorsement affordances.
- Endorsement actions with duplicate and self-endorsement protection.

### Skill Library

Skill Library is a standalone widget embedded in the container tab.

Server behavior:

- Queries active `cmn_skill` records.
- Supports keyword search by skill name.
- Supports category filtering through skill-category relationships.
- Returns paginated results.
- Marks whether the current user already has the skill.
- Creates `sys_user_has_skill` when the user selects Add.

Client behavior:

- Search field and ServiceNow category picker.
- Clear filter action shown only when filters are active.
- `uib-pagination` paging.
- Table layout using ServiceNow-style classes.
- Accessible table caption, scoped headers, and specific Add button labels.

### Team Review

Team Review supports manager validation and dispute workflows.

Key behavior:

- Shows direct reports and skill rows.
- Filters by review status.
- Opens dispute detail modal from compact status indicators.
- Validates skills.
- Stores disputes using `u_validation_status`, `u_validation_notes`, and `u_manager_assessed_level`.

## 5. Skill Request Flow

The Request New Skill catalog item supports requests for missing skills.

Recommended variables:

| Variable | Type | Purpose |
| --- | --- | --- |
| Skill name | Single line text | Requested skill name. |
| Category | Reference to `cmn_skill_category` | Suggested category. |
| Description | Multi-line text | Business description of what the skill means. |

The form language should not ask for business justification. The request exists because the skill is missing or unclear; the description should help administrators understand and name the skill correctly.

Workflow automation may vary by deployment. If formal approval workflow is not enabled, requests should be fulfilled through the organization's normal catalog task or admin review process.

## 6. Manager Review and Dispute Loop

Manager review state is stored directly on `sys_user_has_skill`.

### State Model

```text
pending -> validated
pending -> disputed
disputed -> validated
validated -> expired
expired -> validated
```

### Dispute Storage

| Field | Use |
| --- | --- |
| `u_validation_status = disputed` | Identifies that manager follow-up is needed. |
| `u_manager_assessed_level` | Captures the manager's suggested level. |
| `u_validation_notes` | Captures manager notes. |
| `u_last_manager_validation` | Captures review timing. |

The UI makes disputes visible to both managers and employees so the loop can be closed through review or conversation.

## 7. Endorsements

Endorsements are stored in `u_m2m_skill_endorsement`.

Expected safeguards:

- Prevent self-endorsement.
- Prevent duplicate endorsements.
- Maintain `u_peer_endorsement_count`.
- Show endorsement details to users with name, role, and department.

## 8. Accessibility and UX

Recent UX and accessibility changes include:

- Clearer tab names.
- Keyboard focus outlines.
- Accessible names for icon buttons.
- Skill Library table caption and scoped headers.
- Screen-reader-specific Add button names.
- Compact list/table layouts for high-volume skill sets.
- Toolbar layout repair to keep search, category, and clear controls visible.

These changes support 508 and ADA readiness, but a formal audit should still be performed.

## 9. Implementation Scripts

The current stabilization and UX cleanup work is delivered through numbered fix scripts.

| Scripts | Purpose |
| --- | --- |
| `66`-`67` | Profile search and filter polish. |
| `68`-`73` | Add Skill category picker and focus/blur repairs. |
| `74`-`75` | Team Review filter repair. |
| `76`-`77` | Skill Library tab and verification. |
| `78`-`79` | Skill Library density polish. |
| `80`-`81` | Skill Library UX and accessibility polish. |
| `82`-`83` | Skill Library toolbar layout repair. |

Each implementation script has a paired verification script where practical.

## 10. Security Model

Skills Hub uses ServiceNow ACLs and role-based controls.

Common rules:

- Employees can maintain their own skill-related profile data where permitted.
- Managers can review direct reports.
- Skill admins can manage requested skills and library maintenance activities.
- Admins retain full platform access.

Manager write actions should validate that the target user's `manager` is the current user, unless the current user has an administrator role.

## 11. Performance Considerations

- Skill Library queries are paginated.
- Search filters should be applied server-side.
- Long descriptions are visually clamped in tables.
- Manager views should avoid rendering empty filler rows when filters reduce results.
- Large skill libraries should be navigated through search and category filtering rather than all-at-once rendering.

## 12. Open Design Decision

The combined grouping, specialized skill, and verification tier model remains open.

This should be designed as one model because these concepts affect the same user decisions:

- How skills are grouped.
- Whether a skill requires additional employee detail.
- Whether a skill requires manager or SME verification.
- Whether a skill requires owner attestation, restricted visibility, or audit review.

No final data model change for this area should be made until that design is approved.
