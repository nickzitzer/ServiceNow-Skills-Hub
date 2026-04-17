// ==========================================================
// Phase 3 Batch 3: Link Skills for 'Epic Patient Access'
// Table: cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase3-EpicPatientAccess';
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

linkSkillToCategory('On My Way', 'MyChart', 'Epic Patient Access');
linkSkillToCategory('MFG Department / Visit Types', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('MFG Project Creation', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('MFG Notifications', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Mychart Self Scheduling', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Hello Patient', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Hello World', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Financial Clearence Hard Stops / Scheduling', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Lab Scheduling', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Provider Consults', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Scheduling Workflows', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('HARs (Auto and Manually Created)', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('SDF', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Arrival Time', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Fast Pass', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Resource Creation', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Provider Creation', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('SER', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Provider / Resource Templates', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Visit Guides', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Welcome Kiosk', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Results Routing', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Self Pay / OON Override Process', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Silent Scheduling', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('One Click Scheduling', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Cadence Reports', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Order Based Scheduling', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Cheers CRM', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Cheers Call Hub', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Cheers Campaigns', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('DARs', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Cadence Letters', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Cadence Printing', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Appointment Desk', 'Patient Access', 'Epic Patient Access');
linkSkillToCategory('Payment Collection', 'Patient Access', 'Epic Patient Access');

gs.info(LOG + ': Linked ' + linked + ' skills to groups under Epic Patient Access');