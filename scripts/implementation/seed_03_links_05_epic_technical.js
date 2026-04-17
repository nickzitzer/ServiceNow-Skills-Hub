// ==========================================================
// Phase 3 Batch 5: Link Skills for 'Epic Technical'
// Table: cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase3-EpicTechnical';
var linked = 0;

function findSysId(table, query) {
    var gr = new GlideRecord(table);
    gr.addEncodedQuery(query);
    gr.query();
    if (gr.next()) return gr.getUniqueValue();
    return null;
}

function linkSkillToCategory(skillName, groupName, parentName) {
    var skillId = findSysId('cmn_skill', 'name=' + skillName);
    var parentId = findSysId('cmn_skill_category', 'name=' + parentName + '^parentISEMPTY');
    if (!parentId) { gs.warn(LOG + ': Parent category not found: ' + parentName); return; }
    var groupId = findSysId('cmn_skill_category', 'name=' + groupName + '^parent=' + parentId);
    if (!skillId) { gs.warn(LOG + ': Skill not found: ' + skillName); return; }
    if (!groupId) { gs.warn(LOG + ': Group not found: ' + groupName + ' under ' + parentName); return; }
    // Check if link already exists
    var m2m = new GlideRecord('cmn_skill_m2m_category');
    m2m.addQuery('skill', skillId);
    m2m.addQuery('category', groupId);
    m2m.query();
    if (m2m.next()) return;
    m2m.initialize();
    m2m.setValue('skill', skillId);
    m2m.setValue('category', groupId);
    m2m.insert();
    linked++;
}

linkSkillToCategory('Cogito Reporting', 'Analytics', 'Epic Technical');
linkSkillToCategory('Clarity Data Model', 'Analytics', 'Epic Technical');
linkSkillToCategory('Caboodle/Compass', 'Analytics', 'Epic Technical');
linkSkillToCategory('Operational Reports', 'Analytics', 'Epic Technical');
linkSkillToCategory('Batch Jobs / Runs', 'Batches', 'Epic Technical');
linkSkillToCategory('Patient Outreach', 'Campaigns', 'Epic Technical');
linkSkillToCategory('M Prompt', 'Epic Administration', 'Epic Technical');
linkSkillToCategory('Bridges/Interfaces', 'Integration', 'Epic Technical');
linkSkillToCategory('Care Everywhere', 'Integration', 'Epic Technical');
linkSkillToCategory('Device Integration', 'Integration', 'Epic Technical');
linkSkillToCategory('External Applications', 'Integration', 'Epic Technical');
linkSkillToCategory('MyChart Configuration', 'Patient Engagement', 'Epic Technical');
linkSkillToCategory('Digital Front Door', 'Patient Engagement', 'Epic Technical');
linkSkillToCategory('EpicCare Link', 'Patient Engagement', 'Epic Technical');
linkSkillToCategory('MyChart Bedside', 'Patient Engagement', 'Epic Technical');
linkSkillToCategory('Printing Configuration', 'Printing', 'Epic Technical');
linkSkillToCategory('Build Tools', 'System Admin', 'Epic Technical');
linkSkillToCategory('Environment Management', 'System Admin', 'Epic Technical');
linkSkillToCategory('Chronicles/MyChart Admin', 'System Admin', 'Epic Technical');
linkSkillToCategory('Epic Provisioning', 'System Admin', 'Epic Technical');
linkSkillToCategory('Epic Security Liaison', 'System Admin', 'Epic Technical');
linkSkillToCategory('Epic Security Governance', 'System Admin', 'Epic Technical');

gs.info(LOG + ': Linked ' + linked + ' skills to groups under Epic Technical');