// ==========================================================
// Phase 3 Batch 1: Link Skills for 'Epic Access'
// Table: cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase3-EpicAccess';
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

linkSkillToCategory('Visit Types', 'Cadence', 'Epic Access');
linkSkillToCategory('Departments', 'Cadence', 'Epic Access');
linkSkillToCategory('Decision Tree', 'Cadence', 'Epic Access');
linkSkillToCategory('Rules', 'Cadence', 'Epic Access');
linkSkillToCategory('Patient WQs', 'Cadence', 'Epic Access');
linkSkillToCategory('Appt Request WQs', 'Cadence', 'Epic Access');
linkSkillToCategory('Tiered Pools', 'Cadence', 'Epic Access');
linkSkillToCategory('Subgroups', 'Cadence', 'Epic Access');
linkSkillToCategory('Category List Maintenance', 'Cadence', 'Epic Access');
linkSkillToCategory('Batch Jobs', 'Cadence', 'Epic Access');
linkSkillToCategory('Import/Export', 'Cadence', 'Epic Access');
linkSkillToCategory('Data Courier', 'Cadence', 'Epic Access');
linkSkillToCategory('SmartTools', 'Cadence', 'Epic Access');
linkSkillToCategory('Extension Records', 'Cadence', 'Epic Access');
linkSkillToCategory('Security', 'Cadence', 'Epic Access');
linkSkillToCategory('Front End Reports', 'Cadence', 'Epic Access');
linkSkillToCategory('Advantage Activities', 'Cadence', 'Epic Access');

gs.info(LOG + ': Linked ' + linked + ' skills to groups under Epic Access');