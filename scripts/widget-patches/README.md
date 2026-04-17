# Widget Patch Files

Complete replacement code for three Service Portal widgets.
Copy-paste each file into the corresponding widget field via the Widget Editor.

## 1. Skills Hub - Manager Matrix (`skills-hub-matrix`)

| File | Paste Into |
|------|-----------|
| `manager-matrix-server.js` | Server Script |
| `manager-matrix-client.js` | Client Controller |
| `manager-matrix-template.html` | Body HTML Template |
| `manager-matrix-css.css` | CSS |

**Added:** dispute action with modal, bulkValidate action, manager authorization check on all actions, disputed stat card, status filter (click stat cards to filter), validation status badges.

## 2. Skills Hub - Find Expert (`skills-hub-find`)

| File | Paste Into |
|------|-----------|
| `find-expert-server.js` | Server Script |
| `find-expert-client.js` | Client Controller |

Template and CSS are **unchanged** — no need to touch those.

**Added:** `endorse` server action that creates `u_m2m_skill_endorsement` records with self-endorsement and duplicate prevention. Client `endorse()` now calls server instead of just showing a toast. Each search result now carries `skill_record_id` for targeting endorsements.

## 3. Skills Hub - My Profile (`skills-hub-profile`)

| File | Paste Into |
|------|-----------|
| `my-profile-server.js` | Server Script |
| `my-profile-template.html` | Body HTML Template |
| `my-profile-css.css` | CSS |

Client Controller is **unchanged** — no need to touch that.

**Added:** Tier system replaces gamification card. Server calculates points (skills owned, proficiency bonus, endorsements received/given, validated skills, quarterly additions) and determines tier (Starter/Contributor/Specialist/Trailblazer/Luminary). Template shows tier badge with icon, points, progress bar to next tier. Each skill card now shows validation status badge (green check or red warning).
