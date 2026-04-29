# Skills Hub - User Guide

**Audience:** Employees using Skills Hub to manage skills, find experts, and request missing skills.
**Last updated:** 2026-04-29

## Overview

Skills Hub is the ServiceNow portal experience for managing professional skills across the organization. It helps employees maintain a current skills profile, discover colleagues with relevant expertise, request missing skills for the library, and view endorsements or manager review status.

Access Skills Hub from the ServiceNow portal page:

```text
/sp?id=skills_hub
```

## Navigation

Skills Hub uses four main tabs.

| Tab | Who sees it | Purpose |
| --- | --- | --- |
| My Skills | All users | Manage your own skills, levels, interests, endorsements, and review status. |
| Find Experts | All users | Search for colleagues by skill, department, business unit, and related filters. |
| Skill Library | All users | Browse the complete skill library and quickly add skills to your profile. |
| Team Review | Managers with direct reports | Review, validate, or dispute team skill assessments. |

## My Skills

The My Skills tab is your personal skills profile. It shows your skills, skill level, interest level, endorsements, and manager review status.

### Skill Cards and List View

Skills may be shown as cards or in a compact list view. The list view is intended for users with many skills and makes it easier to scan large profiles.

Each skill entry can show:

- Skill name
- Category or category path
- Current skill level
- Interest level
- Endorsement count
- Manager review or dispute status
- Stale assessment indicators when a skill has not been assessed recently

### Skill Levels

Skills Hub uses the ServiceNow skill rating model configured for each skill. Each skill can have a level type, and the available levels come from the related `cmn_skill_level` records. This means the labels may vary based on the skill's rating scale instead of always using one global five-point label set.

When you update a skill level, choose the level that best reflects your current experience.

### Interest Level

Interest level tells the organization whether you want to use or grow a skill. It is separate from proficiency.

Use interest to signal:

- Skills you want to use more often
- Skills you can support but do not want as a primary focus
- Skills you are developing

### Endorsements

Endorsements show that colleagues recognize your experience with a skill. You can view endorsement details to see who endorsed a skill. Endorsement details include the endorser's name, role, and department when those values are available.

You cannot endorse your own skills, and duplicate endorsements for the same person's skill are blocked.

### Manager Review Status

Managers can review skills for their direct reports. A skill may show:

| Status | Meaning |
| --- | --- |
| Pending | The skill has not yet been validated by a manager. |
| Validated | The manager confirmed the skill assessment. |
| Disputed | The manager suggested a different level or left review notes. |
| Expired | The previous validation is stale and should be reviewed again. |

If a manager disputes a skill, review the suggested level and notes. The dispute is meant to close the loop through conversation, correction, or re-validation.

## Adding Skills

You can add skills in two ways.

### Add From My Skills

1. Open **My Skills**.
2. Select **Add Skill**.
3. Search for the skill name.
4. Select the skill.
5. Choose the appropriate level and interest details.
6. Save the skill to your profile.

The skill picker opens suggestions as you focus and type, similar to other ServiceNow lookup experiences.

### Add From Skill Library

1. Open **Skill Library**.
2. Search or filter by category.
3. Review the results table.
4. Select **Add** next to the skill.

If a skill is already on your profile, the action shows **Added** and is disabled.

## Requesting a Missing Skill

If the skill you need does not exist, use the request flow.

1. From the Add Skill experience, select **Request it here**, or open the **Request New Skill** catalog item.
2. Enter the skill name.
3. Select the best category.
4. Provide a description that helps administrators understand the skill.
5. Submit the request.

The description should explain what the skill means in business terms. It is not a business justification for why you personally need it.

## Find Experts

Use Find Experts to locate colleagues with relevant skills.

1. Open **Find Experts**.
2. Search for a skill.
3. Use filters such as department, business unit, group hierarchy, or interest level when available.
4. Review each expert card for name, role, department, skill level, interest, and endorsement context.

Use this view when staffing work, finding a peer reviewer, identifying a backup, or locating someone who has experience with a specific platform or process.

## Skill Library

The Skill Library is the fastest way to browse and add skills.

The library supports:

- Keyword search
- Category filtering
- Pagination
- Status badges showing whether a skill is already on your profile
- Direct add actions

The table is designed for scanning. Long descriptions are shortened in the table so the list remains usable.

## Accessibility Notes

Skills Hub has been updated with accessibility improvements including descriptive button labels, keyboard focus styling, table captions, scoped table headers, and clearer status labels. This does not replace a formal 508 or ADA compliance review, but the portal experience is designed to support keyboard and screen reader use.

## FAQ

**Why do some skill levels have different names?**
Skill levels come from the rating scale assigned to the skill. Different skills may use different level labels.

**Why is a skill marked Added in the Skill Library?**
That skill is already on your profile.

**What should I write in a new skill request description?**
Describe what the skill is and how someone would recognize it. Do not write a personal justification.

**What does Disputed mean?**
Your manager suggested a different assessment or left notes. Use it as a prompt for follow-up and alignment.

**Can I remove a skill?**
Yes, use the remove action on the skill in My Skills, if enabled for your role and record.
