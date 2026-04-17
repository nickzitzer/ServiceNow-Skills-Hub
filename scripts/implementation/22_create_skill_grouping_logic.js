/**
 * Fix Script: 22_create_skill_grouping_logic.js
 * Purpose: Create the SkillsHubGrouping Script Include for cross-category skill operations
 * Scope: Global
 * Idempotent: Yes - checks if Script Include already exists before creating
 *
 * Creates sys_script_include record:
 *   - Name: SkillsHubGrouping
 *   - API Name: global.SkillsHubGrouping
 *   - Client callable: false (server-side utility only)
 *   - Active: true
 *
 * Methods:
 *   1. getGroupsForSkill(skillSysId) - Get all category groups a skill belongs to
 *   2. getSkillsInGroup(groupSysId) - Get all skills in a category group
 *   3. addSkillToCategories(userSysId, skillSysId, categorySysIds) - Add skill across multiple categories
 *   4. getUserSkillsGrouped(userSysId) - Get user's skills grouped by skill name
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Phase 1 tables must exist (u_skill_category_group, u_m2m_skill_category_group)
 */
(function() {
    try {
        gs.info('[Skills Hub] Starting 22_create_skill_grouping_logic...');

        // ============================================================
        // 1. Check if SkillsHubGrouping already exists
        // ============================================================
        var existing = new GlideRecord('sys_script_include');
        existing.addQuery('name', 'SkillsHubGrouping');
        existing.query();

        if (existing.next()) {
            gs.info('[Skills Hub] SkillsHubGrouping Script Include already exists (sys_id: ' + existing.getUniqueValue() + '). Skipping creation.');
            return;
        }

        // ============================================================
        // 2. Build the Script Include body
        // ============================================================
        var NL = '\n';
        var T = '    ';  // 4-space indent

        var script = '';
        script += 'var SkillsHubGrouping = Class.create();' + NL;
        script += 'SkillsHubGrouping.prototype = {' + NL;
        script += NL;
        script += T + 'initialize: function() {},' + NL;
        script += NL;

        // ----- getGroupsForSkill -----
        script += T + '/**' + NL;
        script += T + ' * Get all category groups a skill belongs to.' + NL;
        script += T + ' * @param {string} skillSysId - sys_id of a cmn_skill record' + NL;
        script += T + ' * @returns {Array} Array of { group_sys_id, group_name, categories: [{sys_id, name}] }' + NL;
        script += T + ' */' + NL;
        script += T + 'getGroupsForSkill: function(skillSysId) {' + NL;
        script += T + T + 'var groupMap = {};' + NL;
        script += T + T + 'var results = [];' + NL;
        script += NL;
        script += T + T + 'if (!skillSysId) {' + NL;
        script += T + T + T + 'gs.warn(\'[Skills Hub] getGroupsForSkill: No skillSysId provided\');' + NL;
        script += T + T + T + 'return results;' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + '// First, get the skill name so we can find all cmn_skill records with that name' + NL;
        script += T + T + 'var skillGR = new GlideRecord(\'cmn_skill\');' + NL;
        script += T + T + 'if (!skillGR.get(skillSysId)) {' + NL;
        script += T + T + T + 'gs.warn(\'[Skills Hub] getGroupsForSkill: Skill not found: \' + skillSysId);' + NL;
        script += T + T + T + 'return results;' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'var skillName = skillGR.getValue(\'name\');' + NL;
        script += NL;
        script += T + T + '// Find all cmn_skill records with the same name' + NL;
        script += T + T + 'var allSkillIds = [];' + NL;
        script += T + T + 'var sameNameGR = new GlideRecord(\'cmn_skill\');' + NL;
        script += T + T + 'sameNameGR.addQuery(\'name\', skillName);' + NL;
        script += T + T + 'sameNameGR.query();' + NL;
        script += T + T + 'while (sameNameGR.next()) {' + NL;
        script += T + T + T + 'allSkillIds.push(sameNameGR.getUniqueValue());' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + '// Query the M2M table for all these skill IDs' + NL;
        script += T + T + 'var m2mGR = new GlideRecord(\'u_m2m_skill_category_group\');' + NL;
        script += T + T + 'm2mGR.addQuery(\'u_skill\', \'IN\', allSkillIds.join(\',\'));' + NL;
        script += T + T + 'm2mGR.query();' + NL;
        script += NL;
        script += T + T + 'while (m2mGR.next()) {' + NL;
        script += T + T + T + 'var groupId = m2mGR.getValue(\'u_category_group\');' + NL;
        script += T + T + T + 'var groupName = m2mGR.getDisplayValue(\'u_category_group\');' + NL;
        script += T + T + T + 'var catId = m2mGR.getValue(\'u_category\');' + NL;
        script += T + T + T + 'var catName = m2mGR.getDisplayValue(\'u_category\');' + NL;
        script += NL;
        script += T + T + T + 'if (!groupMap[groupId]) {' + NL;
        script += T + T + T + T + 'groupMap[groupId] = {' + NL;
        script += T + T + T + T + T + 'group_sys_id: groupId,' + NL;
        script += T + T + T + T + T + 'group_name: groupName,' + NL;
        script += T + T + T + T + T + 'categories: []' + NL;
        script += T + T + T + T + '};' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + 'groupMap[groupId].categories.push({' + NL;
        script += T + T + T + T + 'sys_id: catId,' + NL;
        script += T + T + T + T + 'name: catName' + NL;
        script += T + T + T + '});' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + '// Convert map to array' + NL;
        script += T + T + 'for (var gid in groupMap) {' + NL;
        script += T + T + T + 'if (groupMap.hasOwnProperty(gid)) {' + NL;
        script += T + T + T + T + 'results.push(groupMap[gid]);' + NL;
        script += T + T + T + '}' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'return results;' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- getSkillsInGroup -----
        script += T + '/**' + NL;
        script += T + ' * Get all skills in a category group.' + NL;
        script += T + ' * @param {string} groupSysId - sys_id of a u_skill_category_group record' + NL;
        script += T + ' * @returns {Array} Array of { skill_sys_id, skill_name, category_sys_id, category_name }' + NL;
        script += T + ' */' + NL;
        script += T + 'getSkillsInGroup: function(groupSysId) {' + NL;
        script += T + T + 'var results = [];' + NL;
        script += NL;
        script += T + T + 'if (!groupSysId) {' + NL;
        script += T + T + T + 'gs.warn(\'[Skills Hub] getSkillsInGroup: No groupSysId provided\');' + NL;
        script += T + T + T + 'return results;' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'var m2mGR = new GlideRecord(\'u_m2m_skill_category_group\');' + NL;
        script += T + T + 'm2mGR.addQuery(\'u_category_group\', groupSysId);' + NL;
        script += T + T + 'm2mGR.query();' + NL;
        script += NL;
        script += T + T + 'while (m2mGR.next()) {' + NL;
        script += T + T + T + 'results.push({' + NL;
        script += T + T + T + T + 'skill_sys_id: m2mGR.getValue(\'u_skill\'),' + NL;
        script += T + T + T + T + 'skill_name: m2mGR.getDisplayValue(\'u_skill\'),' + NL;
        script += T + T + T + T + 'category_sys_id: m2mGR.getValue(\'u_category\'),' + NL;
        script += T + T + T + T + 'category_name: m2mGR.getDisplayValue(\'u_category\')' + NL;
        script += T + T + T + '});' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'return results;' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- addSkillToCategories -----
        script += T + '/**' + NL;
        script += T + ' * Add a skill for a user across multiple categories.' + NL;
        script += T + ' * For each category, finds the cmn_skill with the same name in that category' + NL;
        script += T + ' * and creates a sys_user_has_skill record if not already present.' + NL;
        script += T + ' * @param {string} userSysId - sys_id of the user' + NL;
        script += T + ' * @param {string} skillSysId - sys_id of the source cmn_skill record' + NL;
        script += T + ' * @param {Array} categorySysIds - Array of cmn_skill_category sys_ids' + NL;
        script += T + ' * @returns {Object} { added: number, skipped: number, errors: [] }' + NL;
        script += T + ' */' + NL;
        script += T + 'addSkillToCategories: function(userSysId, skillSysId, categorySysIds) {' + NL;
        script += T + T + 'var result = { added: 0, skipped: 0, errors: [] };' + NL;
        script += NL;
        script += T + T + 'if (!userSysId || !skillSysId || !categorySysIds || categorySysIds.length === 0) {' + NL;
        script += T + T + T + 'result.errors.push(\'Missing required parameters\');' + NL;
        script += T + T + T + 'return result;' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + '// Get the skill name from the source skill' + NL;
        script += T + T + 'var sourceSkill = new GlideRecord(\'cmn_skill\');' + NL;
        script += T + T + 'if (!sourceSkill.get(skillSysId)) {' + NL;
        script += T + T + T + 'result.errors.push(\'Source skill not found: \' + skillSysId);' + NL;
        script += T + T + T + 'return result;' + NL;
        script += T + T + '}' + NL;
        script += T + T + 'var skillName = sourceSkill.getValue(\'name\');' + NL;
        script += NL;
        script += T + T + 'for (var i = 0; i < categorySysIds.length; i++) {' + NL;
        script += T + T + T + 'var catId = categorySysIds[i];' + NL;
        script += NL;
        script += T + T + T + '// Find the cmn_skill with this name in the target category' + NL;
        script += T + T + T + 'var targetSkill = new GlideRecord(\'cmn_skill\');' + NL;
        script += T + T + T + 'targetSkill.addQuery(\'name\', skillName);' + NL;
        script += T + T + T + 'targetSkill.addQuery(\'category\', catId);' + NL;
        script += T + T + T + 'targetSkill.query();' + NL;
        script += NL;
        script += T + T + T + 'if (!targetSkill.next()) {' + NL;
        script += T + T + T + T + 'gs.warn(\'[Skills Hub] addSkillToCategories: No skill named "\' + skillName + \'" found in category \' + catId);' + NL;
        script += T + T + T + T + 'result.errors.push(\'Skill "\' + skillName + \'" not found in category \' + catId);' + NL;
        script += T + T + T + T + 'continue;' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + 'var targetSkillId = targetSkill.getUniqueValue();' + NL;
        script += NL;
        script += T + T + T + '// Check if user already has this skill' + NL;
        script += T + T + T + 'var existCheck = new GlideRecord(\'sys_user_has_skill\');' + NL;
        script += T + T + T + 'existCheck.addQuery(\'user\', userSysId);' + NL;
        script += T + T + T + 'existCheck.addQuery(\'skill\', targetSkillId);' + NL;
        script += T + T + T + 'existCheck.query();' + NL;
        script += NL;
        script += T + T + T + 'if (existCheck.hasNext()) {' + NL;
        script += T + T + T + T + 'gs.info(\'[Skills Hub] addSkillToCategories: User already has skill "\' + skillName + \'" in category \' + catId + \' - skipping\');' + NL;
        script += T + T + T + T + 'result.skipped++;' + NL;
        script += T + T + T + T + 'continue;' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + '// Create the sys_user_has_skill record' + NL;
        script += T + T + T + 'var newRec = new GlideRecord(\'sys_user_has_skill\');' + NL;
        script += T + T + T + 'newRec.initialize();' + NL;
        script += T + T + T + 'newRec.setValue(\'user\', userSysId);' + NL;
        script += T + T + T + 'newRec.setValue(\'skill\', targetSkillId);' + NL;
        script += T + T + T + 'var insertId = newRec.insert();' + NL;
        script += NL;
        script += T + T + T + 'if (insertId) {' + NL;
        script += T + T + T + T + 'gs.info(\'[Skills Hub] addSkillToCategories: Added skill "\' + skillName + \'" (category \' + catId + \') for user \' + userSysId);' + NL;
        script += T + T + T + T + 'result.added++;' + NL;
        script += T + T + T + '} else {' + NL;
        script += T + T + T + T + 'gs.error(\'[Skills Hub] addSkillToCategories: Failed to insert sys_user_has_skill for skill "\' + skillName + \'" in category \' + catId);' + NL;
        script += T + T + T + T + 'result.errors.push(\'Insert failed for skill "\' + skillName + \'" in category \' + catId);' + NL;
        script += T + T + T + '}' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'gs.info(\'[Skills Hub] addSkillToCategories complete: added=\' + result.added + \', skipped=\' + result.skipped + \', errors=\' + result.errors.length);' + NL;
        script += T + T + 'return result;' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- getUserSkillsGrouped -----
        script += T + '/**' + NL;
        script += T + ' * Get a user\'s skills grouped by skill name.' + NL;
        script += T + ' * @param {string} userSysId - sys_id of the user' + NL;
        script += T + ' * @returns {Array} Sorted array of { skill_name, entries: [{sys_id, category, level, endorsements}] }' + NL;
        script += T + ' */' + NL;
        script += T + 'getUserSkillsGrouped: function(userSysId) {' + NL;
        script += T + T + 'var groupMap = {};' + NL;
        script += T + T + 'var results = [];' + NL;
        script += NL;
        script += T + T + 'if (!userSysId) {' + NL;
        script += T + T + T + 'gs.warn(\'[Skills Hub] getUserSkillsGrouped: No userSysId provided\');' + NL;
        script += T + T + T + 'return results;' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
        script += T + T + 'gr.addQuery(\'user\', userSysId);' + NL;
        script += T + T + 'gr.orderBy(\'skill.name\');' + NL;
        script += T + T + 'gr.query();' + NL;
        script += NL;
        script += T + T + 'while (gr.next()) {' + NL;
        script += T + T + T + 'var sName = gr.getDisplayValue(\'skill\');' + NL;
        script += T + T + T + 'var category = gr.getDisplayValue(\'skill.category\');' + NL;
        script += T + T + T + 'var level = gr.getDisplayValue(\'skill_level\');' + NL;
        script += T + T + T + 'var endorsements = parseInt(gr.getValue(\'u_peer_endorsement_count\')) || 0;' + NL;
        script += NL;
        script += T + T + T + 'if (!groupMap[sName]) {' + NL;
        script += T + T + T + T + 'groupMap[sName] = {' + NL;
        script += T + T + T + T + T + 'skill_name: sName,' + NL;
        script += T + T + T + T + T + 'entries: []' + NL;
        script += T + T + T + T + '};' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + 'groupMap[sName].entries.push({' + NL;
        script += T + T + T + T + 'sys_id: gr.getUniqueValue(),' + NL;
        script += T + T + T + T + 'category: category,' + NL;
        script += T + T + T + T + 'level: level,' + NL;
        script += T + T + T + T + 'endorsements: endorsements' + NL;
        script += T + T + T + '});' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + '// Convert map to sorted array' + NL;
        script += T + T + 'var names = [];' + NL;
        script += T + T + 'for (var n in groupMap) {' + NL;
        script += T + T + T + 'if (groupMap.hasOwnProperty(n)) {' + NL;
        script += T + T + T + T + 'names.push(n);' + NL;
        script += T + T + T + '}' + NL;
        script += T + T + '}' + NL;
        script += T + T + 'names.sort();' + NL;
        script += NL;
        script += T + T + 'for (var j = 0; j < names.length; j++) {' + NL;
        script += T + T + T + 'results.push(groupMap[names[j]]);' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'return results;' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- type -----
        script += T + 'type: \'SkillsHubGrouping\'' + NL;
        script += '};' + NL;

        // ============================================================
        // 3. Create the Script Include record
        // ============================================================
        var si = new GlideRecord('sys_script_include');
        si.initialize();
        si.setValue('name', 'SkillsHubGrouping');
        si.setValue('api_name', 'global.SkillsHubGrouping');
        si.setValue('client_callable', false);
        si.setValue('active', true);
        si.setValue('access', 'public');
        si.setValue('description', 'Skills Hub - Cross-category skill grouping utility. Provides methods for querying skill category groups, adding skills across categories, and retrieving grouped user skills.');
        si.setValue('script', script);

        var siId = si.insert();

        if (siId) {
            gs.info('[Skills Hub] Created SkillsHubGrouping Script Include (sys_id: ' + siId + ')');
        } else {
            gs.error('[Skills Hub] FAILED to create SkillsHubGrouping Script Include');
            return;
        }

        // ============================================================
        // 4. Summary
        // ============================================================
        gs.info('[Skills Hub] ===== SCRIPT 22 SUMMARY =====');
        gs.info('[Skills Hub] Script Include: SkillsHubGrouping');
        gs.info('[Skills Hub] API Name: global.SkillsHubGrouping');
        gs.info('[Skills Hub] sys_id: ' + siId);
        gs.info('[Skills Hub] Client Callable: false');
        gs.info('[Skills Hub] Methods: getGroupsForSkill, getSkillsInGroup, addSkillToCategories, getUserSkillsGrouped');
        gs.info('[Skills Hub] Script length: ' + script.length + ' chars');
        gs.info('[Skills Hub] =============================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 22_create_skill_grouping_logic: ' + e.message);
    }
})();
