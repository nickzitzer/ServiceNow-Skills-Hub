// ==========================================================
// Phase 3 Batch 4: Link Skills for 'Epic Revenue Cycle'
// Table: cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase3-EpicRevenueCycle';
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

linkSkillToCategory('Destination routing', 'Charge router', 'Epic Revenue Cycle');
linkSkillToCategory('Charge Entry', 'Charge router', 'Epic Revenue Cycle');
linkSkillToCategory('Charge Router', 'Charge router', 'Epic Revenue Cycle');
linkSkillToCategory('Charge Review', 'Charge router', 'Epic Revenue Cycle');
linkSkillToCategory('Handler', 'Charge router', 'Epic Revenue Cycle');
linkSkillToCategory('Workqueues', 'Charge router', 'Epic Revenue Cycle');
linkSkillToCategory('Transaction History', 'Charge router', 'Epic Revenue Cycle');
linkSkillToCategory('Inpatient Coding', 'HIM', 'Epic Revenue Cycle');
linkSkillToCategory('Deficiency Management', 'HIM', 'Epic Revenue Cycle');
linkSkillToCategory('ROI & Disclosure', 'HIM', 'Epic Revenue Cycle');
linkSkillToCategory('Document Management', 'HIM', 'Epic Revenue Cycle');
linkSkillToCategory('Coding', 'HIM', 'Epic Revenue Cycle');
linkSkillToCategory('Simple visit coding', 'HIM', 'Epic Revenue Cycle');
linkSkillToCategory('CDI', 'HIM', 'Epic Revenue Cycle');
linkSkillToCategory('Charge Capture', 'Hospital Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Claim Submission', 'Hospital Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Denial Management', 'Hospital Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Payment Posting', 'Hospital Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Account Follow-up', 'Hospital Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Statements', 'Hospital Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Insurance processing', 'Hospital Billing/Professional Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Prelude Registration Workflows', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('RTE', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Benefit Engine', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Payor Plan', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Patient Workqueues', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Registration Consent Forms', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Registration Letters', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Managed Care Plans', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Cadence Scheduling', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Authorization -  Inpatient', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Referral Authorizations - Outpatient', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Eligibility', 'Patient Access', 'Epic Revenue Cycle');
linkSkillToCategory('Tapestry Contracts', 'Payer Management', 'Epic Revenue Cycle');
linkSkillToCategory('Payer Plan Setup', 'Payer Management', 'Epic Revenue Cycle');
linkSkillToCategory('UM & Cost Tracking', 'Payer Management', 'Epic Revenue Cycle');
linkSkillToCategory('Charge Entry', 'Professional Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Claim Submission', 'Professional Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Coding Workflows', 'Professional Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Payment & Follow-up', 'Professional Billing', 'Epic Revenue Cycle');
linkSkillToCategory('Patient Cost Estimates', 'Resolute', 'Epic Revenue Cycle');

gs.info(LOG + ': Linked ' + linked + ' skills to groups under Epic Revenue Cycle');