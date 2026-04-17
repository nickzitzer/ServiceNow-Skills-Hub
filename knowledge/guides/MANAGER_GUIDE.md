# Skills Hub - Manager Guide

## Overview

As a manager, you have a critical role in Skills Hub: validating your team's self-assessed skills to ensure accuracy across the organization. You have access to all the features available to regular employees, plus the **Manager View** tab and validation capabilities.

Your role requires the **skill_manager** role in ServiceNow.

---

## Accessing the Manager View

1. Navigate to **Skills Hub** in the left navigation, or go to `?id=skills_hub`
2. Click the **Manager View** tab (visible only to users with direct reports)

The Manager Matrix displays all of your direct reports with their skills, proficiency levels, and validation status.

---

## Understanding the Manager Matrix

The matrix shows each direct report as a row with their skills displayed as cards. Each skill card shows:

| Field | Description |
|-------|-------------|
| **Skill Name** | The skill being assessed |
| **Self-Assessment** | The employee's own proficiency rating |
| **Manager Assessment** | Your independent proficiency rating (if set) |
| **Endorsement Count** | Number of peer endorsements |
| **Validation Status** | Pending, Validated, Disputed, or Expired |

Color coding highlights gaps between self-assessment and manager assessment.

### Filtering and Sorting

- **Filter by validation status**: Show only Pending, Validated, Disputed, or Expired skills
- **Sort by proficiency gap**: Identify the largest discrepancies between self and manager assessments

---

## Validating Skills

Validation confirms that you agree with an employee's self-assessed proficiency level.

### Validate a Single Skill

1. Click on a skill in the Manager Matrix to open the validation modal
2. Review the employee's self-assessed level
3. Optionally set your own assessed level from the dropdown
4. Click **Validate**

This action:
- Sets the validation status to **Validated**
- Records the current date/time as the validation date
- Awards the employee +15 gamification points
- Sends the employee an email notification

### Bulk Validate

To validate all pending skills for an employee at once:

1. Find the employee's row in the Manager Matrix
2. Click the **Bulk Validate** button
3. All non-validated skills are marked as Validated in a single operation

Use this when you're confident in all of an employee's self-assessments.

---

## Disputing Skills

If you disagree with an employee's self-assessed proficiency level:

1. Click on the skill in the Manager Matrix
2. Enter your own assessed level in the dropdown
3. Enter notes explaining your assessment (required)
4. Click **Dispute**

This action:
- Sets the validation status to **Disputed**
- Records your assessed level separately from the employee's self-assessment
- Saves your notes to the validation notes field
- Sends the employee an email notification with your notes

Disputing is not punitive — it's a signal that a conversation about skill development is needed.

---

## Setting Manager Assessments

You can set your independent proficiency assessment without changing the validation status:

1. Click on a skill in the Manager Matrix
2. Select your assessed level from the dropdown
3. The assessment is saved alongside the employee's self-assessment

This is useful when you want to record your perspective before having a conversation with the employee, or when tracking development over time.

---

## Validation Lifecycle

```
Pending → Validated → Expired (after 12 months without re-validation)
Pending → Disputed (manager disagrees)
Expired → Validated (manager re-validates)
Disputed → Validated (after discussion and re-validation)
```

### Automatic Expiration

Skills that have been validated but not re-validated within 12 months are automatically set to **Expired** by a daily system job. This ensures skill data stays current. You will receive monthly email reminders listing employees with pending validations.

### Monthly Reminders

On the 1st of each month, if any of your direct reports have unvalidated skills, you will receive an email summary with:
- The count of pending validations
- A link to the Skills Hub Manager View

---

## Best Practices

### Regular Validation Cadence

- **Monthly**: Review the validation reminder email and address any pending skills
- **Quarterly**: Do a comprehensive review of your team's skill matrix during 1:1s
- **On role change**: When an employee changes roles, review and update skill validations

### Handling Disputes Constructively

1. Always include clear, constructive notes when disputing
2. Use disputes as a starting point for development conversations
3. After discussing with the employee, re-validate the skill at the agreed level
4. Consider creating a development plan for skills where there's a significant gap

### Leveraging the Matrix for Team Planning

- Use the matrix to identify **skill gaps** on your team
- Look for skills with no coverage or single-person dependencies
- Use the **interest level** column to identify employees eager to develop in specific areas
- Cross-reference with **endorsement counts** to find your team's recognized experts

---

## FAQ

**Q: Can I validate skills for someone who doesn't report directly to me?**
A: No. Validation is restricted to your direct reports only (based on the manager field in ServiceNow).

**Q: What happens when I bulk validate?**
A: All skills with a non-validated status (Pending, Disputed, or Expired) are set to Validated with the current timestamp.

**Q: An employee disagrees with my dispute — what do I do?**
A: Have a conversation, align on the proficiency level, then validate the skill at the agreed level. The dispute history is preserved in the validation notes.

**Q: I see "Expired" skills — is that bad?**
A: Not necessarily. It means the skill hasn't been re-validated in over 12 months. Review and re-validate during your next 1:1.

**Q: How does my validation affect the employee's gamification points?**
A: Each validated skill adds +15 points to the employee's total. Disputed skills do not award points.

**Q: Can I see skills for employees who don't report to me?**
A: You can see any employee's skills through Find an Expert, but you can only validate/dispute skills for your direct reports.
