# Skills Hub - Deployment Guide

**Project**: ServiceNow Skills Hub Enhancement
**Execution Mode**: Fix Script (Scripts - Background, Global Scope)
**Total Scripts**: 33 across 4 phases

---

## Prerequisites

1. ServiceNow instance with admin access
2. Service Portal with existing Skills Hub widgets deployed (from initial update set)
3. Existing tables: `sys_user_has_skill`, `cmn_skill`, `cmn_skill_category`, `u_m2m_skill_endorsement`
4. For Phase 4: Performance Analytics plugin activated (optional — scripts degrade gracefully)

---

## General Instructions

1. Navigate to **System Definition > Scripts - Background**
2. Set scope to **Global**
3. Copy-paste each script and click **Run**
4. Review output in the log area for `[Skills Hub]` entries
5. All scripts are **idempotent** — safe to re-run if errors occur
6. Run scripts **in order** within each phase
7. Run the **verification script** at the end of each phase before moving to the next

---

## Phase 1: Foundation & Data Model

| Order | Script | Creates | Duration |
|-------|--------|---------|----------|
| 1 | `01_create_update_set.js` | Update set "Skills Hub - Phase 1 - Foundation" | ~5s |
| 2 | `02_create_tables.js` | 4 tables: u_skill_request, u_skill_profile_requirement, u_skill_category_group, u_m2m_skill_category_group | ~15s |
| 3 | `03_create_fields.js` | 3 fields on sys_user_has_skill: u_manager_assessed_level, u_validation_status, u_validation_notes | ~10s |
| 4 | `04_create_choices.js` | 20 choice values across 5 fields | ~10s |
| 5 | `05_create_roles.js` | 2 roles: skill_admin, skill_manager | ~5s |
| 6 | `06_create_business_rules.js` | 6 business rules + 1 scheduled job (Skill Expiration Check) | ~15s |
| 7 | `07_create_acls.js` | 15 ACLs with role assignments | ~20s |
| 8 | `08_seed_data.js` | 5 profile requirements, 1 category group, 2 system properties (tier config) | ~10s |
| 9 | `09_verification.js` | **READ-ONLY** — verifies all Phase 1 artifacts | ~10s |

**Expected verification result**: All checks pass (tables, fields, choices, roles, BRs, ACLs, properties)

---

## Phase 2: Process & Workflow

| Order | Script | Creates | Duration |
|-------|--------|---------|----------|
| 1 | `10_create_update_set_phase2.js` | Update set "Skills Hub - Phase 2 - Process & Workflow" | ~5s |
| 2 | `11_create_catalog_item.js` | Catalog category + "Request New Skill" item + 3 variables | ~10s |
| 3 | `12_create_workflow.js` | 2 business rules for skill request approval workflow | ~10s |
| 4 | `13_create_notifications.js` | 5 email notification templates | ~15s |
| 5 | `14_update_skills_hub_utils.js` | 5 new methods on SkillsHubUtils (validate, dispute, bulkValidate, setManagerAssessment, endorse) | ~10s |
| 6 | `15_update_widget_server_scripts.js` | Patches Find Expert (endorse) + Manager Matrix (validate/dispute/bulkValidate) server scripts | ~10s |
| 7 | `16_create_scheduled_jobs.js` | Monthly Validation Reminder job + event registration | ~5s |
| 8 | `17_verification_phase2.js` | **READ-ONLY** — verifies all Phase 2 artifacts | ~10s |

**Expected verification result**: All checks pass (catalog item, variables, BRs, notifications, script include methods, widget patches, scheduled job, event)

---

## Phase 3: UI Enhancements

