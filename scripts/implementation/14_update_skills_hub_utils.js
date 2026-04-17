/**
 * Fix Script: 14_update_skills_hub_utils.js
 * Purpose: Add Phase 2 methods to the existing SkillsHubUtils Script Include
 * Scope: Global
 * Idempotent: Yes - checks if methods already exist before injecting
 *
 * New methods added:
 *   1. validateSkill     - Manager validates a direct report's skill
 *   2. disputeSkill      - Manager disputes a direct report's skill with notes
 *   3. bulkValidate      - Manager validates all pending skills for a direct report
 *   4. setManagerAssessment - Manager sets assessed proficiency level
 *   5. endorseSkill      - Peer endorses another user's skill (via GlideAjax)
 *
 * Approach:
 *   - Queries sys_script_include for 'SkillsHubUtils'
 *   - Reads the current script field
 *   - Injects new methods before the closing "type: 'SkillsHubUtils'" line
 *   - Updates the record
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: SkillsHubUtils must already exist (created in Phase 1 update set)
 */
(function() {
    try {
        gs.info('[Skills Hub] Starting 14_update_skills_hub_utils...');

        // ============================================================
        // 1. Find the existing SkillsHubUtils Script Include
        // ============================================================
        var si = new GlideRecord('sys_script_include');
        si.addQuery('name', 'SkillsHubUtils');
        si.query();

        if (!si.next()) {
            gs.error('[Skills Hub] SkillsHubUtils Script Include not found. Cannot add Phase 2 methods.');
            return;
        }

        var siSysId = si.getUniqueValue();
        gs.info('[Skills Hub] Found SkillsHubUtils (sys_id: ' + siSysId + ')');

        var currentScript = si.script.toString();

        // ============================================================
        // 2. Check if Phase 2 methods already exist (idempotency)
        // ============================================================
        if (currentScript.indexOf('validateSkill') > -1) {
            gs.info('[Skills Hub] SkillsHubUtils already contains Phase 2 methods (validateSkill found). Skipping.');
            return;
        }

        // ============================================================
        // 3. Build the new methods string
        // ============================================================
        // Using string concatenation to avoid template literal issues in ServiceNow.
        // Single quotes inside the injected code are NOT escaped here because
        // this entire block is a JavaScript string value assigned to a GlideRecord
        // field -- it is NOT parsed as nested JS.  We build the string with
        // double-quote delimiters and embed single quotes directly.

        var NL = '\n';
        var T4 = '    '; // 4-space indent (matches existing style)

        var newMethods = '';
        newMethods += NL;
        newMethods += T4 + '/* ===== Phase 2: Process & Workflow Methods ===== */' + NL;
        newMethods += NL;

        // ----- validateSkill -----
        newMethods += T4 + '/**' + NL;
        newMethods += T4 + ' * Validate a direct report\'s skill (manager action).' + NL;
        newMethods += T4 + ' * Params: sysparm_user_id, sysparm_skill_name' + NL;
        newMethods += T4 + ' * Returns JSON: { success: bool, message/error: string }' + NL;
        newMethods += T4 + ' */' + NL;
        newMethods += T4 + 'validateSkill: function() {' + NL;
        newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
        newMethods += T4 + T4 + 'var skillName = this.getParameter(\'sysparm_skill_name\');' + NL;
        newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + '// Verify caller is the user\'s manager' + NL;
        newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
        newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized - you are not this user\\\'s manager\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'skill.name\', skillName);' + NL;
        newMethods += T4 + T4 + 'gr.query();' + NL;
        newMethods += T4 + T4 + 'if (gr.next()) {' + NL;
        newMethods += T4 + T4 + T4 + 'gr.u_validation_status = \'validated\';' + NL;
        newMethods += T4 + T4 + T4 + 'gr.u_last_manager_validation = new GlideDateTime();' + NL;
        newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
        newMethods += T4 + T4 + T4 + 'gs.info(\'[Skills Hub] Skill validated: \' + skillName + \' for user \' + userId);' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: true, message: \'Skill validated\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill record not found\' });' + NL;
        newMethods += T4 + '},' + NL;
        newMethods += NL;

        // ----- disputeSkill -----
        newMethods += T4 + '/**' + NL;
        newMethods += T4 + ' * Dispute a direct report\'s skill (manager action).' + NL;
        newMethods += T4 + ' * Params: sysparm_user_id, sysparm_skill_name, sysparm_notes (optional), sysparm_assessed_level (optional)' + NL;
        newMethods += T4 + ' * Returns JSON: { success: bool, message/error: string }' + NL;
        newMethods += T4 + ' */' + NL;
        newMethods += T4 + 'disputeSkill: function() {' + NL;
        newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
        newMethods += T4 + T4 + 'var skillName = this.getParameter(\'sysparm_skill_name\');' + NL;
        newMethods += T4 + T4 + 'var notes = this.getParameter(\'sysparm_notes\') || \'\';' + NL;
        newMethods += T4 + T4 + 'var assessedLevel = this.getParameter(\'sysparm_assessed_level\') || \'\';' + NL;
        newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
        newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'skill.name\', skillName);' + NL;
        newMethods += T4 + T4 + 'gr.query();' + NL;
        newMethods += T4 + T4 + 'if (gr.next()) {' + NL;
        newMethods += T4 + T4 + T4 + 'gr.u_validation_status = \'disputed\';' + NL;
        newMethods += T4 + T4 + T4 + 'gr.u_validation_notes = notes;' + NL;
        newMethods += T4 + T4 + T4 + 'if (assessedLevel) {' + NL;
        newMethods += T4 + T4 + T4 + T4 + 'gr.u_manager_assessed_level = assessedLevel;' + NL;
        newMethods += T4 + T4 + T4 + '}' + NL;
        newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
        newMethods += T4 + T4 + T4 + 'gs.info(\'[Skills Hub] Skill disputed: \' + skillName + \' for user \' + userId);' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: true, message: \'Skill disputed\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill record not found\' });' + NL;
        newMethods += T4 + '},' + NL;
        newMethods += NL;

        // ----- bulkValidate -----
        newMethods += T4 + '/**' + NL;
        newMethods += T4 + ' * Bulk-validate all pending skills for a direct report (manager action).' + NL;
        newMethods += T4 + ' * Params: sysparm_user_id' + NL;
        newMethods += T4 + ' * Returns JSON: { success: bool, count: number }' + NL;
        newMethods += T4 + ' */' + NL;
        newMethods += T4 + 'bulkValidate: function() {' + NL;
        newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
        newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
        newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'var count = 0;' + NL;
        newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'u_validation_status\', \'!=\', \'validated\');' + NL;
        newMethods += T4 + T4 + 'gr.query();' + NL;
        newMethods += T4 + T4 + 'while (gr.next()) {' + NL;
        newMethods += T4 + T4 + T4 + 'gr.u_validation_status = \'validated\';' + NL;
        newMethods += T4 + T4 + T4 + 'gr.u_last_manager_validation = new GlideDateTime();' + NL;
        newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
        newMethods += T4 + T4 + T4 + 'count++;' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += T4 + T4 + 'gs.info(\'[Skills Hub] Bulk validated \' + count + \' skills for user \' + userId);' + NL;
        newMethods += T4 + T4 + 'return JSON.stringify({ success: true, count: count });' + NL;
        newMethods += T4 + '},' + NL;
        newMethods += NL;

        // ----- setManagerAssessment -----
        newMethods += T4 + '/**' + NL;
        newMethods += T4 + ' * Set manager-assessed proficiency level for a skill (manager action).' + NL;
        newMethods += T4 + ' * Params: sysparm_user_id, sysparm_skill_name, sysparm_level' + NL;
        newMethods += T4 + ' * Returns JSON: { success: bool }' + NL;
        newMethods += T4 + ' */' + NL;
        newMethods += T4 + 'setManagerAssessment: function() {' + NL;
        newMethods += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\');' + NL;
        newMethods += T4 + T4 + 'var skillName = this.getParameter(\'sysparm_skill_name\');' + NL;
        newMethods += T4 + T4 + 'var level = this.getParameter(\'sysparm_level\');' + NL;
        newMethods += T4 + T4 + 'var managerId = gs.getUserID();' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'var userGR = new GlideRecord(\'sys_user\');' + NL;
        newMethods += T4 + T4 + 'if (!userGR.get(userId) || userGR.manager.toString() != managerId) {' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Not authorized\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
        newMethods += T4 + T4 + 'gr.addQuery(\'skill.name\', skillName);' + NL;
        newMethods += T4 + T4 + 'gr.query();' + NL;
        newMethods += T4 + T4 + 'if (gr.next()) {' + NL;
        newMethods += T4 + T4 + T4 + 'gr.u_manager_assessed_level = level;' + NL;
        newMethods += T4 + T4 + T4 + 'gr.update();' + NL;
        newMethods += T4 + T4 + T4 + 'gs.info(\'[Skills Hub] Manager assessment set: \' + skillName + \' = \' + level + \' for user \' + userId);' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: true });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill not found\' });' + NL;
        newMethods += T4 + '},' + NL;
        newMethods += NL;

        // ----- endorseSkill -----
        newMethods += T4 + '/**' + NL;
        newMethods += T4 + ' * Endorse a peer\'s skill (any authenticated user).' + NL;
        newMethods += T4 + ' * Params: sysparm_skill_record_id (sys_id of sys_user_has_skill)' + NL;
        newMethods += T4 + ' * Returns JSON: { success: bool, endorsement_id/error: string }' + NL;
        newMethods += T4 + ' */' + NL;
        newMethods += T4 + 'endorseSkill: function() {' + NL;
        newMethods += T4 + T4 + 'var skillRecordId = this.getParameter(\'sysparm_skill_record_id\');' + NL;
        newMethods += T4 + T4 + 'var endorserId = gs.getUserID();' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + '// Get the skill record to check owner' + NL;
        newMethods += T4 + T4 + 'var skillRec = new GlideRecord(\'sys_user_has_skill\');' + NL;
        newMethods += T4 + T4 + 'if (!skillRec.get(skillRecordId)) {' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Skill record not found\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + '// Prevent self-endorsement' + NL;
        newMethods += T4 + T4 + 'if (skillRec.user.toString() == endorserId) {' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'Cannot endorse your own skill\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + '// Check for duplicate endorsement' + NL;
        newMethods += T4 + T4 + 'var dup = new GlideRecord(\'u_m2m_skill_endorsement\');' + NL;
        newMethods += T4 + T4 + 'dup.addQuery(\'u_skill_record\', skillRecordId);' + NL;
        newMethods += T4 + T4 + 'dup.addQuery(\'u_endorser\', endorserId);' + NL;
        newMethods += T4 + T4 + 'dup.query();' + NL;
        newMethods += T4 + T4 + 'if (dup.hasNext()) {' + NL;
        newMethods += T4 + T4 + T4 + 'return JSON.stringify({ success: false, error: \'You have already endorsed this skill\' });' + NL;
        newMethods += T4 + T4 + '}' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + '// Create endorsement record' + NL;
        newMethods += T4 + T4 + 'var endorse = new GlideRecord(\'u_m2m_skill_endorsement\');' + NL;
        newMethods += T4 + T4 + 'endorse.initialize();' + NL;
        newMethods += T4 + T4 + 'endorse.u_skill_record = skillRecordId;' + NL;
        newMethods += T4 + T4 + 'endorse.u_endorser = endorserId;' + NL;
        newMethods += T4 + T4 + 'var id = endorse.insert();' + NL;
        newMethods += NL;
        newMethods += T4 + T4 + 'gs.info(\'[Skills Hub] Endorsement created: \' + id + \' by \' + endorserId);' + NL;
        newMethods += T4 + T4 + 'return JSON.stringify({ success: true, endorsement_id: id });' + NL;
        newMethods += T4 + '},' + NL;
        newMethods += NL;

        // ============================================================
        // 4. Inject the new methods into the existing script
        // ============================================================
        var insertionMarker = "type: 'SkillsHubUtils'";
        var insertionPoint = currentScript.indexOf(insertionMarker);

        if (insertionPoint < 0) {
            // Try double-quote variant
            insertionMarker = 'type: "SkillsHubUtils"';
            insertionPoint = currentScript.indexOf(insertionMarker);
        }

        if (insertionPoint < 0) {
            gs.error('[Skills Hub] Could not find insertion point (type: \'SkillsHubUtils\') in script. Aborting.');
            return;
        }

        var updatedScript = currentScript.substring(0, insertionPoint) + newMethods + T4 + currentScript.substring(insertionPoint);

        si.script = updatedScript;
        si.update();

        gs.info('[Skills Hub] ===== SCRIPT INCLUDE UPDATE SUMMARY =====');
        gs.info('[Skills Hub] SkillsHubUtils sys_id: ' + siSysId);
        gs.info('[Skills Hub] Methods added: validateSkill, disputeSkill, bulkValidate, setManagerAssessment, endorseSkill');
        gs.info('[Skills Hub] Original script length: ' + currentScript.length);
        gs.info('[Skills Hub] Updated script length: ' + updatedScript.length);
        gs.info('[Skills Hub] ==========================================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 14_update_skills_hub_utils: ' + e.message);
    }
})();
