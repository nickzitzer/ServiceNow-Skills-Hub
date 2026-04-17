// ==========================================================
// Phase 3 Batch 9: Link Skills for 'Professional Skills'
// Table: cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase3-ProfessionalSkills';
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

linkSkillToCategory('Epic Certification', 'Certifications', 'Professional Skills');
linkSkillToCategory('Project Management', 'Certifications', 'Professional Skills');
linkSkillToCategory('Healthcare IT', 'Certifications', 'Professional Skills');
linkSkillToCategory('Microsoft Viva Insights', 'Collaboration Tools', 'Professional Skills');
linkSkillToCategory('SharePoint Creation and Maintenance', 'Collaboration Tools', 'Professional Skills');
linkSkillToCategory('Microsoft Loop', 'Collaboration Tools', 'Professional Skills');
linkSkillToCategory('Clinical Workflows', 'Domain Knowledge', 'Professional Skills');
linkSkillToCategory('Healthcare Regulatory', 'Domain Knowledge', 'Professional Skills');
linkSkillToCategory('ServiceNow Dashboard Creation', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Workflows', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Program Creations and Management', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Group Ownership', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow CAB / Change Records / Standard Changes', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Resource Reports / Capacity Management', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Demand / Project Creation and Management', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Problem Records', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Time Sheets', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow SLA Creation', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('ServiceNow Knowledge Document Creations', 'ITSM Platform', 'Professional Skills');
linkSkillToCategory('Microsoft PowerBI', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft Copilot', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft OneNote', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft Planner', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft Visio', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft Excel', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft Project', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft ToDo', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft PowerPoint', 'Productivity Suite', 'Professional Skills');
linkSkillToCategory('Microsoft Access', 'Productivity Suite', 'Professional Skills');

gs.info(LOG + ': Linked ' + linked + ' skills to groups under Professional Skills');