| Order | Script | Creates | Duration |
|-------|--------|---------|----------|
| 1 | `18_create_update_set_phase3.js` | Update set "Skills Hub - Phase 3 - UI Enhancements" | ~5s |
| 2 | `19_create_tier_system.js` | calculateUserTier() method in SkillsHubUtils | ~10s |
| 3 | `20_update_my_profile_tier.js` | Tier badge display in My Profile widget (server + template + CSS) | ~15s |
| 4 | `21_create_leaderboard_widget.js` | New "Skills Hub - Leaderboard" widget (full widget creation) | ~15s |
| 5 | `22_create_skill_grouping_logic.js` | New "SkillsHubGrouping" Script Include | ~10s |
| 6 | `23_update_add_skill_modal.js` | Multi-category skill add modal in My Profile | ~15s |
| 7 | `24_create_nav_modules.js` | Application menu + 4 navigation modules + portal page | ~10s |
| 8 | `25_create_tab_navigation.js` | New "Skills Hub - Tab Navigation" widget | ~10s |
| 9 | `26_verification_phase3.js` | **READ-ONLY** — verifies all Phase 3 artifacts | ~10s |

**Expected verification result**: All checks pass (update set, tier methods, widgets, script includes, nav modules, portal page)

---

## Phase 4: Analytics & Reporting

| Order | Script | Creates | Duration |
|-------|--------|---------|----------|
| 1 | `27_create_update_set_phase4.js` | Update set "Skills Hub - Phase 4 - Analytics & Reporting" | ~5s |
| 2 | `28_create_demand_tables.js` | u_story_skill_assignment table with fields + choices | ~15s |
| 3 | `29_create_pa_indicators.js` | 6 PA indicators + 2 breakdowns + indicator-breakdown links | ~20s |
| 4 | `30_create_pa_dashboard.js` | PA dashboard with 3 tabs + 7 widgets | ~15s |
| 5 | `31_create_gap_analysis_widget.js` | New "Skills Hub - Gap Analysis" widget | ~15s |
| 6 | `32_create_skill_detection.js` | New "SkillsHubDetection" Script Include (auto-tagging) | ~10s |
| 7 | `33_verification_phase4.js` | **READ-ONLY** — verifies all Phase 4 artifacts | ~10s |

**Note**: Scripts 29 and 30 require the Performance Analytics plugin. If not activated, they will log warnings and skip PA record creation gracefully.

---

## Post-Deployment Checklist

### After Each Phase
- [ ] Run verification script — all checks should pass
- [ ] Review System Logs for `[Skills Hub]` entries
- [ ] Verify update set has captured all records (check `sys_update_xml`)
- [ ] Check no records leaked to "Default" update set
- [ ] Test with at least 2 roles: admin and regular user

### After All Phases Complete
- [ ] Complete update set — change state from "In Progress" to "Complete" for each phase
- [ ] Export update sets as XML for version control
- [ ] Test full workflow: add skill → endorse → manager validate → check tier
- [ ] Test catalog: Request New Skill → approval → skill created
- [ ] Verify portal navigation and tab switching
- [ ] Review PA dashboard (if Phase 4 deployed)
- [ ] Document any instance-specific customizations

---

## Troubleshooting

### Script fails with "Table not found"
Run scripts in order. Table creation (script 02/28) must complete before field/choice scripts.

### Records in wrong update set
Use `SN-Update-Record` on `sys_update_xml` table to move records to the correct update set. Query: `update_set=<wrong_id>^nameLIKEskill`

### Widget not found
Widgets are referenced by name (e.g., "Skills Hub - Find Expert"). Ensure the original update set with base widgets was imported before running Phase 2+ scripts.

### PA indicators not created
Verify the Performance Analytics plugin is activated: `pa_indicators` table must exist. Scripts 29-30 check for this and skip gracefully.

### SkillsHubUtils method injection fails
The injection scripts (14, 19) look for the marker `type: 'SkillsHubUtils'` in the script body. Ensure the Script Include exists and uses the standard `Class.create()` pattern.

---

## Update Set Summary

| Phase | Update Set Name | Expected Records |
|-------|----------------|-----------------|
| 1 | Skills Hub - Phase 1 - Foundation | ~45-60 |
| 2 | Skills Hub - Phase 2 - Process & Workflow | ~20-30 |
| 3 | Skills Hub - Phase 3 - UI Enhancements | ~15-25 |
| 4 | Skills Hub - Phase 4 - Analytics & Reporting | ~25-35 |

---

## Architecture Reference

See `knowledge/design/SKILLS-HUB-ROADMAP.md` for the complete roadmap, tier system design, and risk register.
