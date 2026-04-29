# Skills Hub - Executive Overview

**Audience:** Executive sponsors, operational leaders, and stakeholders evaluating Skills Hub.
**Last updated:** 2026-04-29

## Summary

Skills Hub is a ServiceNow-based skills management experience that helps the organization understand workforce capability, find experts, maintain employee skill profiles, and support manager review of skill assessments.

The solution builds on ServiceNow's out-of-box skill tables instead of creating a separate skills database. This keeps the implementation aligned with platform patterns while adding the user experience and governance controls needed for practical adoption.

## Business Outcomes

Skills Hub supports four primary outcomes.

| Outcome | How Skills Hub supports it |
| --- | --- |
| Better skill visibility | Employees maintain skills in a shared ServiceNow profile. |
| Faster expert discovery | Find Experts helps users locate people by skill, department, business unit, and related filters. |
| Improved data quality | Managers can validate or dispute direct report skill assessments. |
| Easier skill adoption | Skill Library lets employees browse, filter, and add skills quickly. |

## User Experience

Skills Hub is delivered through a ServiceNow portal page with four main areas.

| Area | Purpose |
| --- | --- |
| My Skills | Employees manage their skill profile, levels, interest, endorsements, and review status. |
| Find Experts | Users search for colleagues with specific skills. |
| Skill Library | Users browse the skill library and add skills to their profile. |
| Team Review | Managers review and validate direct report skill assessments. |

The latest cleanup pass focused on stabilization, usability, accessibility readiness, and reducing friction in high-volume skill management.

## Governance and Data Quality

Skills Hub uses a lightweight governance model:

- Skill data is stored on ServiceNow skill and user-skill records.
- Manager validation and dispute state are stored directly on employee skill records.
- Skill requests provide a path to improve the library when a skill does not exist.
- Endorsements provide peer signal without replacing manager review.
- Skill levels align to the ServiceNow rating scale assigned to each skill.

The larger governance model for skill grouping, specialized skills, and verification tiers is intentionally paused for a separate design decision. That model should be handled as one cohesive solution because taxonomy, verification, and required employee detail are closely related.

## Accessibility and Usability

The solution includes improvements that support 508 and ADA readiness:

- Clearer tab labels and navigation language.
- Keyboard-visible focus states.
- Descriptive labels for icon buttons.
- Accessible table captions and headers.
- More compact list and table layouts for large skill sets.

A formal accessibility review should still be completed before enterprise production rollout.

## Current Readiness

Recent work has completed:

- Skill Library tab with search, category filtering, pagination, and add action.
- Compact and accessible Skill Library toolbar.
- Team Review filter repair.
- Dispute loop visibility.
- Skill level alignment to ServiceNow level types and levels.
- Request New Skill language cleanup.
- Endorsement visibility improvements.
- Profile and search stabilization.

## Open Strategic Decision

The remaining major design decision is the combined skill grouping and skill tiering model.

This should define:

- How skills are grouped or categorized.
- Which skills require additional employee context.
- Which skills require manager or SME verification.
- Whether sensitive or specialized skills need owner attestation, visibility controls, and review cadence.

This is intentionally not finalized in the current cleanup pass because it affects governance, data model, user experience, and reporting.

## Recommended Next Steps

1. Approve the current stabilized Skills Hub experience for broader testing.
2. Complete a formal 508/ADA review with keyboard and screen reader testing.
3. Run a pilot with employees and managers using real skill data.
4. Design the combined grouping, specialized skill, and verification tier model.
5. Decide whether additional analytics, reporting, or workflow automation is needed for rollout.
