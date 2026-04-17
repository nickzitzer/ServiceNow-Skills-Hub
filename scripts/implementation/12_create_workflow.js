/**
 * Fix Script: 12_create_workflow.js
 * Purpose: Create business rules to handle the "Request New Skill" approval workflow
 * Scope: Global
 * Idempotent: Yes - safe to re-run (checks existence before creating)
 *
 * Creates:
 *   1. "Skills Hub - Create Skill Request on RITM" - After Insert on sc_req_item
 *      Creates a u_skill_request record when a "Request New Skill" RITM is created.
 *   2. "Skills Hub - Process Skill Request Approval" - Before Update on u_skill_request
 *      When status changes to approved: creates cmn_skill if not exists, stamps approver/date.
 *      When status changes to rejected: stamps approver/date.
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 10_create_update_set_phase2.js and 11_create_catalog_item.js first
 */
(function() {
    try {
        var created = 0;
        var existed = 0;
        var errors = 0;

        // ================================================================
        // Helper: Create or skip a business rule (by name + collection)
        // ================================================================
        function createBusinessRule(config) {
            var gr = new GlideRecord('sys_script');
            gr.addQuery('name', config.name);
            gr.addQuery('collection', config.collection);
            gr.query();

            if (gr.next()) {
                gs.info('[Skills Hub] Business rule already exists: "' + config.name + '" on ' + config.collection + ' (sys_id: ' + gr.getUniqueValue() + ')');
                existed++;
                return gr.getUniqueValue();
            }

            gr.initialize();
            gr.setValue('name', config.name);
            gr.setValue('collection', config.collection);
            gr.setValue('when', config.when || 'after');
            gr.setValue('action_insert', config.action_insert || false);
            gr.setValue('action_update', config.action_update || false);
            gr.setValue('action_delete', config.action_delete || false);
            gr.setValue('action_query', config.action_query || false);
            gr.setValue('order', config.order || 100);
            gr.setValue('active', true);
            gr.setValue('script', config.script);

            if (config.filter_condition) {
                gr.setValue('filter_condition', config.filter_condition);
            }

            var id = gr.insert();
            if (id) {
                gs.info('[Skills Hub] Created business rule: "' + config.name + '" on ' + config.collection + ' (sys_id: ' + id + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create business rule: "' + config.name + '" on ' + config.collection);
                errors++;
            }
            return id;
        }

        // ============================================================
        // 1. Skills Hub - Create Skill Request on RITM
        //    Table: sc_req_item | When: After Insert
        //    Creates a u_skill_request record when a "Request New Skill"
        //    catalog item is ordered.
        // ============================================================
        createBusinessRule({
            name: 'Skills Hub - Create Skill Request on RITM',
            collection: 'sc_req_item',
            when: 'after',
            action_insert: true,
            action_update: false,
            action_delete: false,
            action_query: false,
            order: 100,
            script: '(function executeRule(current, previous) {\n' +
                '    // Only process "Request New Skill" catalog items\n' +
                '    if (current.cat_item.name != \'Request New Skill\') return;\n' +
                '\n' +
                '    try {\n' +
                '        var req = new GlideRecord(\'u_skill_request\');\n' +
                '        req.initialize();\n' +
                '        req.u_requested_by = current.request.requested_for;\n' +
                '        req.u_skill_name = current.variables.u_skill_name;\n' +
                '        req.u_category = current.variables.u_skill_category;\n' +
                '        req.u_justification = current.variables.u_justification;\n' +
                '        req.u_status = \'pending\';\n' +
                '        var reqId = req.insert();\n' +
                '\n' +
                '        if (reqId) {\n' +
                '            gs.info(\'[Skills Hub] Created skill request: \' + reqId + \' for RITM: \' + current.number);\n' +
                '        } else {\n' +
                '            gs.error(\'[Skills Hub] Failed to create skill request for RITM: \' + current.number);\n' +
                '        }\n' +
                '    } catch (e) {\n' +
                '        gs.error(\'[Skills Hub] BR-CreateSkillRequest: \' + e.message);\n' +
                '    }\n' +
                '})(current, previous);'
        });

        // ============================================================
        // 2. Skills Hub - Process Skill Request Approval
        //    Table: u_skill_request | When: Before Update
        //    When u_status changes to approved:
        //      - Create cmn_skill record if it does not already exist
        //      - Stamp u_approved_by and u_approval_date
        //    When u_status changes to rejected:
        //      - Stamp u_approved_by and u_approval_date
        // ============================================================
        createBusinessRule({
            name: 'Skills Hub - Process Skill Request Approval',
            collection: 'u_skill_request',
            when: 'before',
            action_insert: false,
            action_update: true,
            action_delete: false,
            action_query: false,
            order: 100,
            filter_condition: 'u_statusCHANGES',
            script: '(function executeRule(current, previous) {\n' +
                '    if (!current.u_status.changes()) return;\n' +
                '\n' +
                '    try {\n' +
                '        if (current.u_status == \'approved\') {\n' +
                '            // Create the cmn_skill if it does not already exist\n' +
                '            var existing = new GlideRecord(\'cmn_skill\');\n' +
                '            existing.addQuery(\'name\', current.u_skill_name.toString());\n' +
                '            existing.query();\n' +
                '\n' +
                '            if (!existing.hasNext()) {\n' +
                '                var skill = new GlideRecord(\'cmn_skill\');\n' +
                '                skill.initialize();\n' +
                '                skill.name = current.u_skill_name;\n' +
                '                skill.category = current.u_category;\n' +
                '                var skillId = skill.insert();\n' +
                '                if (skillId) {\n' +
                '                    gs.info(\'[Skills Hub] Created new skill: \' + current.u_skill_name + \' (sys_id: \' + skillId + \')\');\n' +
                '                } else {\n' +
                '                    gs.error(\'[Skills Hub] Failed to create skill: \' + current.u_skill_name);\n' +
                '                }\n' +
                '            } else {\n' +
                '                gs.info(\'[Skills Hub] Skill already exists, skipping creation: \' + current.u_skill_name);\n' +
                '            }\n' +
                '\n' +
                '            // Stamp approval metadata\n' +
                '            current.u_approved_by = gs.getUserID();\n' +
                '            current.u_approval_date = new GlideDateTime();\n' +
                '            gs.info(\'[Skills Hub] Skill request approved: \' + current.u_skill_name + \' by \' + gs.getUserDisplayName());\n' +
                '\n' +
                '        } else if (current.u_status == \'rejected\') {\n' +
                '            // Stamp rejection metadata\n' +
                '            current.u_approved_by = gs.getUserID();\n' +
                '            current.u_approval_date = new GlideDateTime();\n' +
                '            gs.info(\'[Skills Hub] Skill request rejected: \' + current.u_skill_name + \' by \' + gs.getUserDisplayName());\n' +
                '        }\n' +
                '    } catch (e) {\n' +
                '        gs.error(\'[Skills Hub] BR-ProcessSkillApproval: \' + e.message);\n' +
                '    }\n' +
                '})(current, previous);'
        });

        // ============================================================
        // Summary
        // ============================================================
        gs.info('[Skills Hub] ===== WORKFLOW BUSINESS RULES SUMMARY =====');
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Already existed: ' + existed);
        gs.info('[Skills Hub] Errors: ' + errors);
        gs.info('[Skills Hub] ===============================================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 12_create_workflow: ' + e.message);
    }
})();
