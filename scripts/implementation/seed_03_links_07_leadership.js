// ==========================================================
// Phase 3 Batch 7: Link Skills for 'Leadership'
// Table: cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase3-Leadership';
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

linkSkillToCategory('Adoption Strategy', 'Change Management', 'Leadership');
linkSkillToCategory('Training Strategy', 'Change Management', 'Leadership');
linkSkillToCategory('Communication Strategy', 'Change Management', 'Leadership');
linkSkillToCategory('Go-Live Planning', 'Operational Transition', 'Leadership');
linkSkillToCategory('Stabilization', 'Operational Transition', 'Leadership');
linkSkillToCategory('Lessons Learned', 'Operational Transition', 'Leadership');
linkSkillToCategory('IT Leadership Relations', 'Stakeholder Partnership', 'Leadership');
linkSkillToCategory('Clinical Leadership', 'Stakeholder Partnership', 'Leadership');
linkSkillToCategory('Vendor Relations', 'Stakeholder Partnership', 'Leadership');
linkSkillToCategory('Team Development', 'Team Leadership', 'Leadership');
linkSkillToCategory('Conflict Resolution', 'Team Leadership', 'Leadership');
linkSkillToCategory('Capacity Management', 'Team Leadership', 'Leadership');

gs.info(LOG + ': Linked ' + linked + ' skills to groups under Leadership');