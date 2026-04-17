// ==========================================================
// Phase 2 Batch 5: Create Skills (401-412 of 412)
// Table: cmn_skill
// Run in: Scripts - Background (Global scope)
// ==========================================================

var LOG = 'SkillsSeed-Phase2-Batch5';
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

findOrCreate('cmn_skill', 'name=Welcome Web', { name: 'Welcome Web', description: 'Client pack deployment, server maintenance', active: 'true' });
findOrCreate('cmn_skill', 'name=Welcome eConsent', { name: 'Welcome eConsent', description: 'Configuration for eConsent utilizing Welcome on iPads', active: 'true' });
findOrCreate('cmn_skill', 'name=Welcome workflows', { name: 'Welcome workflows', description: 'Kiosk tree, check-in rules,', active: 'true' });
findOrCreate('cmn_skill', 'name=Willow Ambulatory', { name: 'Willow Ambulatory', description: 'Retail, specialty, 340B', active: 'true' });
findOrCreate('cmn_skill', 'name=Wisdom', { name: 'Wisdom', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Work Planning', { name: 'Work Planning', description: 'Task sequencing, dependencies, milestones', active: 'true' });
findOrCreate('cmn_skill', 'name=Workflow Engine Rules', { name: 'Workflow Engine Rules', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Workqueues', { name: 'Workqueues', description: 'Charge Review WQ, Charge Edit WQ, Charge Router WQ; Operational Workflows, Configuration', active: 'true' });
findOrCreate('cmn_skill', 'name=Wound / ET Stoma / Skin Care', { name: 'Wound / ET Stoma / Skin Care', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=Wristbands', { name: 'Wristbands', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=eRX Setup', { name: 'eRX Setup', description: '', active: 'true' });
findOrCreate('cmn_skill', 'name=eSignature', { name: 'eSignature', description: '', active: 'true' });

gs.info(LOG + ': Created ' + created + ', found existing ' + found);