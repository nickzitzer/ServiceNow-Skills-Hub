// ==========================================================
// Phase 2 Batch 1: Create Skills (1-100 of 412)
// Table: cmn_skill
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase2-Batch1';
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

findOrCreate('cmn_skill', 'name=ADT Order Setup', { name: 'ADT Order Setup', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ADT Orders', { name: 'ADT Orders', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=AI Notes', { name: 'AI Notes', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=ASAP Configuration', { name: 'ASAP Configuration', description: 'ED tracking board, acuity, bed management', active: 'true' });
findOrCreate('cmn_skill', 'name=AVS Maintenances', { name: 'AVS Maintenances', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Account Follow-up', { name: 'Account Follow-up', description: 'AR management, collection workflows', active: 'true' });
findOrCreate('cmn_skill', 'name=Actionable findings', { name: 'Actionable findings', description: 'Actionable, incidental findings', active: 'true' });
findOrCreate('cmn_skill', 'name=Activity Therapy (BH Units only)', { name: 'Activity Therapy (BH Units only)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Adoption Strategy', { name: 'Adoption Strategy', description: 'Readiness assessment, resistance mgmt', active: 'true' });
findOrCreate('cmn_skill', 'name=Advantage Activities', { name: 'Advantage Activities', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Ambulance Services', { name: 'Ambulance Services', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Anatomic Pathology', { name: 'Anatomic Pathology', description: 'AP workflows, case management', active: 'true' });
findOrCreate('cmn_skill', 'name=Ancillary Service Package (ASP)', { name: 'Ancillary Service Package (ASP)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Anesthesia', { name: 'Anesthesia', description: 'Anesthesia record, perfusion, integrations, billing', active: 'true' });
findOrCreate('cmn_skill', 'name=Anticoag Build', { name: 'Anticoag Build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Apheresis build and workflows', { name: 'Apheresis build and workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Appointment Desk', { name: 'Appointment Desk', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Appt Request WQs', { name: 'Appt Request WQs', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Arrival Time', { name: 'Arrival Time', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Art Therapy', { name: 'Art Therapy', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Audiology', { name: 'Audiology', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Authorization -  Inpatient', { name: 'Authorization -  Inpatient', description: 'Referral management, prior authorization', active: 'true' });
findOrCreate('cmn_skill', 'name=Azure', { name: 'Azure', description: 'Chatbots on CCF.ORG', active: 'true' });
findOrCreate('cmn_skill', 'name=BCA - Device Setup', { name: 'BCA - Device Setup', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=BCA - Downtime Forms', { name: 'BCA - Downtime Forms', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=BCAWeb Configuration', { name: 'BCAWeb Configuration', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=BMT build and workflows', { name: 'BMT build and workflows', description: 'BMT Smartforms, checklists', active: 'true' });
findOrCreate('cmn_skill', 'name=BPAM', { name: 'BPAM', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=BPAs', { name: 'BPAs', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Batch Jobs', { name: 'Batch Jobs', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Batch Jobs / Runs', { name: 'Batch Jobs / Runs', description: 'Configuration of Batch Jobs and Runs', active: 'true' });
findOrCreate('cmn_skill', 'name=Batch Jobs, Batches, Runs', { name: 'Batch Jobs, Batches, Runs', description: 'Configuration of Batch Jobs and Runs', active: 'true' });
findOrCreate('cmn_skill', 'name=Bed Administration (Facility Structure, Departments, Rooms, Beds)', { name: 'Bed Administration (Facility Structure, Departments, Rooms, Beds)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Bed Planning', { name: 'Bed Planning', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Behavioral Health', { name: 'Behavioral Health', description: 'IOP/PHP', active: 'true' });
findOrCreate('cmn_skill', 'name=Behavioral Health IOP/PHP', { name: 'Behavioral Health IOP/PHP', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Benefit Engine', { name: 'Benefit Engine', description: 'Benifit Packages, BE Rules / Settings', active: 'true' });
findOrCreate('cmn_skill', 'name=Biometrics', { name: 'Biometrics', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Blood Bank/Transfusion workflows', { name: 'Blood Bank/Transfusion workflows', description: 'Blood products, crossmatch, transfusion', active: 'true' });
findOrCreate('cmn_skill', 'name=Breast imaging', { name: 'Breast imaging', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Bridges/Interfaces', { name: 'Bridges/Interfaces', description: 'HL7, FHIR, interface configuration', active: 'true' });
findOrCreate('cmn_skill', 'name=Budget Development', { name: 'Budget Development', description: 'Cost estimation, funding allocation', active: 'true' });
findOrCreate('cmn_skill', 'name=Build Documentation', { name: 'Build Documentation', description: 'Specifications, design documents', active: 'true' });
findOrCreate('cmn_skill', 'name=Build Tools', { name: 'Build Tools', description: 'Record management, master files', active: 'true' });
findOrCreate('cmn_skill', 'name=CDI', { name: 'CDI', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Caboodle/Compass', { name: 'Caboodle/Compass', description: 'Enterprise analytics, data aggregation', active: 'true' });
findOrCreate('cmn_skill', 'name=Cadence Letters', { name: 'Cadence Letters', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Cadence Printing', { name: 'Cadence Printing', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Cadence Reports', { name: 'Cadence Reports', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Cadence Scheduling', { name: 'Cadence Scheduling', description: 'Appointment booking, templates, recalls', active: 'true' });
findOrCreate('cmn_skill', 'name=Cancer Staging workflows', { name: 'Cancer Staging workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Capacity Management', { name: 'Capacity Management', description: 'Workload balancing, resource allocation', active: 'true' });
findOrCreate('cmn_skill', 'name=Cardiac Rehab', { name: 'Cardiac Rehab', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Cardiology Invasive Procedures', { name: 'Cardiology Invasive Procedures', description: 'Cath, EP', active: 'true' });
findOrCreate('cmn_skill', 'name=Cardiology Orders', { name: 'Cardiology Orders', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Cardiology studies', { name: 'Cardiology studies', description: 'Echo, stress testing, cardiac monitors', active: 'true' });
findOrCreate('cmn_skill', 'name=Cardiology technologist and cardiologist workflow', { name: 'Cardiology technologist and cardiologist workflow', description: 'Diagnostic and invasive cardiology procedure workflows', active: 'true' });
findOrCreate('cmn_skill', 'name=Care Everywhere', { name: 'Care Everywhere', description: 'HIE, community sharing, CommonWell/Car equality', active: 'true' });
findOrCreate('cmn_skill', 'name=Care Management / Social Work', { name: 'Care Management / Social Work', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Care Path build and workflows', { name: 'Care Path build and workflows', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Care Paths (Sepsis, Ortho, Stroke, DCRT)', { name: 'Care Paths (Sepsis, Ortho, Stroke, DCRT)', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=CareEverywhere', { name: 'CareEverywhere', description: 'Monitor and troubleshoot errors,discrete data mapping, translation tables, HIE, community sharing, CommonWell/Car equality', active: 'true' });
findOrCreate('cmn_skill', 'name=Category List Maintenance', { name: 'Category List Maintenance', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Category List mainenace', { name: 'Category List mainenace', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Change Control', { name: 'Change Control', description: 'Change requests, impact analysis, approval', active: 'true' });
findOrCreate('cmn_skill', 'name=Charge Capture', { name: 'Charge Capture', description: 'CDM, charging workflows, late charges', active: 'true' });
findOrCreate('cmn_skill', 'name=Charge Entry', { name: 'Charge Entry', description: 'Operational Workflows, Configuration E&M coding, procedures, modifiers', active: 'true' });
findOrCreate('cmn_skill', 'name=Charge Review', { name: 'Charge Review', description: 'Operational Workflows, Configuration', active: 'true' });
findOrCreate('cmn_skill', 'name=Charge Router', { name: 'Charge Router', description: 'Operational Workflows, Configuration', active: 'true' });
findOrCreate('cmn_skill', 'name=Cheers CRM', { name: 'Cheers CRM', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Cheers Call Hub', { name: 'Cheers Call Hub', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Cheers Campaigns', { name: 'Cheers Campaigns', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Child Life', { name: 'Child Life', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Chronicles usage', { name: 'Chronicles usage', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Chronicles/MyChart Admin', { name: 'Chronicles/MyChart Admin', description: 'System configuration, web admin', active: 'true' });
findOrCreate('cmn_skill', 'name=Claim Submission', { name: 'Claim Submission', description: 'Claim edits, scrubbing, submission, Professional claims, secondary billing', active: 'true' });
findOrCreate('cmn_skill', 'name=Clarity Data Model', { name: 'Clarity Data Model', description: 'SQL, data warehouse, extracts', active: 'true' });
findOrCreate('cmn_skill', 'name=Clarity and Reporting', { name: 'Clarity and Reporting', description: 'Clarity; Chronicles Searches', active: 'true' });
findOrCreate('cmn_skill', 'name=Clinic Map build', { name: 'Clinic Map build', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Clinical Decision Support', { name: 'Clinical Decision Support', description: 'Drug interactions, dosing, alerts', active: 'true' });
findOrCreate('cmn_skill', 'name=Clinical Documentation', { name: 'Clinical Documentation', description: 'Flowsheets, notes, assessments, care plans', active: 'true' });
findOrCreate('cmn_skill', 'name=Clinical Leadership', { name: 'Clinical Leadership', description: 'CMO, CNO, physician champions', active: 'true' });
findOrCreate('cmn_skill', 'name=Clinical Workflows', { name: 'Clinical Workflows', description: 'Care delivery, clinical operations', active: 'true' });
findOrCreate('cmn_skill', 'name=Coding', { name: 'Coding', description: 'DRG assignment, CDI queries', active: 'true' });
findOrCreate('cmn_skill', 'name=Coding Workflows', { name: 'Coding Workflows', description: 'Encoder integration, coding queries', active: 'true' });
findOrCreate('cmn_skill', 'name=Cogito Reporting', { name: 'Cogito Reporting', description: 'Dashboards, SlicerDicer, Radar', active: 'true' });
findOrCreate('cmn_skill', 'name=Comm Manager', { name: 'Comm Manager', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Communication Strategy', { name: 'Communication Strategy', description: 'Go-live comms, stakeholder readiness', active: 'true' });
findOrCreate('cmn_skill', 'name=Compass Rose', { name: 'Compass Rose', description: 'Transitions of care, complex care management', active: 'true' });
findOrCreate('cmn_skill', 'name=Conflict Resolution', { name: 'Conflict Resolution', description: 'Issue mediation, team dynamics', active: 'true' });
findOrCreate('cmn_skill', 'name=Consents', { name: 'Consents', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Consult Orders', { name: 'Consult Orders', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Contract Management', { name: 'Contract Management', description: 'SOW, deliverables, SLAs', active: 'true' });
findOrCreate('cmn_skill', 'name=Core ClinDoc', { name: 'Core ClinDoc', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Core Orders', { name: 'Core Orders', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Create Pools', { name: 'Create Pools', description: 'is this for inbasket?', active: 'true' });
findOrCreate('cmn_skill', 'name=Custom Coding', { name: 'Custom Coding', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=DARs', { name: 'DARs', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=DICOM', { name: 'DICOM', description: 'Radiology/cardiology modality worklists', active: 'true' });
findOrCreate('cmn_skill', 'name=DT Orders Release and DT Reports', { name: 'DT Orders Release and DT Reports', description: '', active: 'true' });

gs.info(LOG + ': Created ' + created + ', found existing ' + found);