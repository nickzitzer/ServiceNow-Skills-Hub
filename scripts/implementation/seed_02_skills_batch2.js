// ==========================================================
// Phase 2 Batch 2: Create Skills (101-200 of 412)
// Table: cmn_skill
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase2-Batch2';
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

findOrCreate('cmn_skill', 'name=Dashboards', { name: 'Dashboards', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Data Courier', { name: 'Data Courier', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Decision Tree', { name: 'Decision Tree', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Deficiency Management', { name: 'Deficiency Management', description: 'Deficiency tracking, physician completion, EAP Trigger, Visit Type Trigger, Missing Documentation, Missing Chart Completion, Dashboards', active: 'true' });
findOrCreate('cmn_skill', 'name=Denial Management', { name: 'Denial Management', description: 'Denial WQs, appeals, root cause', active: 'true' });
findOrCreate('cmn_skill', 'name=Department Updates', { name: 'Department Updates', description: 'HOD settings; Profiles; Printers', active: 'true' });
findOrCreate('cmn_skill', 'name=Departments', { name: 'Departments', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Destination routing', { name: 'Destination routing', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Device Build', { name: 'Device Build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Device Integration', { name: 'Device Integration', description: 'Biomedical device connectivity', active: 'true' });
findOrCreate('cmn_skill', 'name=Diabetes Education', { name: 'Diabetes Education', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Digital Front Door', { name: 'Digital Front Door', description: 'Kyruus Scheduling and Configuration', active: 'true' });
findOrCreate('cmn_skill', 'name=Discharge Planning', { name: 'Discharge Planning', description: 'DC orders, instructions, care transitions', active: 'true' });
findOrCreate('cmn_skill', 'name=Discrete Value', { name: 'Discrete Value', description: 'Create and add to SmartTool', active: 'true' });
findOrCreate('cmn_skill', 'name=Doc Excellence', { name: 'Doc Excellence', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Document Management', { name: 'Document Management', description: 'Scanning, indexing, chart correction', active: 'true' });
findOrCreate('cmn_skill', 'name=Dorothy/Comfort', { name: 'Dorothy/Comfort', description: 'Home Health/Hospice, remote client, DoCo Careplans', active: 'true' });
findOrCreate('cmn_skill', 'name=Dr. Connect', { name: 'Dr. Connect', description: 'Preference lists, site enrollment and verification, account management', active: 'true' });
findOrCreate('cmn_skill', 'name=Dynamics', { name: 'Dynamics', description: 'B2B, CRM, BRM, Outreach and Marketing - NON-Epic CRM', active: 'true' });
findOrCreate('cmn_skill', 'name=E-Prescribing', { name: 'E-Prescribing', description: 'Prescription routing, pharmacy integration, EPCS', active: 'true' });
findOrCreate('cmn_skill', 'name=ECONSULTS', { name: 'ECONSULTS', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ED Manager', { name: 'ED Manager', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ED Trackboard', { name: 'ED Trackboard', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ED, L&D, and Inpatient Registration', { name: 'ED, L&D, and Inpatient Registration', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=EEG', { name: 'EEG', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Eligibility', { name: 'Eligibility', description: 'Real-time eligibility verify patient\'s coverage', active: 'true' });
findOrCreate('cmn_skill', 'name=Encounter Conversion', { name: 'Encounter Conversion', description: 'Updating Encounter Conversion Table', active: 'true' });
findOrCreate('cmn_skill', 'name=Endoscopy Orders / Results / Workflows', { name: 'Endoscopy Orders / Results / Workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Endoscopy charging', { name: 'Endoscopy charging', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Endoscopy narrator', { name: 'Endoscopy narrator', description: 'GI/Bronch nursing narrator', active: 'true' });
findOrCreate('cmn_skill', 'name=Endoscopy scheduling', { name: 'Endoscopy scheduling', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Endoscopy structured reporting', { name: 'Endoscopy structured reporting', description: 'GI/Bronch physician resulting', active: 'true' });
findOrCreate('cmn_skill', 'name=Environment Management', { name: 'Environment Management', description: 'TST/BLD/PRD, release management', active: 'true' });
findOrCreate('cmn_skill', 'name=Epic Certification', { name: 'Epic Certification', description: 'Application-specific certifications', active: 'true' });
findOrCreate('cmn_skill', 'name=Epic Monitor', { name: 'Epic Monitor', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Epic Provisioning', { name: 'Epic Provisioning', description: 'User provisioning, EMP templates, roles', active: 'true' });
findOrCreate('cmn_skill', 'name=Epic Security Governance', { name: 'Epic Security Governance', description: 'Core Security Team Member / Governer', active: 'true' });
findOrCreate('cmn_skill', 'name=Epic Security Liaison', { name: 'Epic Security Liaison', description: 'Security Liaison for Application Team', active: 'true' });
findOrCreate('cmn_skill', 'name=EpicCare Link', { name: 'EpicCare Link', description: 'Referring provider portal', active: 'true' });
findOrCreate('cmn_skill', 'name=Ethics / Biothics', { name: 'Ethics / Biothics', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Event Notifications', { name: 'Event Notifications', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Expense Tracking', { name: 'Expense Tracking', description: 'Actuals, burn rate, forecasting', active: 'true' });
findOrCreate('cmn_skill', 'name=Extension Records', { name: 'Extension Records', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=External Applications', { name: 'External Applications', description: 'Third-party app integration, APIs', active: 'true' });
findOrCreate('cmn_skill', 'name=External client workflows', { name: 'External client workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=External lab vendor integrations', { name: 'External lab vendor integrations', description: 'Aura', active: 'true' });
findOrCreate('cmn_skill', 'name=FHIR Application build', { name: 'FHIR Application build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Facility Structure Governance Member', { name: 'Facility Structure Governance Member', description: 'Voting Member FAC/ORG Steering', active: 'true' });
findOrCreate('cmn_skill', 'name=Fast Pass', { name: 'Fast Pass', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Fast Track/Urgent Care', { name: 'Fast Track/Urgent Care', description: 'Expedited workflows, templates', active: 'true' });
findOrCreate('cmn_skill', 'name=Financial Clearence Hard Stops / Scheduling', { name: 'Financial Clearence Hard Stops / Scheduling', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Flowsheets, LDA Avatar', { name: 'Flowsheets, LDA Avatar', description: 'LDAs, Flowsheet macros, custom formulas', active: 'true' });
findOrCreate('cmn_skill', 'name=Form Filler', { name: 'Form Filler', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Form Reprints', { name: 'Form Reprints', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Forms', { name: 'Forms', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Front End Reports', { name: 'Front End Reports', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Front End Steering Committee Member', { name: 'Front End Steering Committee Member', description: 'Voting Member Front End Steering', active: 'true' });
findOrCreate('cmn_skill', 'name=Genomic build and workflows', { name: 'Genomic build and workflows', description: 'Pedigree Activity, Genomic idicators, translation tables', active: 'true' });
findOrCreate('cmn_skill', 'name=Go-Live Planning', { name: 'Go-Live Planning', description: 'Command center, support model', active: 'true' });
findOrCreate('cmn_skill', 'name=HARs (Auto and Manually Created)', { name: 'HARs (Auto and Manually Created)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=HCC Care Gaps', { name: 'HCC Care Gaps', description: 'HCC care gaps', active: 'true' });
findOrCreate('cmn_skill', 'name=Haiku BYOD set up', { name: 'Haiku BYOD set up', description: 'Configuration and MDM/Tunnel management of BYOD Haiku devices', active: 'true' });
findOrCreate('cmn_skill', 'name=Haiku Push Notifications', { name: 'Haiku Push Notifications', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Haiku set up and workflows', { name: 'Haiku set up and workflows', description: 'Configuration and MDM/Tunnel management of Haiku application', active: 'true' });
findOrCreate('cmn_skill', 'name=Handler', { name: 'Handler', description: 'Operational Workflows, Configuration', active: 'true' });
findOrCreate('cmn_skill', 'name=Healing Services / Hospice', { name: 'Healing Services / Hospice', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Healthcare IT', { name: 'Healthcare IT', description: 'CPHIMS, CHCIO', active: 'true' });
findOrCreate('cmn_skill', 'name=Healthcare Regulatory', { name: 'Healthcare Regulatory', description: 'HIPAA, CMS, Joint Commission', active: 'true' });
findOrCreate('cmn_skill', 'name=Healthy Planet Core', { name: 'Healthy Planet Core', description: 'Registries, care gaps, outreach, risk scores (not cognitive computing)', active: 'true' });
findOrCreate('cmn_skill', 'name=Hello Patient', { name: 'Hello Patient', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Hello World', { name: 'Hello World', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Hospital Care at Home', { name: 'Hospital Care at Home', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=IIT (ID Type) / LLP (Resulting Agencies)', { name: 'IIT (ID Type) / LLP (Resulting Agencies)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=IT Leadership Relations', { name: 'IT Leadership Relations', description: 'CIO/CMIO engagement, governance', active: 'true' });
findOrCreate('cmn_skill', 'name=Imaging (radiology) orders & results', { name: 'Imaging (radiology) orders & results', description: 'Imaging orders, orders and results integration', active: 'true' });
findOrCreate('cmn_skill', 'name=Imaging Charging and Billing', { name: 'Imaging Charging and Billing', description: 'charge triggers and workflows for imaging, context based charging', active: 'true' });
findOrCreate('cmn_skill', 'name=Imaging invasive & IR Procedures', { name: 'Imaging invasive & IR Procedures', description: 'IR/Invasive orders, case based scheduling, and RN/Tech documentation tools', active: 'true' });
findOrCreate('cmn_skill', 'name=Imaging scheduling', { name: 'Imaging scheduling', description: 'Imaging visit types and cadence imaging build', active: 'true' });
findOrCreate('cmn_skill', 'name=Imaging technologist and radiologist workflow', { name: 'Imaging technologist and radiologist workflow', description: 'Diagnostic and invasive radiology procedure workflows', active: 'true' });
findOrCreate('cmn_skill', 'name=Immunization', { name: 'Immunization', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Import/Export', { name: 'Import/Export', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Imports/Exports', { name: 'Imports/Exports', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=In Basket Pool / Results Routing', { name: 'In Basket Pool / Results Routing', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Infection Prevention / Bugsy', { name: 'Infection Prevention / Bugsy', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Inpatient Coding', { name: 'Inpatient Coding', description: 'DRG assignment, CDI queries', active: 'true' });
findOrCreate('cmn_skill', 'name=Inpatient Rehab Facility', { name: 'Inpatient Rehab Facility', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Inpatient Second Sign Rule', { name: 'Inpatient Second Sign Rule', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Inpatient Specimen collection workflows', { name: 'Inpatient Specimen collection workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Insurance processing', { name: 'Insurance processing', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Intake SW/ED Triage Nurse', { name: 'Intake SW/ED Triage Nurse', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Interfaced lab workflows', { name: 'Interfaced lab workflows', description: 'Instrument, automation lines, slide stainers, reportable results', active: 'true' });
findOrCreate('cmn_skill', 'name=Intraoperative Documentation', { name: 'Intraoperative Documentation', description: 'OR nursing, implants', active: 'true' });
findOrCreate('cmn_skill', 'name=Inventory Management', { name: 'Inventory Management', description: 'Formulary, inventory, controlled substances', active: 'true' });
findOrCreate('cmn_skill', 'name=Issue Management', { name: 'Issue Management', description: 'Issue logging, escalation, resolution', active: 'true' });
findOrCreate('cmn_skill', 'name=L&D Greaseboard', { name: 'L&D Greaseboard', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=L&D Manager', { name: 'L&D Manager', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=LOS', { name: 'LOS', description: 'Build for LOS', active: 'true' });
findOrCreate('cmn_skill', 'name=Lab Orders & Results', { name: 'Lab Orders & Results', description: 'Specimen collection, result entry, reference labs', active: 'true' });
findOrCreate('cmn_skill', 'name=Lab Result routing schemes', { name: 'Lab Result routing schemes', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Lab Scheduling', { name: 'Lab Scheduling', description: '', active: 'true' });

gs.info(LOG + ': Created ' + created + ', found existing ' + found);