/**
 * 04_create_choices.js
 * Creates all choice values for Skills Hub tables.
 * Idempotent: checks for existing choices before creating.
 * Target: sys_choice table
 */
(function() {
    try {
        var created = 0;
        var skipped = 0;
        var errors = 0;

        gs.info('[Skills Hub] === Creating Choice Values ===');

        /**
         * Creates a choice record if it does not already exist.
         * @param {string} tableName - The table the choice belongs to
         * @param {string} elementName - The field/element name
         * @param {string} value - The stored value
         * @param {string} label - The display label
         * @param {number} sequence - The sort order
         */
        function createChoice(tableName, elementName, value, label, sequence) {
            try {
                var gr = new GlideRecord('sys_choice');
                gr.addQuery('name', tableName);
                gr.addQuery('element', elementName);
                gr.addQuery('value', value);
                gr.query();
                if (gr.hasNext()) {
                    gs.info('[Skills Hub] Choice exists: ' + tableName + '.' + elementName + ' = ' + value);
                    skipped++;
                    return;
                }
                gr.initialize();
                gr.name = tableName;
                gr.element = elementName;
                gr.value = value;
                gr.label = label;
                gr.sequence = sequence;
                gr.language = 'en';
                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Created choice: ' + tableName + '.' + elementName + ' = ' + value + ' (' + id + ')');
                    created++;
                } else {
                    gs.error('[Skills Hub] Failed to create choice: ' + tableName + '.' + elementName + ' = ' + value);
                    errors++;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error creating choice ' + tableName + '.' + elementName + ' = ' + value + ': ' + e.message);
                errors++;
            }
        }

        // ---------------------------------------------------------------
        // Table: sys_user_has_skill
        // ---------------------------------------------------------------
        gs.info('[Skills Hub] --- sys_user_has_skill choices ---');

        // Field: u_manager_assessed_level
        createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'novice', 'Novice', 100);
        createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'intermediate', 'Intermediate', 200);
        createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'proficient', 'Proficient', 300);
        createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'advanced', 'Advanced', 400);
        createChoice('sys_user_has_skill', 'u_manager_assessed_level', 'expert', 'Expert', 500);

        // Field: u_validation_status
        createChoice('sys_user_has_skill', 'u_validation_status', 'pending', 'Pending', 100);
        createChoice('sys_user_has_skill', 'u_validation_status', 'validated', 'Validated', 200);
        createChoice('sys_user_has_skill', 'u_validation_status', 'disputed', 'Disputed', 300);
        createChoice('sys_user_has_skill', 'u_validation_status', 'expired', 'Expired', 400);

        // ---------------------------------------------------------------
        // Table: u_skill_request
        // ---------------------------------------------------------------
        gs.info('[Skills Hub] --- u_skill_request choices ---');

        // Field: u_status
        createChoice('u_skill_request', 'u_status', 'pending', 'Pending', 100);
        createChoice('u_skill_request', 'u_status', 'approved', 'Approved', 200);
        createChoice('u_skill_request', 'u_status', 'rejected', 'Rejected', 300);

        // ---------------------------------------------------------------
        // Table: u_skill_profile_requirement
        // ---------------------------------------------------------------
        gs.info('[Skills Hub] --- u_skill_profile_requirement choices ---');

        // Field: u_required_level
        createChoice('u_skill_profile_requirement', 'u_required_level', 'novice', 'Novice', 100);
        createChoice('u_skill_profile_requirement', 'u_required_level', 'intermediate', 'Intermediate', 200);
        createChoice('u_skill_profile_requirement', 'u_required_level', 'proficient', 'Proficient', 300);
        createChoice('u_skill_profile_requirement', 'u_required_level', 'advanced', 'Advanced', 400);
        createChoice('u_skill_profile_requirement', 'u_required_level', 'expert', 'Expert', 500);

        // Field: u_priority
        createChoice('u_skill_profile_requirement', 'u_priority', 'required', 'Required', 100);
        createChoice('u_skill_profile_requirement', 'u_priority', 'preferred', 'Preferred', 200);
        createChoice('u_skill_profile_requirement', 'u_priority', 'nice_to_have', 'Nice to Have', 300);

        // ---------------------------------------------------------------
        // Summary
        // ---------------------------------------------------------------
        var total = created + skipped + errors;
        gs.info('[Skills Hub] === Choice Creation Complete ===');
        gs.info('[Skills Hub] Total processed: ' + total);
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
        gs.info('[Skills Hub] Errors: ' + errors);

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in choice creation script: ' + e.message);
    }
})();
