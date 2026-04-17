# Skills Hub - Administrator Guide

## Overview

This guide covers administration, configuration, and basic support for the Skills Hub application. Administrators manage the skill catalog, process skill requests, configure system behavior, and troubleshoot issues.

---

## Roles

| Role | Scope | Capabilities |
|------|-------|-------------|
| **skill_user** | All authenticated users | View skills, create endorsements, edit own interest level |
| **skill_manager** | Managers (inherits skill_user) | Validate/dispute team skills, set manager assessments, bulk validate |
| **skill_admin** | Skills administrators | Approve/reject skill requests, manage catalog, manage category groups |
| **admin** | Platform administrators | Full CRUD on all tables, system configuration |

### Assigning Roles

1. Navigate to **User Administration > Users**
2. Find the user record
3. Go to the **Roles** related list
4. Add the appropriate role (`skill_user`, `skill_manager`, or `skill_admin`)

Most users should receive `skill_user` automatically. `skill_manager` is for people with direct reports who need validation capabilities. `skill_admin` is for the team managing the skill catalog.

---

## Skill Catalog Management

### Managing Skills (cmn_skill)

The skill catalog uses the out-of-box `cmn_skill` table. To add, edit, or deactivate skills:

1. Navigate to **Skills > Skills** (or search `cmn_skill.list`)
2. Create, edit, or deactivate skill records as needed

### Processing Skill Requests

When employees request new skills via the catalog:

1. Navigate to **Skills Hub > u_skill_request.list** (or find pending requests)
2. Review the request: skill name, category, justification
3. Set the status to **Approved** or **Rejected**
   - **Approved**: The system automatically creates the skill in `cmn_skill` and notifies the requester
   - **Rejected**: Enter a rejection reason, then save. The requester is notified with your reason.

### Managing Category Groups

Category groups link related skills across different categories (e.g., "Data Science" spanning Technology and Analytics):

1. Navigate to `u_skill_category_group.list`
2. Create a group with a name and description
3. Navigate to `u_m2m_skill_category_group.list`
4. Link skills and categories to the group

---

## System Configuration

### System Properties

| Property | Default | Purpose |
|----------|---------|---------|
| `skills_hub.tier_config` | JSON object | Scoring weights and tier definitions |
| `skills_hub.scoring_enabled` | `true` | Enable/disable gamification scoring |

### Modifying Tier Configuration

The tier system is configured via the `skills_hub.tier_config` system property. To modify:

1. Navigate to **System Properties > All Properties**
2. Search for `skills_hub.tier_config`
3. Edit the JSON value

```json
{
  "scoring": {
    "per_skill": 10,
    "endorsement_received": 5,
    "endorsement_given": 3,
    "manager_validated": 15,
    "skill_added_this_quarter": 8,
    "proficiency_bonus": {
      "novice": 2,
      "intermediate": 5,
      "proficient": 10,
      "advanced": 20,
      "expert": 35
    }
  },
  "tiers": [
    { "name": "Starter", "icon": "fa-seedling", "min": 0 },
    { "name": "Contributor", "icon": "fa-hand-holding-heart", "min": 50 },
    { "name": "Specialist", "icon": "fa-star", "min": 150 },
    { "name": "Trailblazer", "icon": "fa-fire", "min": 300 },
    { "name": "Luminary", "icon": "fa-sun", "min": 500 }
  ]
}
```

Changes take effect immediately on next page load (no restart required).

### Skill Expiration Period

The daily expiration job checks for skills not validated in over 12 months. To change this period, modify the scheduled job script:

1. Navigate to **System Scheduler > Scheduled Jobs**
2. Find **"Skills Hub - Skill Expiration Check"**
3. In the script, change the `gs.monthsAgo(12)` value

---

## Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| **Skills Hub - Skill Expiration Check** | Daily at 02:00 | Flags validated skills older than 12 months as "Expired" |
| **Skills Hub - Monthly Validation Reminder** | 1st of each month at 08:00 | Emails managers with pending validation counts |

### Monitoring Scheduled Jobs

1. Navigate to **System Scheduler > Scheduled Jobs**
2. Search for "Skills Hub"
3. Check the **Last run** and **Next run** fields
4. Review **System Logs** for `[Skills Hub]` entries after each run

---

## Email Notifications

Seven notifications are configured:

| Notification | Table | Trigger |
|-------------|-------|---------|
| Skill Request Submitted | `u_skill_request` | Insert (status = pending) |
| Skill Request Approved | `u_skill_request` | Update (status changes to approved) |
| Skill Request Rejected | `u_skill_request` | Update (status changes to rejected) |
| Skill Validated by Manager | `sys_user_has_skill` | Update (validation_status changes to validated) |
| Skill Disputed by Manager | `sys_user_has_skill` | Update (validation_status changes to disputed) |
| Skill Endorsed | `u_m2m_skill_endorsement` | Insert |
| Monthly Validation Reminder | Event-based | `skills_hub.validation_reminder` event |

