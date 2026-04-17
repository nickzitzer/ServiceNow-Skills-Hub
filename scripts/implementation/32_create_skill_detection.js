/**
 * Fix Script: 32_create_skill_detection.js
 * Purpose: Create the SkillsHubDetection Script Include for automated skill detection
 *          from story/task descriptions
 * Scope: Global
 * Idempotent: Yes - checks if Script Include already exists before creating
 *
 * Creates:
 *   1. sys_script_include: SkillsHubDetection
 *      - detectSkills(text)          - Analyze text, return array of { skillId, skillName, confidence }
 *      - tagStoryWithSkills(storyId) - Auto-detect and tag skills for one story
 *      - batchTagStories(encodedQuery)- Run detection on multiple stories
 *
 * Methods:
 *   detectSkills(text):
 *     - Queries all cmn_skill records
 *     - For each skill, checks case-insensitive name match in text
 *     - Also checks common variations (e.g., "JavaScript" matches "JS", "javascript")
 *     - Returns array of { skillId, skillName, confidence } where confidence = "exact" or "partial"
 *
 *   tagStoryWithSkills(storyId):
 *     - Gets short_description + description from the story
 *     - Calls detectSkills() on combined text
 *     - Creates u_story_skill_assignment for each detected skill (if not already tagged)
 *     - Returns { success: true, skillsTagged: N, skillsSkipped: N }
 *
 *   batchTagStories(encodedQuery):
 *     - Queries rm_story (with task fallback) using the encoded query
 *     - Calls tagStoryWithSkills for each
 *     - Returns { success: true, storiesProcessed: N, totalSkillsTagged: N }
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Phase 1+2+3 tables (u_story_skill_assignment, cmn_skill) must exist
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING SKILL DETECTION CREATION (Script 32) =====');

        var SI_NAME = 'SkillsHubDetection';

        // ================================================================
        // 1. Idempotency check
        // ================================================================
        var existingSI = new GlideRecord('sys_script_include');
        existingSI.addQuery('name', SI_NAME);
        existingSI.query();

        if (existingSI.next()) {
            gs.info('[Skills Hub] ' + SI_NAME + ' Script Include already exists (sys_id: ' + existingSI.getUniqueValue() + '). Skipping creation.');
            return;
        }

        // ================================================================
        // 2. Build the Script Include body
        // ================================================================
        var NL = '\n';
        var T = '    ';

        var script = '';
        script += 'var SkillsHubDetection = Class.create();' + NL;
        script += 'SkillsHubDetection.prototype = {' + NL;
        script += NL;
        script += T + 'initialize: function() {' + NL;
        script += T + T + 'this.LOG_SOURCE = "SkillsHubDetection";' + NL;
        script += T + T + 'this._buildVariationMap();' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- _variations: common skill name aliases -----
        script += T + '/**' + NL;
        script += T + ' * Common skill name variations/aliases.' + NL;
        script += T + ' * Keys are lowercase canonical skill names.' + NL;
        script += T + ' * Values are arrays of alternative spellings/abbreviations.' + NL;
        script += T + ' */' + NL;
        script += T + '_variations: {' + NL;
        script += T + T + '"javascript": ["js", "ecmascript", "es6", "java script"],' + NL;
        script += T + T + '"typescript": ["ts"],' + NL;
        script += T + T + '"python": ["py", "python3"],' + NL;
        script += T + T + '"kubernetes": ["k8s", "kube"],' + NL;
        script += T + T + '"docker": ["containerization", "containers"],' + NL;
        script += T + T + '"react": ["reactjs", "react.js"],' + NL;
        script += T + T + '"angular": ["angularjs", "angular.js"],' + NL;
        script += T + T + '"node.js": ["nodejs", "node"],' + NL;
        script += T + T + '"servicenow": ["snow", "snc"],' + NL;
        script += T + T + '"amazon web services": ["aws"],' + NL;
        script += T + T + '"google cloud platform": ["gcp"],' + NL;
        script += T + T + '"microsoft azure": ["azure"],' + NL;
        script += T + T + '"machine learning": ["ml", "deep learning"],' + NL;
        script += T + T + '"artificial intelligence": ["ai"],' + NL;
        script += T + T + '"continuous integration": ["ci", "ci/cd"],' + NL;
        script += T + T + '"sql": ["structured query language"],' + NL;
        script += T + T + '"html": ["html5"],' + NL;
        script += T + T + '"css": ["css3", "styling"],' + NL;
        script += T + T + '"agile": ["scrum", "kanban"],' + NL;
        script += T + T + '"project management": ["pm", "project mgmt"]' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- _reverseMap: alias -> canonical name -----
        script += T + '_reverseMap: null,' + NL;
        script += NL;

        // ----- _buildVariationMap -----
        script += T + '/**' + NL;
        script += T + ' * Build reverse lookup map from _variations.' + NL;
        script += T + ' * Maps each alias (lowercase) to its canonical skill name (lowercase).' + NL;
        script += T + ' */' + NL;
        script += T + '_buildVariationMap: function() {' + NL;
        script += T + T + 'this._reverseMap = {};' + NL;
        script += T + T + 'for (var canonical in this._variations) {' + NL;
        script += T + T + T + 'if (!this._variations.hasOwnProperty(canonical)) continue;' + NL;
        script += T + T + T + 'var aliasList = this._variations[canonical];' + NL;
        script += T + T + T + 'for (var i = 0; i < aliasList.length; i++) {' + NL;
        script += T + T + T + T + 'this._reverseMap[aliasList[i].toLowerCase()] = canonical;' + NL;
        script += T + T + T + '}' + NL;
        script += T + T + '}' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- detectSkills -----
        script += T + '/**' + NL;
        script += T + ' * Analyze text and return matching skill names with confidence.' + NL;
        script += T + ' * Queries all cmn_skill records. For each skill, checks if the skill name' + NL;
        script += T + ' * (case-insensitive) appears in the text. Also checks common variations.' + NL;
        script += T + ' *' + NL;
        script += T + ' * @param {string} text - The text to analyze (e.g., story description)' + NL;
        script += T + ' * @returns {Array} Array of { skillId, skillName, confidence }' + NL;
        script += T + ' *                  where confidence is "exact" or "partial"' + NL;
        script += T + ' */' + NL;
        script += T + 'detectSkills: function(text) {' + NL;
        script += T + T + 'var results = [];' + NL;
        script += T + T + 'if (!text || text.toString().trim() === "") {' + NL;
        script += T + T + T + 'return results;' + NL;
        script += T + T + '}' + NL;
        script += NL;
        script += T + T + 'try {' + NL;
        script += T + T + T + '// Normalize: lowercase, strip HTML tags, pad with spaces for word boundary matching' + NL;
        script += T + T + T + 'var normalizedText = " " + text.toString().replace(/<[^>]*>/g, " ").toLowerCase() + " ";' + NL;
        script += NL;
        script += T + T + T + '// Track matched skill IDs to avoid duplicates' + NL;
        script += T + T + T + 'var matched = {};' + NL;
        script += NL;
        script += T + T + T + '// Query all active skills from cmn_skill' + NL;
        script += T + T + T + 'var skillGR = new GlideRecord("cmn_skill");' + NL;
        script += T + T + T + 'skillGR.addActiveQuery();' + NL;
        script += T + T + T + 'skillGR.query();' + NL;
        script += NL;
        script += T + T + T + 'while (skillGR.next()) {' + NL;
        script += T + T + T + T + 'var skillId = skillGR.getUniqueValue();' + NL;
        script += T + T + T + T + 'var skillName = skillGR.getValue("name");' + NL;
        script += T + T + T + T + 'if (!skillName || matched[skillId]) continue;' + NL;
        script += NL;
        script += T + T + T + T + 'var skillNameLower = skillName.toLowerCase();' + NL;
        script += NL;
        script += T + T + T + T + '// Check 1: Exact name match (case-insensitive, word boundary)' + NL;
        script += T + T + T + T + 'if (normalizedText.indexOf(" " + skillNameLower + " ") !== -1' + NL;
        script += T + T + T + T + '    || normalizedText.indexOf(" " + skillNameLower + ".") !== -1' + NL;
        script += T + T + T + T + '    || normalizedText.indexOf(" " + skillNameLower + ",") !== -1' + NL;
        script += T + T + T + T + '    || normalizedText.indexOf(" " + skillNameLower + "\\n") !== -1) {' + NL;
        script += T + T + T + T + T + 'matched[skillId] = true;' + NL;
        script += T + T + T + T + T + 'results.push({' + NL;
        script += T + T + T + T + T + T + 'skillId: skillId,' + NL;
        script += T + T + T + T + T + T + 'skillName: skillName,' + NL;
        script += T + T + T + T + T + T + 'confidence: "exact"' + NL;
        script += T + T + T + T + T + '});' + NL;
        script += T + T + T + T + T + 'continue;' + NL;
        script += T + T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + T + '// Check 2: Variation/alias match' + NL;
        script += T + T + T + T + 'var variationMatched = false;' + NL;
        script += NL;
        script += T + T + T + T + '// 2a. Check if any known alias of this skill appears in text' + NL;
        script += T + T + T + T + 'if (this._variations[skillNameLower]) {' + NL;
        script += T + T + T + T + T + 'var aliases = this._variations[skillNameLower];' + NL;
        script += T + T + T + T + T + 'for (var a = 0; a < aliases.length; a++) {' + NL;
        script += T + T + T + T + T + T + 'var aliasLower = aliases[a].toLowerCase();' + NL;
        script += T + T + T + T + T + T + 'if (normalizedText.indexOf(" " + aliasLower + " ") !== -1' + NL;
        script += T + T + T + T + T + T + '    || normalizedText.indexOf(" " + aliasLower + ".") !== -1' + NL;
        script += T + T + T + T + T + T + '    || normalizedText.indexOf(" " + aliasLower + ",") !== -1) {' + NL;
        script += T + T + T + T + T + T + T + 'variationMatched = true;' + NL;
        script += T + T + T + T + T + T + T + 'break;' + NL;
        script += T + T + T + T + T + T + '}' + NL;
        script += T + T + T + T + T + '}' + NL;
        script += T + T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + T + '// 2b. Check reverse: if the skill name itself is an alias of a canonical name' + NL;
        script += T + T + T + T + 'if (!variationMatched && this._reverseMap) {' + NL;
        script += T + T + T + T + T + 'for (var alias in this._reverseMap) {' + NL;
        script += T + T + T + T + T + T + 'if (!this._reverseMap.hasOwnProperty(alias)) continue;' + NL;
        script += T + T + T + T + T + T + 'if (this._reverseMap[alias] === skillNameLower) {' + NL;
        script += T + T + T + T + T + T + T + 'if (normalizedText.indexOf(" " + alias + " ") !== -1' + NL;
        script += T + T + T + T + T + T + T + '    || normalizedText.indexOf(" " + alias + ".") !== -1' + NL;
        script += T + T + T + T + T + T + T + '    || normalizedText.indexOf(" " + alias + ",") !== -1) {' + NL;
        script += T + T + T + T + T + T + T + T + 'variationMatched = true;' + NL;
        script += T + T + T + T + T + T + T + T + 'break;' + NL;
        script += T + T + T + T + T + T + T + '}' + NL;
        script += T + T + T + T + T + T + '}' + NL;
        script += T + T + T + T + T + '}' + NL;
        script += T + T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + T + 'if (variationMatched) {' + NL;
        script += T + T + T + T + T + 'matched[skillId] = true;' + NL;
        script += T + T + T + T + T + 'results.push({' + NL;
        script += T + T + T + T + T + T + 'skillId: skillId,' + NL;
        script += T + T + T + T + T + T + 'skillName: skillName,' + NL;
        script += T + T + T + T + T + T + 'confidence: "partial"' + NL;
        script += T + T + T + T + T + '});' + NL;
        script += T + T + T + T + '}' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + 'return results;' + NL;
        script += NL;
        script += T + T + '} catch (e) {' + NL;
        script += T + T + T + 'gs.error(this.LOG_SOURCE + ".detectSkills: " + e.message);' + NL;
        script += T + T + T + 'return results;' + NL;
        script += T + T + '}' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- tagStoryWithSkills -----
        script += T + '/**' + NL;
        script += T + ' * Auto-detect and tag skills for a single story.' + NL;
        script += T + ' * Gets the story short_description + description, runs detectSkills(),' + NL;
        script += T + ' * and creates u_story_skill_assignment records for each detected skill' + NL;
        script += T + ' * (if it does not already exist).' + NL;
        script += T + ' *' + NL;
        script += T + ' * @param {string} storyId - sys_id of the rm_story (or task) record' + NL;
        script += T + ' * @returns {Object} { success: true, skillsTagged: N, skillsSkipped: N }' + NL;
        script += T + ' */' + NL;
        script += T + 'tagStoryWithSkills: function(storyId) {' + NL;
        script += T + T + 'var result = { success: false, skillsTagged: 0, skillsSkipped: 0 };' + NL;
        script += NL;
        script += T + T + 'try {' + NL;
        script += T + T + T + 'if (!storyId) {' + NL;
        script += T + T + T + T + 'gs.warn(this.LOG_SOURCE + ".tagStoryWithSkills: No storyId provided");' + NL;
        script += T + T + T + T + 'return result;' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + '// 1. Get the story record' + NL;
        script += T + T + T + 'var storyGR = new GlideRecord("rm_story");' + NL;
        script += T + T + T + 'if (!storyGR.get(storyId)) {' + NL;
        script += T + T + T + T + '// Fallback: try task table' + NL;
        script += T + T + T + T + 'storyGR = new GlideRecord("task");' + NL;
        script += T + T + T + T + 'if (!storyGR.get(storyId)) {' + NL;
        script += T + T + T + T + T + 'gs.warn(this.LOG_SOURCE + ".tagStoryWithSkills: Record not found: " + storyId);' + NL;
        script += T + T + T + T + T + 'return result;' + NL;
        script += T + T + T + T + '}' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + '// 2. Concatenate short_description + description' + NL;
        script += T + T + T + 'var text = (storyGR.getValue("short_description") || "") + " " + (storyGR.getValue("description") || "");' + NL;
        script += NL;
        script += T + T + T + '// 3. Detect skills in the combined text' + NL;
        script += T + T + T + 'var detected = this.detectSkills(text);' + NL;
        script += NL;
        script += T + T + T + '// 4. Create u_story_skill_assignment for each detected skill' + NL;
        script += T + T + T + 'for (var i = 0; i < detected.length; i++) {' + NL;
        script += T + T + T + T + 'var skill = detected[i];' + NL;
        script += NL;
        script += T + T + T + T + '// Check if assignment already exists (idempotent)' + NL;
        script += T + T + T + T + 'var existCheck = new GlideRecord("u_story_skill_assignment");' + NL;
        script += T + T + T + T + 'existCheck.addQuery("u_story", storyId);' + NL;
        script += T + T + T + T + 'existCheck.addQuery("u_skill", skill.skillId);' + NL;
        script += T + T + T + T + 'existCheck.query();' + NL;
        script += NL;
        script += T + T + T + T + 'if (existCheck.hasNext()) {' + NL;
        script += T + T + T + T + T + 'result.skillsSkipped++;' + NL;
        script += T + T + T + T + T + 'continue;' + NL;
        script += T + T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + T + '// Create the assignment' + NL;
        script += T + T + T + T + 'var assignGR = new GlideRecord("u_story_skill_assignment");' + NL;
        script += T + T + T + T + 'assignGR.initialize();' + NL;
        script += T + T + T + T + 'assignGR.setValue("u_story", storyId);' + NL;
        script += T + T + T + T + 'assignGR.setValue("u_skill", skill.skillId);' + NL;
        script += T + T + T + T + 'assignGR.setValue("u_active", true);' + NL;
        script += NL;
        script += T + T + T + T + 'var insertId = assignGR.insert();' + NL;
        script += T + T + T + T + 'if (insertId) {' + NL;
        script += T + T + T + T + T + 'result.skillsTagged++;' + NL;
        script += T + T + T + T + T + 'gs.info(this.LOG_SOURCE + ".tagStoryWithSkills: Tagged skill " + skill.skillName + " (" + skill.confidence + ") for story " + storyId);' + NL;
        script += T + T + T + T + '} else {' + NL;
        script += T + T + T + T + T + 'gs.error(this.LOG_SOURCE + ".tagStoryWithSkills: Failed to create assignment for skill " + skill.skillName + " on story " + storyId);' + NL;
        script += T + T + T + T + '}' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + 'result.success = true;' + NL;
        script += T + T + T + 'gs.info(this.LOG_SOURCE + ".tagStoryWithSkills complete for story " + storyId + ": tagged=" + result.skillsTagged + ", skipped=" + result.skillsSkipped);' + NL;
        script += T + T + T + 'return result;' + NL;
        script += NL;
        script += T + T + '} catch (e) {' + NL;
        script += T + T + T + 'gs.error(this.LOG_SOURCE + ".tagStoryWithSkills: " + e.message);' + NL;
        script += T + T + T + 'result.success = false;' + NL;
        script += T + T + T + 'return result;' + NL;
        script += T + T + '}' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- batchTagStories -----
        script += T + '/**' + NL;
        script += T + ' * Run skill detection on multiple stories matching an encoded query.' + NL;
        script += T + ' * Queries rm_story with the encoded query (or task as fallback).' + NL;
        script += T + ' * Calls tagStoryWithSkills for each story found.' + NL;
        script += T + ' *' + NL;
        script += T + ' * @param {string} encodedQuery - Encoded query string for rm_story table' + NL;
        script += T + ' * @returns {Object} { success: true, storiesProcessed: N, totalSkillsTagged: N }' + NL;
        script += T + ' */' + NL;
        script += T + 'batchTagStories: function(encodedQuery) {' + NL;
        script += T + T + 'var summary = {' + NL;
        script += T + T + T + 'success: false,' + NL;
        script += T + T + T + 'storiesProcessed: 0,' + NL;
        script += T + T + T + 'totalSkillsTagged: 0' + NL;
        script += T + T + '};' + NL;
        script += NL;
        script += T + T + 'try {' + NL;
        script += T + T + T + 'if (!encodedQuery) {' + NL;
        script += T + T + T + T + 'gs.warn(this.LOG_SOURCE + ".batchTagStories: No encodedQuery provided");' + NL;
        script += T + T + T + T + 'return summary;' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + '// Try rm_story first' + NL;
        script += T + T + T + 'var tableName = "rm_story";' + NL;
        script += T + T + T + 'var storyGR = new GlideRecord(tableName);' + NL;
        script += NL;
        script += T + T + T + '// Test if rm_story table is accessible' + NL;
        script += T + T + T + 'if (!storyGR.isValid()) {' + NL;
        script += T + T + T + T + '// Fallback to task table' + NL;
        script += T + T + T + T + 'tableName = "task";' + NL;
        script += T + T + T + T + 'storyGR = new GlideRecord(tableName);' + NL;
        script += T + T + T + T + 'gs.info(this.LOG_SOURCE + ".batchTagStories: rm_story not available, using task table");' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + 'storyGR.addEncodedQuery(encodedQuery);' + NL;
        script += T + T + T + 'storyGR.query();' + NL;
        script += NL;
        script += T + T + T + 'gs.info(this.LOG_SOURCE + ".batchTagStories: Processing stories from " + tableName + " with query: " + encodedQuery);' + NL;
        script += NL;
        script += T + T + T + 'while (storyGR.next()) {' + NL;
        script += T + T + T + T + 'var storyId = storyGR.getUniqueValue();' + NL;
        script += NL;
        script += T + T + T + T + 'try {' + NL;
        script += T + T + T + T + T + 'var storyResult = this.tagStoryWithSkills(storyId);' + NL;
        script += T + T + T + T + T + 'summary.storiesProcessed++;' + NL;
        script += T + T + T + T + T + 'summary.totalSkillsTagged += storyResult.skillsTagged;' + NL;
        script += T + T + T + T + '} catch (storyErr) {' + NL;
        script += T + T + T + T + T + 'gs.error(this.LOG_SOURCE + ".batchTagStories: Error processing story " + storyId + ": " + storyErr.message);' + NL;
        script += T + T + T + T + '}' + NL;
        script += T + T + T + '}' + NL;
        script += NL;
        script += T + T + T + 'summary.success = true;' + NL;
        script += T + T + T + 'gs.info(this.LOG_SOURCE + ".batchTagStories complete: storiesProcessed=" + summary.storiesProcessed + ", totalSkillsTagged=" + summary.totalSkillsTagged);' + NL;
        script += T + T + T + 'return summary;' + NL;
        script += NL;
        script += T + T + '} catch (e) {' + NL;
        script += T + T + T + 'gs.error(this.LOG_SOURCE + ".batchTagStories: " + e.message);' + NL;
        script += T + T + T + 'summary.success = false;' + NL;
        script += T + T + T + 'return summary;' + NL;
        script += T + T + '}' + NL;
        script += T + '},' + NL;
        script += NL;

        // ----- type -----
        script += T + 'type: "SkillsHubDetection"' + NL;
        script += '};' + NL;

        // ================================================================
        // 3. Create the Script Include record
        // ================================================================
        var si = new GlideRecord('sys_script_include');
        si.initialize();
        si.setValue('name', SI_NAME);
        si.setValue('api_name', 'global.SkillsHubDetection');
        si.setValue('client_callable', false);
        si.setValue('active', true);
        si.setValue('access', 'public');
        si.setValue('description', 'Skills Hub - Automated skill detection from story/task descriptions. ' +
            'Analyzes text for skill name matches (exact and partial via alias/variation) ' +
            'and auto-tags stories with detected skills via u_story_skill_assignment records. ' +
            'Methods: detectSkills(text), tagStoryWithSkills(storyId), batchTagStories(encodedQuery).');
        si.setValue('script', script);

        var siSysId = si.insert();

        if (siSysId) {
            gs.info('[Skills Hub] Created ' + SI_NAME + ' Script Include (sys_id: ' + siSysId + ')');
        } else {
            gs.error('[Skills Hub] FAILED to create ' + SI_NAME + ' Script Include');
            return;
        }

        // ================================================================
        // 4. Summary
        // ================================================================
        gs.info('[Skills Hub] ===== SCRIPT 32 SUMMARY =====');
        gs.info('[Skills Hub] Script Include: ' + SI_NAME);
        gs.info('[Skills Hub]   API Name: global.SkillsHubDetection');
        gs.info('[Skills Hub]   sys_id: ' + siSysId);
        gs.info('[Skills Hub]   Client Callable: false');
        gs.info('[Skills Hub]   Methods:');
        gs.info('[Skills Hub]     - detectSkills(text) -> [{ skillId, skillName, confidence }]');
        gs.info('[Skills Hub]     - tagStoryWithSkills(storyId) -> { success, skillsTagged, skillsSkipped }');
        gs.info('[Skills Hub]     - batchTagStories(encodedQuery) -> { success, storiesProcessed, totalSkillsTagged }');
        gs.info('[Skills Hub]   Variations: 20 canonical skills with alias/variation mappings');
        gs.info('[Skills Hub]   Confidence values: "exact" (direct name match) or "partial" (alias/variation match)');
        gs.info('[Skills Hub]   Script length: ' + script.length + ' chars');
        gs.info('[Skills Hub] ==============================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 32_create_skill_detection: ' + e.message);
    }
})();
