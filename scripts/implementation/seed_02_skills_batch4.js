// ==========================================================
// Phase 2 Batch 4: Create Skills (301-400 of 412)
// Table: cmn_skill
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase2-Batch4';
var created = 0, found = 0;

function findOrCreate(table, query, fields) {
    var gr = new GlideRecord(table);
    gr.addEncodedQuery(query);
    gr.query();
    if (gr.next()) { found++; return gr.getUniqueValue(); }
    gr.initialize();
    for (var f in fields) gr.setValue(f, fields[f]);
    var id = gr.insert();
    if (id) created++;
    return id;
}

findOrCreate('cmn_skill', 'name=Question build', { name: 'Question build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Questionnaires build and workflows', { name: 'Questionnaires build and workflows', description: 'Assignment methods, governance, synopsis, print groups, flowsheets', active: 'true' });
findOrCreate('cmn_skill', 'name=ROI & Disclosure', { name: 'ROI & Disclosure', description: 'Release of information, authorizations', active: 'true' });
findOrCreate('cmn_skill', 'name=RTE', { name: 'RTE', description: 'Real-time eligibility', active: 'true' });
findOrCreate('cmn_skill', 'name=Radiology Orders', { name: 'Radiology Orders', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Referral Authorizations - Outpatient', { name: 'Referral Authorizations - Outpatient', description: 'Referral management, prior authorization', active: 'true' });
findOrCreate('cmn_skill', 'name=Referral workqueue', { name: 'Referral workqueue', description: 'Treatment plan, medication authorization requests', active: 'true' });
findOrCreate('cmn_skill', 'name=Registration Consent Forms', { name: 'Registration Consent Forms', description: 'Prelude Registration Consents / Forms Management', active: 'true' });
findOrCreate('cmn_skill', 'name=Registration Letters', { name: 'Registration Letters', description: 'Real-time eligibility', active: 'true' });
findOrCreate('cmn_skill', 'name=Rehab', { name: 'Rehab', description: 'Therapy documentation, functional assessments', active: 'true' });
findOrCreate('cmn_skill', 'name=Rehab Module', { name: 'Rehab Module', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting - Chronicles', { name: 'Reporting - Chronicles', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting - Crystal Reports / Clarity SQL', { name: 'Reporting - Crystal Reports / Clarity SQL', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting - Network Search', { name: 'Reporting - Network Search', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting - Orders Report Program', { name: 'Reporting - Orders Report Program', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting - Reporting Workbench', { name: 'Reporting - Reporting Workbench', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting - Slicer Dicer', { name: 'Reporting - Slicer Dicer', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting Dashboard', { name: 'Reporting Dashboard', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reporting Tools', { name: 'Reporting Tools', description: 'Reporting Workbench and Dashboards', active: 'true' });
findOrCreate('cmn_skill', 'name=Reports', { name: 'Reports', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Reports and Print Group build', { name: 'Reports and Print Group build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Requirements Gathering', { name: 'Requirements Gathering', description: 'Elicitation, documentation, validation', active: 'true' });
findOrCreate('cmn_skill', 'name=Research', { name: 'Research', description: 'Study records, recruiting tools, RW, OPAs', active: 'true' });
findOrCreate('cmn_skill', 'name=Resource Creation', { name: 'Resource Creation', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Respiratory Therapy', { name: 'Respiratory Therapy', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Results Routing', { name: 'Results Routing', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Risk Identification', { name: 'Risk Identification', description: 'Risk register, assessment, scoring', active: 'true' });
findOrCreate('cmn_skill', 'name=Rover set up and workflows', { name: 'Rover set up and workflows', description: 'Configuration and management of Rover app and Devices', active: 'true' });
findOrCreate('cmn_skill', 'name=Rule Creation', { name: 'Rule Creation', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Rules', { name: 'Rules', description: 'Creation and modification', active: 'true' });
findOrCreate('cmn_skill', 'name=SANE (Sexual Assault Nurse)', { name: 'SANE (Sexual Assault Nurse)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=SDF', { name: 'SDF', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=SER', { name: 'SER', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Schedulable orders', { name: 'Schedulable orders', description: 'Scheduling based on orders within treatment or therapy plans', active: 'true' });
findOrCreate('cmn_skill', 'name=Scheduling', { name: 'Scheduling', description: 'Snapboard, referrals', active: 'true' });
findOrCreate('cmn_skill', 'name=Scheduling Workflows', { name: 'Scheduling Workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Scope Definition', { name: 'Scope Definition', description: 'WBS, deliverables, boundaries', active: 'true' });
findOrCreate('cmn_skill', 'name=Secure Chat group build', { name: 'Secure Chat group build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Security', { name: 'Security', description: 'User provisioning, EMP templates, roles', active: 'true' });
findOrCreate('cmn_skill', 'name=Security & Access', { name: 'Security & Access', description: 'User provisioning, EMP templates, roles', active: 'true' });
findOrCreate('cmn_skill', 'name=Security Liason', { name: 'Security Liason', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Self Pay / OON Override Process', { name: 'Self Pay / OON Override Process', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow CAB / Change Records / Standard Changes', { name: 'ServiceNow CAB / Change Records / Standard Changes', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Dashboard Creation', { name: 'ServiceNow Dashboard Creation', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Demand / Project Creation and Management', { name: 'ServiceNow Demand / Project Creation and Management', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Group Ownership', { name: 'ServiceNow Group Ownership', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Knowledge Document Creations', { name: 'ServiceNow Knowledge Document Creations', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Problem Records', { name: 'ServiceNow Problem Records', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Program Creations and Management', { name: 'ServiceNow Program Creations and Management', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Resource Reports / Capacity Management', { name: 'ServiceNow Resource Reports / Capacity Management', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow SLA Creation', { name: 'ServiceNow SLA Creation', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Time Sheets', { name: 'ServiceNow Time Sheets', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ServiceNow Workflows', { name: 'ServiceNow Workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=SharePoint Creation and Maintenance', { name: 'SharePoint Creation and Maintenance', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Sign-off & Approval', { name: 'Sign-off & Approval', description: 'Milestone acceptance, go/no-go', active: 'true' });
findOrCreate('cmn_skill', 'name=Silent Scheduling', { name: 'Silent Scheduling', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Simple visit coding', { name: 'Simple visit coding', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=SmartForm / PROC Doc', { name: 'SmartForm / PROC Doc', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=SmartForms/ProcDoc Build', { name: 'SmartForms/ProcDoc Build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=SmartTools', { name: 'SmartTools', description: 'SmartSets; SmartLinks; SmartList; SmartPhrase', active: 'true' });
findOrCreate('cmn_skill', 'name=Speech Therapy', { name: 'Speech Therapy', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Spiritual Care (Pastoral Care)', { name: 'Spiritual Care (Pastoral Care)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Stabilization', { name: 'Stabilization', description: 'Issue triage, optimization priorities', active: 'true' });
findOrCreate('cmn_skill', 'name=Stakeholder Management', { name: 'Stakeholder Management', description: 'RACI, engagement, updates', active: 'true' });
findOrCreate('cmn_skill', 'name=Statements', { name: 'Statements', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Status Reporting', { name: 'Status Reporting', description: 'Dashboards, scorecards, exec updates', active: 'true' });
findOrCreate('cmn_skill', 'name=Storyboard', { name: 'Storyboard', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Storyboard build', { name: 'Storyboard build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Subgroups', { name: 'Subgroups', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Support Desk', { name: 'Support Desk', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Survivorship workflow', { name: 'Survivorship workflow', description: 'Treatment summary', active: 'true' });
findOrCreate('cmn_skill', 'name=Synopsis Build', { name: 'Synopsis Build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=System Definitions (Facility, Service Area, Location)', { name: 'System Definitions (Facility, Service Area, Location)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=System Lists', { name: 'System Lists', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Tapestry Contracts', { name: 'Tapestry Contracts', description: 'Contract loading, fee schedules', active: 'true' });
findOrCreate('cmn_skill', 'name=Team Development', { name: 'Team Development', description: 'Coaching, mentoring, performance', active: 'true' });
findOrCreate('cmn_skill', 'name=Technical Review', { name: 'Technical Review', description: 'Discuss options for Community Connect clients', active: 'true' });
findOrCreate('cmn_skill', 'name=Testing Management', { name: 'Testing Management', description: 'Test planning, defect tracking, UAT', active: 'true' });
findOrCreate('cmn_skill', 'name=Therapy Plan build and workflows', { name: 'Therapy Plan build and workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Therapy Plans', { name: 'Therapy Plans', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Tiered Pools', { name: 'Tiered Pools', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Track Board build', { name: 'Track Board build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Training Strategy', { name: 'Training Strategy', description: 'Curriculum design, champion programs', active: 'true' });
findOrCreate('cmn_skill', 'name=Transaction History', { name: 'Transaction History', description: 'Read Epic Transaction Logs, Determine what posted, adjusted, moved buckets, triggerd follow up', active: 'true' });
findOrCreate('cmn_skill', 'name=Transfer Center', { name: 'Transfer Center', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Transplant build and workflows', { name: 'Transplant build and workflows', description: 'Transplant episodes, checklists, solid organ transplant', active: 'true' });
findOrCreate('cmn_skill', 'name=Treatment Teams', { name: 'Treatment Teams', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Triage Workflows', { name: 'Triage Workflows', description: 'ESI scoring, chief complaint, quick registration', active: 'true' });
findOrCreate('cmn_skill', 'name=UM & Cost Tracking', { name: 'UM & Cost Tracking', description: 'Utilization management, cost analysis', active: 'true' });
findOrCreate('cmn_skill', 'name=Updates to Base Profile [1000]', { name: 'Updates to Base Profile [1000]', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Updates to LSD', { name: 'Updates to LSD', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Urgent Care', { name: 'Urgent Care', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Vendor Coordination', { name: 'Vendor Coordination', description: 'Resource management, escalation', active: 'true' });
findOrCreate('cmn_skill', 'name=Vendor Relations', { name: 'Vendor Relations', description: 'Epic TS, third-party partners', active: 'true' });
findOrCreate('cmn_skill', 'name=Visit Guides', { name: 'Visit Guides', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Visit Types', { name: 'Visit Types', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Visit Workflows', { name: 'Visit Workflows', description: 'Check-in, rooming, documentation, checkout', active: 'true' });
findOrCreate('cmn_skill', 'name=WFE Rules', { name: 'WFE Rules', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Welcome Kiosk', { name: 'Welcome Kiosk', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Welcome Tablets', { name: 'Welcome Tablets', description: 'Configuration of Welcome on Tablets for Questionnaires', active: 'true' });

gs.info(LOG + ': Created ' + created + ', found existing ' + found);