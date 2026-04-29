# Skills Hub - Manager Guide

**Audience:** Managers reviewing skills for direct reports.
**Last updated:** 2026-04-29

## Overview

Managers use Skills Hub to review team skills, validate accurate assessments, and identify skills that need follow-up. The manager experience appears as the **Team Review** tab for users with direct reports in ServiceNow.

Managers can still use the employee features: My Skills, Find Experts, and Skill Library.

## Accessing Team Review

1. Open Skills Hub:

   ```text
   /sp?id=skills_hub
   ```

2. Select **Team Review**.

If the tab does not appear, confirm that the employee records have your user set in the `manager` field.

## Team Review Layout

Team Review shows direct reports and their skills in a compact review matrix. The view is optimized for scanning status and taking action.

Each skill row or chip can include:

- Employee name
- Skill name
- Employee-assessed level
- Manager-suggested level, when available
- Validation status
- Endorsement count
- Last review date
- Dispute or review notes

## Filters

Use the Team Review filters to focus the list.

| Filter | Purpose |
| --- | --- |
| Reports | Show all direct report skill rows. |
| Pending | Show skills waiting for manager review. |
| Verified or Validated | Show skills already confirmed. |
| Disputed | Show skills where a manager suggested a different level or left notes. |
| Review | Show skills needing review attention, depending on the configured status count. |

The filters should update the matrix without showing blank filler rows.

## Validating Skills

Validate a skill when you agree with the employee's assessment.

1. Find the employee and skill in Team Review.
2. Open the skill review action.
3. Confirm the level.
4. Select **Validate**.

Validation updates the skill record and stamps the latest manager validation timestamp.

## Disputing a Skill

Dispute a skill when the employee assessment needs follow-up.

1. Open the skill review action.
2. Select the manager-suggested level.
3. Add review notes.
4. Submit the dispute.

The dispute state is stored on the employee skill record:

| Field | Purpose |
| --- | --- |
| `u_validation_status` | Stores the dispute or validation state. |
| `u_validation_notes` | Stores manager notes and review context. |
| `u_manager_assessed_level` | Stores the manager-suggested level. |
| `u_last_manager_validation` | Stores the validation or review timestamp. |

Disputes are not intended to be punitive. They are a way to close the loop when a skill level needs conversation or correction.

## Reviewing Dispute Details

Disputed skills show a compact status indicator. Select the status indicator to view the dispute details modal. The modal shows the employee, skill, status, suggested level, and notes.

## Best Practices

- Review pending skills during regular one-on-ones.
- Use dispute notes to explain the specific gap or evidence needed.
- Re-validate after discussion when the level is aligned.
- Use Find Experts to compare skills across the broader organization.
- Use Skill Library to understand how skills are categorized before asking employees to add missing skills.

## FAQ

**Can I review users outside my direct reporting line?**
No. Manager actions are restricted to direct reports, unless you have an administrator role.

**What happens when I dispute a skill?**
The employee skill record is marked disputed and stores your suggested level and notes.

**Can I change a disputed skill later?**
Yes. After discussion, validate the skill at the agreed level or update the assessment as appropriate.

**Why do level names vary?**
Skills use the level scale configured on the skill's `cmn_skill.level_type`, so labels may differ across skills.