To disable a notification: find it in **System Notification > Email > Notifications**, search by name, and set Active to false.

---

## Access Controls (ACLs)

### Summary

| Table | Read | Create | Write | Delete |
|-------|------|--------|-------|--------|
| `u_m2m_skill_endorsement` | skill_user | skill_user (own endorser only) | skill_user | endorser or admin |
| `sys_user_has_skill.u_interest_level` | — | — | record owner | — |
| `sys_user_has_skill.u_manager_assessed_level` | — | — | employee's manager or admin | — |
| `sys_user_has_skill.u_validation_status` | — | — | employee's manager or admin | — |
| `sys_user_has_skill.u_validation_notes` | — | — | employee's manager or admin | — |
| `u_skill_request` | skill_user | skill_user | skill_admin | admin |
| `u_skill_profile_requirement` | skill_user | admin | admin | admin |
| `u_skill_category_group` | — | skill_admin or admin | skill_admin or admin | skill_admin or admin |

### Testing ACLs

After deployment, verify ACLs by testing with users in each role:

1. **As skill_user**: Can read endorsements, create endorsements, edit own interest level, submit skill requests
2. **As skill_manager**: Can validate/dispute direct reports' skills, set manager assessments
3. **As skill_admin**: Can approve/reject skill requests, manage category groups
4. **As admin**: Full access to all tables

---

## Troubleshooting

### Common Issues

**Issue: Employee can't access Skills Hub portal page**
- Verify the user has the `skill_user` role
- Check the `sp_page` record for `skills_hub` exists and is not set to public=false without appropriate access
- Verify the Service Portal is accessible

**Issue: Manager View tab not showing**
- The tab only appears if the user has active direct reports (manager field on `sys_user`)
- Verify in User Administration that employees have the correct manager set
- The `skill_manager` role is not required for the tab to appear — only direct reports

**Issue: Endorsement count is wrong**
- The count is maintained by business rules on `u_m2m_skill_endorsement`
- To fix a miscount, run this background script:
```javascript
var gr = new GlideRecord('sys_user_has_skill');
gr.addQuery('sys_id', '<skill_record_sys_id>');
gr.query();
if (gr.next()) {
    var count = new GlideAggregate('u_m2m_skill_endorsement');
    count.addQuery('u_skill_record', gr.getUniqueValue());
    count.addAggregate('COUNT');
    count.query();
    var actual = 0;
    if (count.next()) {
        actual = parseInt(count.getAggregate('COUNT'));
    }
    gr.setValue('u_peer_endorsement_count', actual);
    gr.update();
    gs.info('Updated endorsement count to: ' + actual);
}
```

**Issue: Skill not syncing across categories**
- The "Sync Cross-Category Skill Scores" business rule only fires when `skill_level` changes
- Verify the business rule is active: **System Definition > Business Rules**, search for "Sync Cross-Category"
- The sync matches by skill *name*, not sys_id

**Issue: Notifications not sending**
- Check **System Notification > Email > Notifications** — verify the notification is active
- Check **System Logs > Email Log** for errors
- For the monthly reminder, verify the event is registered: search `sysevent_register` for `skills_hub.validation_reminder`
- Verify the notification is linked to the event via the `event_name` field

**Issue: Gamification points seem wrong**
- Points are calculated in real-time from current data — there is no cached score
- Review the `skills_hub.tier_config` system property for correct scoring weights
- Check if `skills_hub.scoring_enabled` is set to `true`

**Issue: Records went to the wrong update set**
- Query `sys_update_xml` to find misplaced records:
```
update_set=<wrong_set_id>^sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()
```
- Use `SN-Update-Record` on `sys_update_xml` to move records to the correct update set

### Checking System Health

Run the verification scripts to check deployment status:

| Script | Phase | Purpose |
|--------|-------|---------|
| `09_verification.js` | Phase 1 | Tables, fields, choices, roles, BRs, ACLs |
| `17_verification_phase2.js` | Phase 2 | Catalog, notifications, utils methods, widgets |
| `26_verification_phase3.js` | Phase 3 | Tier system, leaderboard, navigation, grouping |
| `33_verification_phase4.js` | Phase 4 | Demand tables, PA indicators, detection, gap analysis |

These are read-only and safe to run at any time via Scripts - Background.

---

## Update Set Management

All Skills Hub artifacts are organized into four update sets:

| Update Set | Contents |
|------------|----------|
| Skills Hub - Phase 1 - Foundation | Tables, fields, choices, roles, business rules, ACLs, seed data |
| Skills Hub - Phase 2 - Process & Workflow | Catalog item, approval BRs, notifications, utils methods, widget patches, scheduled jobs |
| Skills Hub - Phase 3 - UI Enhancements | Tier system, leaderboard widget, tab navigation, category modal, nav modules |
| Skills Hub - Phase 4 - Analytics & Reporting | Demand table, PA indicators/dashboard, gap analysis widget, skill detection |

When promoting to production, migrate update sets in order (Phase 1 first, then 2, 3, 4) to ensure dependencies are met.
