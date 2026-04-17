/**
 * Fix Script: 19_create_tier_system.js
 * Purpose: Add calculateUserTier() method to the SkillsHubUtils Script Include
 * Scope: Global
 * Idempotent: Yes - checks if calculateUserTier already exists before injecting
 *
 * Tier System:
 *   Points Calculation:
 *     - Skills owned: +10 each
 *     - Proficiency bonus: Novice +2, Intermediate +5, Proficient +10, Advanced +20, Expert +35
 *     - Per endorsement received: +5 (from u_peer_endorsement_count)
 *     - Per endorsement given: +3 (query u_m2m_skill_endorsement where u_endorser = user)
 *     - Per manager-validated skill: +15 (u_validation_status == 'validated')
 *     - Skills added this quarter: +8 bonus each (sys_created_on within current quarter)
 *
 *   Tiers:
 *     - Starter: 0-49, fa-seedling
 *     - Contributor: 50-149, fa-hand-holding-heart
 *     - Specialist: 150-299, fa-star
 *     - Trailblazer: 300-499, fa-fire
 *     - Luminary: 500+, fa-sun
 *
 * Injection pattern: Same as 14_update_skills_hub_utils.js
 *   - Find SkillsHubUtils Script Include
 *   - Locate insertion point before "type: 'SkillsHubUtils'"
 *   - Inject new method
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: SkillsHubUtils must exist (Phase 1), ideally Phase 2 methods present
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 19_create_tier_system =====');

        // ============================================================
        // 1. Find the existing SkillsHubUtils Script Include
        // ============================================================
        var si = new GlideRecord('sys_script_include');
        si.addQuery('name', 'SkillsHubUtils');
        si.query();

        if (!si.next()) {
            gs.error('[Skills Hub] SkillsHubUtils Script Include not found. Cannot add calculateUserTier.');
            return;
        }

        var siSysId = si.getUniqueValue();
        gs.info('[Skills Hub] Found SkillsHubUtils (sys_id: ' + siSysId + ')');

        var currentScript = si.script.toString();

        // ============================================================
        // 2. Idempotency check
        // ============================================================
        if (currentScript.indexOf('calculateUserTier') > -1) {
            gs.info('[Skills Hub] SkillsHubUtils already contains calculateUserTier method. Skipping.');
            return;
        }

        // ============================================================
        // 3. Build the new method string
        // ============================================================
        var NL = '\n';
        var T4 = '    '; // 4-space indent (matches existing style)

        var newMethod = '';
        newMethod += NL;
        newMethod += T4 + '/* ===== Phase 3: Tier System ===== */' + NL;
        newMethod += NL;
        newMethod += T4 + '/**' + NL;
        newMethod += T4 + ' * Calculate the gamification tier for a user based on their skill activity.' + NL;
        newMethod += T4 + ' * Params: sysparm_user_id (optional, defaults to current user)' + NL;
        newMethod += T4 + ' * Returns JSON: {' + NL;
        newMethod += T4 + ' *   points: number,' + NL;
        newMethod += T4 + ' *   tier_name: string,' + NL;
        newMethod += T4 + ' *   tier_icon: string,' + NL;
        newMethod += T4 + ' *   next_tier_name: string,' + NL;
        newMethod += T4 + ' *   next_tier_threshold: number,' + NL;
        newMethod += T4 + ' *   progress_percent: number' + NL;
        newMethod += T4 + ' * }' + NL;
        newMethod += T4 + ' */' + NL;
        newMethod += T4 + 'calculateUserTier: function() {' + NL;
        newMethod += T4 + T4 + 'var userId = this.getParameter(\'sysparm_user_id\') || gs.getUserID();' + NL;
        newMethod += T4 + T4 + 'var totalPoints = 0;' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + '// Proficiency bonus lookup' + NL;
        newMethod += T4 + T4 + 'var proficiencyBonus = {' + NL;
        newMethod += T4 + T4 + T4 + '\'novice\': 2,' + NL;
        newMethod += T4 + T4 + T4 + '\'intermediate\': 5,' + NL;
        newMethod += T4 + T4 + T4 + '\'proficient\': 10,' + NL;
        newMethod += T4 + T4 + T4 + '\'advanced\': 20,' + NL;
        newMethod += T4 + T4 + T4 + '\'expert\': 35' + NL;
        newMethod += T4 + T4 + '};' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + '// Calculate quarter start date' + NL;
        newMethod += T4 + T4 + 'var now = new GlideDateTime();' + NL;
        newMethod += T4 + T4 + 'var currentMonth = parseInt(now.getMonthLocalTime(), 10);' + NL;
        newMethod += T4 + T4 + 'var currentYear = parseInt(now.getYearLocalTime(), 10);' + NL;
        newMethod += T4 + T4 + 'var quarterStartMonth;' + NL;
        newMethod += T4 + T4 + 'if (currentMonth <= 3) {' + NL;
        newMethod += T4 + T4 + T4 + 'quarterStartMonth = 1;' + NL;
        newMethod += T4 + T4 + '} else if (currentMonth <= 6) {' + NL;
        newMethod += T4 + T4 + T4 + 'quarterStartMonth = 4;' + NL;
        newMethod += T4 + T4 + '} else if (currentMonth <= 9) {' + NL;
        newMethod += T4 + T4 + T4 + 'quarterStartMonth = 7;' + NL;
        newMethod += T4 + T4 + '} else {' + NL;
        newMethod += T4 + T4 + T4 + 'quarterStartMonth = 10;' + NL;
        newMethod += T4 + T4 + '}' + NL;
        newMethod += T4 + T4 + 'var monthStr = (quarterStartMonth < 10) ? \'0\' + quarterStartMonth : \'\' + quarterStartMonth;' + NL;
        newMethod += T4 + T4 + 'var quarterStart = new GlideDateTime(currentYear + \'-\' + monthStr + \'-01 00:00:00\');' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + '// 1-5. Query user skills and calculate points' + NL;
        newMethod += T4 + T4 + 'var gr = new GlideRecord(\'sys_user_has_skill\');' + NL;
        newMethod += T4 + T4 + 'gr.addQuery(\'user\', userId);' + NL;
        newMethod += T4 + T4 + 'gr.query();' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + 'while (gr.next()) {' + NL;
        newMethod += T4 + T4 + T4 + '// 1. Skills owned: +10 each' + NL;
        newMethod += T4 + T4 + T4 + 'totalPoints += 10;' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + T4 + '// 2. Proficiency bonus' + NL;
        newMethod += T4 + T4 + T4 + 'var level = (gr.getValue(\'skill_level\') || \'novice\').toLowerCase();' + NL;
        newMethod += T4 + T4 + T4 + 'if (proficiencyBonus.hasOwnProperty(level)) {' + NL;
        newMethod += T4 + T4 + T4 + T4 + 'totalPoints += proficiencyBonus[level];' + NL;
        newMethod += T4 + T4 + T4 + '}' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + T4 + '// 3. Endorsements received: +5 per endorsement' + NL;
        newMethod += T4 + T4 + T4 + 'var endorseCount = parseInt(gr.getValue(\'u_peer_endorsement_count\') || \'0\', 10);' + NL;
        newMethod += T4 + T4 + T4 + 'totalPoints += endorseCount * 5;' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + T4 + '// 5. Manager-validated skill: +15' + NL;
        newMethod += T4 + T4 + T4 + 'var valStatus = gr.getValue(\'u_validation_status\') || \'\';' + NL;
        newMethod += T4 + T4 + T4 + 'if (valStatus === \'validated\') {' + NL;
        newMethod += T4 + T4 + T4 + T4 + 'totalPoints += 15;' + NL;
        newMethod += T4 + T4 + T4 + '}' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + T4 + '// 6. Skills added this quarter: +8 bonus each' + NL;
        newMethod += T4 + T4 + T4 + 'var createdOn = new GlideDateTime(gr.getValue(\'sys_created_on\') || \'\');' + NL;
        newMethod += T4 + T4 + T4 + 'if (createdOn.compareTo(quarterStart) >= 0) {' + NL;
        newMethod += T4 + T4 + T4 + T4 + 'totalPoints += 8;' + NL;
        newMethod += T4 + T4 + T4 + '}' + NL;
        newMethod += T4 + T4 + '}' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + '// 4. Endorsements given: +3 per endorsement given' + NL;
        newMethod += T4 + T4 + 'var givenGr = new GlideRecord(\'u_m2m_skill_endorsement\');' + NL;
        newMethod += T4 + T4 + 'givenGr.addQuery(\'u_endorser\', userId);' + NL;
        newMethod += T4 + T4 + 'givenGr.query();' + NL;
        newMethod += T4 + T4 + 'var endorsementsGiven = 0;' + NL;
        newMethod += T4 + T4 + 'while (givenGr.next()) {' + NL;
        newMethod += T4 + T4 + T4 + 'endorsementsGiven++;' + NL;
        newMethod += T4 + T4 + '}' + NL;
        newMethod += T4 + T4 + 'totalPoints += endorsementsGiven * 3;' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + '// Tier definitions' + NL;
        newMethod += T4 + T4 + 'var tiers = [' + NL;
        newMethod += T4 + T4 + T4 + '{ name: \'Starter\',      icon: \'fa-seedling\',              min: 0,   max: 49 },' + NL;
        newMethod += T4 + T4 + T4 + '{ name: \'Contributor\',   icon: \'fa-hand-holding-heart\',    min: 50,  max: 149 },' + NL;
        newMethod += T4 + T4 + T4 + '{ name: \'Specialist\',    icon: \'fa-star\',                  min: 150, max: 299 },' + NL;
        newMethod += T4 + T4 + T4 + '{ name: \'Trailblazer\',   icon: \'fa-fire\',                  min: 300, max: 499 },' + NL;
        newMethod += T4 + T4 + T4 + '{ name: \'Luminary\',      icon: \'fa-sun\',                   min: 500, max: 999999 }' + NL;
        newMethod += T4 + T4 + '];' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + '// Determine current tier' + NL;
        newMethod += T4 + T4 + 'var currentTier = tiers[0];' + NL;
        newMethod += T4 + T4 + 'var currentTierIndex = 0;' + NL;
        newMethod += T4 + T4 + 'for (var i = 0; i < tiers.length; i++) {' + NL;
        newMethod += T4 + T4 + T4 + 'if (totalPoints >= tiers[i].min && totalPoints <= tiers[i].max) {' + NL;
        newMethod += T4 + T4 + T4 + T4 + 'currentTier = tiers[i];' + NL;
        newMethod += T4 + T4 + T4 + T4 + 'currentTierIndex = i;' + NL;
        newMethod += T4 + T4 + T4 + T4 + 'break;' + NL;
        newMethod += T4 + T4 + T4 + '}' + NL;
        newMethod += T4 + T4 + '}' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + '// Determine next tier and progress' + NL;
        newMethod += T4 + T4 + 'var nextTierName = \'\';' + NL;
        newMethod += T4 + T4 + 'var nextTierThreshold = 0;' + NL;
        newMethod += T4 + T4 + 'var progressPercent = 100;' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + 'if (currentTierIndex < tiers.length - 1) {' + NL;
        newMethod += T4 + T4 + T4 + 'var nextTier = tiers[currentTierIndex + 1];' + NL;
        newMethod += T4 + T4 + T4 + 'nextTierName = nextTier.name;' + NL;
        newMethod += T4 + T4 + T4 + 'nextTierThreshold = nextTier.min;' + NL;
        newMethod += T4 + T4 + T4 + 'var tierRange = currentTier.max - currentTier.min + 1;' + NL;
        newMethod += T4 + T4 + T4 + 'var pointsInTier = totalPoints - currentTier.min;' + NL;
        newMethod += T4 + T4 + T4 + 'progressPercent = Math.round((pointsInTier / tierRange) * 100);' + NL;
        newMethod += T4 + T4 + T4 + 'if (progressPercent > 100) progressPercent = 100;' + NL;
        newMethod += T4 + T4 + T4 + 'if (progressPercent < 0) progressPercent = 0;' + NL;
        newMethod += T4 + T4 + '}' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + 'var result = {' + NL;
        newMethod += T4 + T4 + T4 + 'points: totalPoints,' + NL;
        newMethod += T4 + T4 + T4 + 'tier_name: currentTier.name,' + NL;
        newMethod += T4 + T4 + T4 + 'tier_icon: currentTier.icon,' + NL;
        newMethod += T4 + T4 + T4 + 'next_tier_name: nextTierName,' + NL;
        newMethod += T4 + T4 + T4 + 'next_tier_threshold: nextTierThreshold,' + NL;
        newMethod += T4 + T4 + T4 + 'progress_percent: progressPercent' + NL;
        newMethod += T4 + T4 + '};' + NL;
        newMethod += NL;
        newMethod += T4 + T4 + 'gs.info(\'[Skills Hub] Tier calculated for user \' + userId + \': \' + currentTier.name + \' (\' + totalPoints + \' pts)\');' + NL;
        newMethod += T4 + T4 + 'return JSON.stringify(result);' + NL;
        newMethod += T4 + '},' + NL;
        newMethod += NL;

        // ============================================================
        // 4. Inject the new method into the existing script
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

        var updatedScript = currentScript.substring(0, insertionPoint) + newMethod + T4 + currentScript.substring(insertionPoint);

        si.script = updatedScript;
        si.update();

        gs.info('[Skills Hub] ===== TIER SYSTEM UPDATE SUMMARY =====');
        gs.info('[Skills Hub] SkillsHubUtils sys_id: ' + siSysId);
        gs.info('[Skills Hub] Method added: calculateUserTier');
        gs.info('[Skills Hub] Original script length: ' + currentScript.length);
        gs.info('[Skills Hub] Updated script length: ' + updatedScript.length);
        gs.info('[Skills Hub] Tiers: Starter (0-49), Contributor (50-149), Specialist (150-299), Trailblazer (300-499), Luminary (500+)');
        gs.info('[Skills Hub] Point sources: skills (+10), proficiency bonus, endorsements received (+5), given (+3), validated (+15), quarterly (+8)');
        gs.info('[Skills Hub] ============================================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 19_create_tier_system: ' + e.message);
    }
})();
