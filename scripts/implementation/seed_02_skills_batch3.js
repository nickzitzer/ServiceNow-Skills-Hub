// ==========================================================
// Phase 2 Batch 3: Create Skills (201-300 of 412)
// Table: cmn_skill
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase2-Batch3';
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

findOrCreate('cmn_skill', 'name=Lab charge messages', { name: 'Lab charge messages', description: 'Cloning, bundles, atributes, routing', active: 'true' });
findOrCreate('cmn_skill', 'name=Lab order transmittal', { name: 'Lab order transmittal', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Lessons Learned', { name: 'Lessons Learned', description: 'Retrospectives, documentation', active: 'true' });
findOrCreate('cmn_skill', 'name=Logistics - Environmental Services', { name: 'Logistics - Environmental Services', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Logistics - Transport', { name: 'Logistics - Transport', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Long Term Care', { name: 'Long Term Care', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=M Prompt', { name: 'M Prompt', description: 'M prompt (Caché prompt) ability to run untracked, non-standard, or potentially unsafe code.', active: 'true' });
findOrCreate('cmn_skill', 'name=MFG Department / Visit Types', { name: 'MFG Department / Visit Types', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=MFG Notifications', { name: 'MFG Notifications', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=MFG Project Creation', { name: 'MFG Project Creation', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=MR Screening Tool', { name: 'MR Screening Tool', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Managed Care Plans', { name: 'Managed Care Plans', description: 'Prelude Managed Care Build', active: 'true' });
findOrCreate('cmn_skill', 'name=Medication Administration', { name: 'Medication Administration', description: 'MAR, barcode scanning, IV workflows', active: 'true' });
findOrCreate('cmn_skill', 'name=Meeting Facilitation', { name: 'Meeting Facilitation', description: 'Agendas, action items, decision logs', active: 'true' });
findOrCreate('cmn_skill', 'name=Microbiology workflows', { name: 'Microbiology workflows', description: 'plate-level documentation, organism configuration', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Access', { name: 'Microsoft Access', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Copilot', { name: 'Microsoft Copilot', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Excel', { name: 'Microsoft Excel', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Loop', { name: 'Microsoft Loop', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft OneNote', { name: 'Microsoft OneNote', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Planner', { name: 'Microsoft Planner', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft PowerBI', { name: 'Microsoft PowerBI', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft PowerPoint', { name: 'Microsoft PowerPoint', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Project', { name: 'Microsoft Project', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft ToDo', { name: 'Microsoft ToDo', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Visio', { name: 'Microsoft Visio', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Microsoft Viva Insights', { name: 'Microsoft Viva Insights', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Mitigation Planning', { name: 'Mitigation Planning', description: 'Response strategies, contingency', active: 'true' });
findOrCreate('cmn_skill', 'name=Molecular diagnostic build and workflows', { name: 'Molecular diagnostic build and workflows', description: 'Genetic resulting', active: 'true' });
findOrCreate('cmn_skill', 'name=Music Therapy', { name: 'Music Therapy', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=MyChart', { name: 'MyChart', description: 'Mapping pools for DEP and SER', active: 'true' });
findOrCreate('cmn_skill', 'name=MyChart Bedside', { name: 'MyChart Bedside', description: 'Inpatient patient engagement', active: 'true' });
findOrCreate('cmn_skill', 'name=MyChart Configuration', { name: 'MyChart Configuration', description: 'Portal features, proxy, teen accounts', active: 'true' });
findOrCreate('cmn_skill', 'name=Mychart Self Scheduling', { name: 'Mychart Self Scheduling', description: 'Ticket, Open and Direct', active: 'true' });
findOrCreate('cmn_skill', 'name=Navigator Build', { name: 'Navigator Build', description: 'Templates; Menus; Sections; Items; VCN', active: 'true' });
findOrCreate('cmn_skill', 'name=Navigators', { name: 'Navigators', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Note Build (Shared; Sensitive)', { name: 'Note Build (Shared; Sensitive)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Nurse Triage', { name: 'Nurse Triage', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Nursing Workflows', { name: 'Nursing Workflows', description: 'Handoff, task lists, worklists', active: 'true' });
findOrCreate('cmn_skill', 'name=Nutrition Services', { name: 'Nutrition Services', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=OB (Stork)', { name: 'OB (Stork)', description: 'Prenatal, L&D, postpartum', active: 'true' });
findOrCreate('cmn_skill', 'name=OPA\'s', { name: 'OPA\'s', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Occupational Therapy', { name: 'Occupational Therapy', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=On My Way', { name: 'On My Way', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Oncology build and  Workflows', { name: 'Oncology build and  Workflows', description: 'Treatment planning, protocols, infusion', active: 'true' });
findOrCreate('cmn_skill', 'name=Oncology workflows', { name: 'Oncology workflows', description: 'Medication order groups, Beacon, Med Authorization', active: 'true' });
findOrCreate('cmn_skill', 'name=One Click Scheduling', { name: 'One Click Scheduling', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=OpTime Scheduling', { name: 'OpTime Scheduling', description: 'Block scheduling, preference cards, room management', active: 'true' });
findOrCreate('cmn_skill', 'name=Operational Reports', { name: 'Operational Reports', description: 'Workbench reports, Crystal', active: 'true' });
findOrCreate('cmn_skill', 'name=Ophthalmology build and workflows', { name: 'Ophthalmology build and workflows', description: 'Eye exams, procedures, optical, Iproc', active: 'true' });
findOrCreate('cmn_skill', 'name=Optime charging and billing', { name: 'Optime charging and billing', description: 'charge triggers and workflows for case based procedures', active: 'true' });
findOrCreate('cmn_skill', 'name=Order Based Scheduling', { name: 'Order Based Scheduling', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Order Error Correction', { name: 'Order Error Correction', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Order Management', { name: 'Order Management', description: 'CPOE, order sets, protocol orders', active: 'true' });
findOrCreate('cmn_skill', 'name=Order Set Restrictors', { name: 'Order Set Restrictors', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Order Sets', { name: 'Order Sets', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Order Transmittal', { name: 'Order Transmittal', description: 'Update OTX, Destination Maps, Descriptors', active: 'true' });
findOrCreate('cmn_skill', 'name=Orders', { name: 'Orders', description: 'Create; Modify EAP and EDP', active: 'true' });
findOrCreate('cmn_skill', 'name=Orders Interface / Results Interface', { name: 'Orders Interface / Results Interface', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Ortho (Bones)', { name: 'Ortho (Bones)', description: 'Fracture care, DME, casting', active: 'true' });
findOrCreate('cmn_skill', 'name=Outpatient Specimen collection workflows', { name: 'Outpatient Specimen collection workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=PICC', { name: 'PICC', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=POC Tests', { name: 'POC Tests', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Paging', { name: 'Paging', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Palantir', { name: 'Palantir', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Patient Communication Committee Member', { name: 'Patient Communication Committee Member', description: 'Voting Member PT Communication Committee', active: 'true' });
findOrCreate('cmn_skill', 'name=Patient Cost Estimates', { name: 'Patient Cost Estimates', description: 'Patient Facing Cost Estimates', active: 'true' });
findOrCreate('cmn_skill', 'name=Patient Movement (Admission, Transfer, Discharge)', { name: 'Patient Movement (Admission, Transfer, Discharge)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Patient Outreach', { name: 'Patient Outreach', description: 'Configuration and Outreach Campaigns', active: 'true' });
findOrCreate('cmn_skill', 'name=Patient WQs', { name: 'Patient WQs', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Patient Workqueues', { name: 'Patient Workqueues', description: 'Prelude Workqueues', active: 'true' });
findOrCreate('cmn_skill', 'name=Payer Plan Setup', { name: 'Payer Plan Setup', description: 'Plan configuration, benefits', active: 'true' });
findOrCreate('cmn_skill', 'name=Payment & Follow-up', { name: 'Payment & Follow-up', description: 'ERA posting, denial management', active: 'true' });
findOrCreate('cmn_skill', 'name=Payment Collection', { name: 'Payment Collection', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Payment Posting', { name: 'Payment Posting', description: 'ERA, remittance, reconciliation', active: 'true' });
findOrCreate('cmn_skill', 'name=Payor Plan', { name: 'Payor Plan', description: 'Prelude Payor Plan', active: 'true' });
findOrCreate('cmn_skill', 'name=Payor Platform', { name: 'Payor Platform', description: 'Clinical Data Exchange, Care Gap Exchange', active: 'true' });
findOrCreate('cmn_skill', 'name=Perioperative Workflows', { name: 'Perioperative Workflows', description: 'Pre-op, PACU, supply tracking', active: 'true' });
findOrCreate('cmn_skill', 'name=Physical Therapy', { name: 'Physical Therapy', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Physician and Clinical Support', { name: 'Physician and Clinical Support', description: 'Onsite Training; Discovery; SmartTool build; Workflow Processes', active: 'true' });
findOrCreate('cmn_skill', 'name=Prelude Registration Workflows', { name: 'Prelude Registration Workflows', description: 'Demographics', active: 'true' });
findOrCreate('cmn_skill', 'name=Print Group Based Reports', { name: 'Print Group Based Reports', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Print groups and Report', { name: 'Print groups and Report', description: 'Lab specific: Specimens, Collection, Results', active: 'true' });
findOrCreate('cmn_skill', 'name=Printer Mapping', { name: 'Printer Mapping', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Printing', { name: 'Printing', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Printing Configuration', { name: 'Printing Configuration', description: 'Department / Workstation Printing from Epic', active: 'true' });
findOrCreate('cmn_skill', 'name=Printing Setup', { name: 'Printing Setup', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Procedural Areas', { name: 'Procedural Areas', description: 'Cath lab, GI, interventional, bronch, special procedures', active: 'true' });
findOrCreate('cmn_skill', 'name=Profiles', { name: 'Profiles', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Programming Points Creation and Maintenance', { name: 'Programming Points Creation and Maintenance', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Progress Tracking', { name: 'Progress Tracking', description: 'Actual vs planned, schedule variance', active: 'true' });
findOrCreate('cmn_skill', 'name=Project Management', { name: 'Project Management', description: 'PMP, CAPM, Agile certs', active: 'true' });
findOrCreate('cmn_skill', 'name=Provider / Resource Templates', { name: 'Provider / Resource Templates', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Provider Consults', { name: 'Provider Consults', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Provider Creation', { name: 'Provider Creation', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Psych Build', { name: 'Psych Build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Pulmonary Function Lab', { name: 'Pulmonary Function Lab', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Pulmonary Rehab', { name: 'Pulmonary Rehab', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Quality', { name: 'Quality', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Quality Measures', { name: 'Quality Measures', description: 'eCQMs, HEDIS, MIPS reporting', active: 'true' });

gs.info(LOG + ': Created ' + created + ', found existing ' + found);