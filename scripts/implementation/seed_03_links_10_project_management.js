// ==========================================================
// Phase 3 Batch 10: Link Skills for 'Project Management'
// Table: cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase3-ProjectManagement';
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

linkSkillToCategory('Budget Development', 'Budget', 'Project Management');
linkSkillToCategory('Expense Tracking', 'Budget', 'Project Management');
linkSkillToCategory('Status Reporting', 'Communication', 'Project Management');
linkSkillToCategory('Meeting Facilitation', 'Communication', 'Project Management');
linkSkillToCategory('Stakeholder Management', 'Communication', 'Project Management');
linkSkillToCategory('Build Documentation', 'Quality', 'Project Management');
linkSkillToCategory('Testing Management', 'Quality', 'Project Management');
linkSkillToCategory('Sign-off & Approval', 'Quality', 'Project Management');
linkSkillToCategory('Risk Identification', 'Risk', 'Project Management');
linkSkillToCategory('Issue Management', 'Risk', 'Project Management');
linkSkillToCategory('Mitigation Planning', 'Risk', 'Project Management');
linkSkillToCategory('Work Planning', 'Schedule', 'Project Management');
linkSkillToCategory('Progress Tracking', 'Schedule', 'Project Management');
linkSkillToCategory('Requirements Gathering', 'Scope', 'Project Management');
linkSkillToCategory('Scope Definition', 'Scope', 'Project Management');
linkSkillToCategory('Change Control', 'Scope', 'Project Management');
linkSkillToCategory('Contract Management', 'Vendor', 'Project Management');
linkSkillToCategory('Vendor Coordination', 'Vendor', 'Project Management');

gs.info(LOG + ': Linked ' + linked + ' skills to groups under Project Management');