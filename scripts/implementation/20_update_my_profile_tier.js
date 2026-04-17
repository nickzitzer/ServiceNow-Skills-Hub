/**
 * Fix Script: 20_update_my_profile_tier.js
 * Purpose: Update My Profile widget to display tier system instead of old gamification card
 * Scope: Global
 * Idempotent: Yes - checks if tier system already present before patching
 *
 * Changes:
 *   - Server script: replaces old skill_score/score_percent with full tier calculation
 *   - Template: replaces gamification-card div with tier-card display
 *   - CSS: replaces gamification styles with tier styles
 *   - Client script: NOT touched (keeps existing interactivity)
 *
 * Tier System:
 *   Starter (0-49)    fa-seedling            Just getting started
 *   Contributor (50-149) fa-hand-holding-heart Building your portfolio
 *   Specialist (150-299) fa-star              Deep expertise emerging
 *   Trailblazer (300-499) fa-fire             Leading by example
 *   Luminary (500+)   fa-sun                  Organizational skill champion
 *
 * Points:
 *   +10 per skill owned, proficiency bonus (2/5/10/20/35), +5 per endorsement received,
 *   +3 per endorsement given, +15 per validated skill, +8 per skill added this quarter
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: My Profile widget must exist (from update set import)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING MY PROFILE TIER UPDATE (Script 20) =====');

        // ================================================================
        // 1. Find the My Profile widget
        // ================================================================
        var widgetGR = new GlideRecord('sp_widget');
        widgetGR.addQuery('name', 'CONTAINS', 'My Profile');
        widgetGR.query();

        if (!widgetGR.next()) {
            // Fallback: search for Skills Hub profile widget
            widgetGR = new GlideRecord('sp_widget');
            widgetGR.addQuery('name', 'CONTAINS', 'Skills Hub');
            widgetGR.addQuery('name', 'CONTAINS', 'Profile');
            widgetGR.query();
            if (!widgetGR.next()) {
                gs.error('[Skills Hub] My Profile widget not found (searched "My Profile" and "Skills Hub + Profile"). Aborting.');
                return;
            }
        }

        var widgetSysId = widgetGR.getUniqueValue();
        var widgetName = widgetGR.getValue('name');
        gs.info('[Skills Hub] Found widget: ' + widgetName + ' (sys_id: ' + widgetSysId + ')');

        // ================================================================
        // 2. Idempotency check - is tier system already present?
        // ================================================================
        var currentScript = widgetGR.getValue('script') || '';
        if (currentScript.indexOf('data.tier') > -1 && currentScript.indexOf('calculateTier') > -1) {
            gs.info('[Skills Hub] My Profile widget already contains tier system (data.tier and calculateTier found). Skipping.');
            return;
        }

        // ================================================================
        // 3. Build new SERVER SCRIPT with tier calculation
        // ================================================================
        var NL = '\n';
        var serverScript = '';
        serverScript += '(function() {' + NL;
        serverScript += '    var me = gs.getUserID();' + NL;
        serverScript += '' + NL;
        serverScript += '    // ---- Action handlers (keep existing behavior) ----' + NL;
        serverScript += '    if (input && input.action) {' + NL;
        serverScript += '        if (input.action == "update_proficiency") {' + NL;
        serverScript += '            var upGr = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '            if (upGr.get(input.record_id)) {' + NL;
        serverScript += '                upGr.skill_level = input.level;' + NL;
        serverScript += '                upGr.update();' + NL;
        serverScript += '                data.result = { success: true };' + NL;
        serverScript += '            } else {' + NL;
        serverScript += '                data.result = { success: false, error: "Skill record not found" };' + NL;
        serverScript += '            }' + NL;
        serverScript += '            return;' + NL;
        serverScript += '        }' + NL;
        serverScript += '        if (input.action == "update_interest") {' + NL;
        serverScript += '            var uiGr = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '            if (uiGr.get(input.record_id)) {' + NL;
        serverScript += '                uiGr.u_interest_level = input.interest_level;' + NL;
        serverScript += '                uiGr.update();' + NL;
        serverScript += '                data.result = { success: true };' + NL;
        serverScript += '            } else {' + NL;
        serverScript += '                data.result = { success: false, error: "Skill record not found" };' + NL;
        serverScript += '            }' + NL;
        serverScript += '            return;' + NL;
        serverScript += '        }' + NL;
        serverScript += '        if (input.action == "remove_skill") {' + NL;
        serverScript += '            var rmGr = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '            if (rmGr.get(input.record_id)) {' + NL;
        serverScript += '                rmGr.deleteRecord();' + NL;
        serverScript += '                data.result = { success: true };' + NL;
        serverScript += '            } else {' + NL;
        serverScript += '                data.result = { success: false, error: "Skill record not found" };' + NL;
        serverScript += '            }' + NL;
        serverScript += '            return;' + NL;
        serverScript += '        }' + NL;
        serverScript += '        if (input.action == "add_skill") {' + NL;
        serverScript += '            var addGr = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '            addGr.addQuery("user", me);' + NL;
        serverScript += '            addGr.addQuery("skill", input.skill_id);' + NL;
        serverScript += '            addGr.query();' + NL;
        serverScript += '            if (addGr.hasNext()) {' + NL;
        serverScript += '                data.result = { success: false, error: "Skill already added" };' + NL;
        serverScript += '            } else {' + NL;
        serverScript += '                var newSkill = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '                newSkill.initialize();' + NL;
        serverScript += '                newSkill.user = me;' + NL;
        serverScript += '                newSkill.skill = input.skill_id;' + NL;
        serverScript += '                if (input.level) newSkill.skill_level = input.level;' + NL;
        serverScript += '                var newId = newSkill.insert();' + NL;
        serverScript += '                data.result = { success: !!newId, sys_id: newId };' + NL;
        serverScript += '            }' + NL;
        serverScript += '            return;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // ---- User info ----' + NL;
        serverScript += '    var userGR = new GlideRecord("sys_user");' + NL;
        serverScript += '    userGR.get(me);' + NL;
        serverScript += '    data.user = {' + NL;
        serverScript += '        name: userGR.name.toString(),' + NL;
        serverScript += '        title: userGR.title.toString() || "Employee",' + NL;
        serverScript += '        department: userGR.department.getDisplayValue() || "",' + NL;
        serverScript += '        avatar: userGR.photo.getDisplayValue() || ""' + NL;
        serverScript += '    };' + NL;
        serverScript += '' + NL;
        serverScript += '    // ---- Fetch skills ----' + NL;
        serverScript += '    data.skills = [];' + NL;
        serverScript += '    var totalPoints = 0;' + NL;
        serverScript += '    var totalEndorsements = 0;' + NL;
        serverScript += '    var totalValidations = 0;' + NL;
        serverScript += '    var quarterSkills = 0;' + NL;
        serverScript += '' + NL;
        serverScript += '    // Calculate quarter start for bonus' + NL;
        serverScript += '    var now = new GlideDateTime();' + NL;
        serverScript += '    var currentMonth = parseInt(now.getMonthLocalTime(), 10);' + NL;
        serverScript += '    var quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3 + 1;' + NL;
        serverScript += '    var quarterStart = new GlideDateTime();' + NL;
        serverScript += '    quarterStart.setDisplayValue(now.getYearLocalTime() + "-" + (quarterStartMonth < 10 ? "0" : "") + quarterStartMonth + "-01 00:00:00");' + NL;
        serverScript += '' + NL;
        serverScript += '    // Proficiency bonus map' + NL;
        serverScript += '    var profBonus = {' + NL;
        serverScript += '        "novice": 2,' + NL;
        serverScript += '        "intermediate": 5,' + NL;
        serverScript += '        "proficient": 10,' + NL;
        serverScript += '        "advanced": 20,' + NL;
        serverScript += '        "expert": 35' + NL;
        serverScript += '    };' + NL;
        serverScript += '' + NL;
        serverScript += '    var gr = new GlideRecord("sys_user_has_skill");' + NL;
        serverScript += '    gr.addQuery("user", me);' + NL;
        serverScript += '    gr.orderBy("skill.name");' + NL;
        serverScript += '    gr.query();' + NL;
        serverScript += '' + NL;
        serverScript += '    while (gr.next()) {' + NL;
        serverScript += '        var skillLevel = gr.skill_level.toString().toLowerCase();' + NL;
        serverScript += '        var endorseCount = parseInt(gr.getValue("u_peer_endorsement_count") || "0", 10);' + NL;
        serverScript += '        var valStatus = gr.getValue("u_validation_status") || "";' + NL;
        serverScript += '        var createdOn = gr.getValue("sys_created_on") || "";' + NL;
        serverScript += '' + NL;
        serverScript += '        data.skills.push({' + NL;
        serverScript += '            sys_id: gr.getUniqueValue(),' + NL;
        serverScript += '            name: gr.skill.name.toString(),' + NL;
        serverScript += '            level: gr.skill_level.getDisplayValue() || "Not Set",' + NL;
        serverScript += '            level_value: skillLevel,' + NL;
        serverScript += '            category: gr.skill.category.getDisplayValue() || "",' + NL;
        serverScript += '            interest_level: gr.getValue("u_interest_level") || "",' + NL;
        serverScript += '            endorsement_count: endorseCount,' + NL;
        serverScript += '            validation_status: valStatus,' + NL;
        serverScript += '            manager_assessed_level: gr.getValue("u_manager_assessed_level") || ""' + NL;
        serverScript += '        });' + NL;
        serverScript += '' + NL;
        serverScript += '        // +10 per skill owned' + NL;
        serverScript += '        totalPoints += 10;' + NL;
        serverScript += '' + NL;
        serverScript += '        // Proficiency bonus' + NL;
        serverScript += '        if (profBonus[skillLevel]) {' + NL;
        serverScript += '            totalPoints += profBonus[skillLevel];' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        // +5 per endorsement received' + NL;
        serverScript += '        totalPoints += endorseCount * 5;' + NL;
        serverScript += '        totalEndorsements += endorseCount;' + NL;
        serverScript += '' + NL;
        serverScript += '        // +15 per manager-validated skill' + NL;
        serverScript += '        if (valStatus == "validated") {' + NL;
        serverScript += '            totalPoints += 15;' + NL;
        serverScript += '            totalValidations++;' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        // +8 bonus for skills added this quarter' + NL;
        serverScript += '        if (createdOn && createdOn >= quarterStart.getValue()) {' + NL;
        serverScript += '            totalPoints += 8;' + NL;
        serverScript += '            quarterSkills++;' + NL;
        serverScript += '        }' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    // +3 per endorsement GIVEN by this user' + NL;
        serverScript += '    var endorsementsGiven = 0;' + NL;
        serverScript += '    var egGr = new GlideRecord("u_m2m_skill_endorsement");' + NL;
        serverScript += '    egGr.addQuery("u_endorser", me);' + NL;
        serverScript += '    egGr.query();' + NL;
        serverScript += '    while (egGr.next()) { endorsementsGiven++; }' + NL;
        serverScript += '    totalPoints += endorsementsGiven * 3;' + NL;
        serverScript += '' + NL;
        serverScript += '    // ---- Determine tier ----' + NL;
        serverScript += '    function calculateTier(points) {' + NL;
        serverScript += '        var tiers = [' + NL;
        serverScript += '            { name: "Starter", min: 0, max: 49, icon: "fa-seedling", desc: "Just getting started" },' + NL;
        serverScript += '            { name: "Contributor", min: 50, max: 149, icon: "fa-hand-holding-heart", desc: "Building your portfolio" },' + NL;
        serverScript += '            { name: "Specialist", min: 150, max: 299, icon: "fa-star", desc: "Deep expertise emerging" },' + NL;
        serverScript += '            { name: "Trailblazer", min: 300, max: 499, icon: "fa-fire", desc: "Leading by example" },' + NL;
        serverScript += '            { name: "Luminary", min: 500, max: 999999, icon: "fa-sun", desc: "Organizational skill champion" }' + NL;
        serverScript += '        ];' + NL;
        serverScript += '' + NL;
        serverScript += '        var currentTier = tiers[0];' + NL;
        serverScript += '        var nextTier = tiers[1];' + NL;
        serverScript += '' + NL;
        serverScript += '        for (var i = 0; i < tiers.length; i++) {' + NL;
        serverScript += '            if (points >= tiers[i].min && points <= tiers[i].max) {' + NL;
        serverScript += '                currentTier = tiers[i];' + NL;
        serverScript += '                nextTier = (i < tiers.length - 1) ? tiers[i + 1] : null;' + NL;
        serverScript += '                break;' + NL;
        serverScript += '            }' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        var progressPercent = 100;' + NL;
        serverScript += '        if (nextTier) {' + NL;
        serverScript += '            var rangeSize = nextTier.min - currentTier.min;' + NL;
        serverScript += '            var progress = points - currentTier.min;' + NL;
        serverScript += '            progressPercent = Math.min(Math.round((progress / rangeSize) * 100), 100);' + NL;
        serverScript += '        }' + NL;
        serverScript += '' + NL;
        serverScript += '        return {' + NL;
        serverScript += '            name: currentTier.name,' + NL;
        serverScript += '            icon: currentTier.icon,' + NL;
        serverScript += '            description: currentTier.desc,' + NL;
        serverScript += '            points: points,' + NL;
        serverScript += '            next_tier_name: nextTier ? nextTier.name : null,' + NL;
        serverScript += '            next_tier_threshold: nextTier ? nextTier.min : null,' + NL;
        serverScript += '            progress_percent: progressPercent' + NL;
        serverScript += '        };' + NL;
        serverScript += '    }' + NL;
        serverScript += '' + NL;
        serverScript += '    data.tier = calculateTier(totalPoints);' + NL;
        serverScript += '' + NL;
        serverScript += '    // ---- Stats summary ----' + NL;
        serverScript += '    data.stats = {' + NL;
        serverScript += '        total_skills: data.skills.length,' + NL;
        serverScript += '        total_endorsements: totalEndorsements,' + NL;
        serverScript += '        endorsements_given: endorsementsGiven,' + NL;
        serverScript += '        total_validations: totalValidations,' + NL;
        serverScript += '        quarter_skills: quarterSkills,' + NL;
        serverScript += '        skill_score: totalPoints' + NL;
        serverScript += '    };' + NL;
        serverScript += '' + NL;
        serverScript += '    // ---- Available skills for add modal ----' + NL;
        serverScript += '    data.available_skills = [];' + NL;
        serverScript += '    var skillList = new GlideRecord("cmn_skill");' + NL;
        serverScript += '    skillList.addActiveQuery();' + NL;
        serverScript += '    skillList.orderBy("name");' + NL;
        serverScript += '    skillList.setLimit(200);' + NL;
        serverScript += '    skillList.query();' + NL;
        serverScript += '    while (skillList.next()) {' + NL;
        serverScript += '        data.available_skills.push({' + NL;
        serverScript += '            sys_id: skillList.getUniqueValue(),' + NL;
        serverScript += '            name: skillList.name.toString(),' + NL;
        serverScript += '            category: skillList.category.getDisplayValue() || ""' + NL;
        serverScript += '        });' + NL;
        serverScript += '    }' + NL;
        serverScript += '})();';

        // ================================================================
        // 4. Build TEMPLATE replacement
        // ================================================================
        var tierCardHTML = '' +
            '<div class="tier-card">' + NL +
            '   <div class="tier-badge">' + NL +
            '      <i class="fa {{c.data.tier.icon}} tier-icon"></i>' + NL +
            '   </div>' + NL +
            '   <div class="tier-name">{{c.data.tier.name}}</div>' + NL +
            '   <div class="tier-desc">{{c.data.tier.description}}</div>' + NL +
            '   <div class="tier-points">{{c.data.tier.points}} Points</div>' + NL +
            '   <div class="tier-progress">' + NL +
            '      <div class="tier-progress-bar">' + NL +
            '         <div class="tier-progress-fill" ng-style="{width: c.data.tier.progress_percent + \'%\'}"></div>' + NL +
            '      </div>' + NL +
            '      <div class="tier-progress-label" ng-if="c.data.tier.next_tier_name">' + NL +
            '         {{c.data.tier.next_tier_threshold - c.data.tier.points}} pts to {{c.data.tier.next_tier_name}}' + NL +
            '      </div>' + NL +
            '      <div class="tier-progress-label" ng-if="!c.data.tier.next_tier_name">' + NL +
            '         Maximum tier reached!' + NL +
            '      </div>' + NL +
            '   </div>' + NL +
            '</div>';

        // ================================================================
        // 5. Build CSS replacement
        // ================================================================
        var tierCSS = '' +
            '/* ===== Tier System Styles (Phase 3) ===== */' + NL +
            '.tier-card {' + NL +
            '    background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);' + NL +
            '    border-radius: 12px;' + NL +
            '    padding: 24px;' + NL +
            '    text-align: center;' + NL +
            '    margin-bottom: 20px;' + NL +
            '    border: 1px solid #d0e5f5;' + NL +
            '    box-shadow: 0 2px 8px rgba(0, 114, 206, 0.08);' + NL +
            '}' + NL +
            '.tier-badge {' + NL +
            '    display: inline-flex;' + NL +
            '    align-items: center;' + NL +
            '    justify-content: center;' + NL +
            '    width: 80px;' + NL +
            '    height: 80px;' + NL +
            '    border-radius: 50%;' + NL +
            '    background: linear-gradient(135deg, #0072CE 0%, #005AA0 100%);' + NL +
            '    margin-bottom: 12px;' + NL +
            '}' + NL +
            '.tier-icon {' + NL +
            '    font-size: 2.5em;' + NL +
            '    color: #ffffff;' + NL +
            '}' + NL +
            '.tier-name {' + NL +
            '    font-size: 1.5em;' + NL +
            '    font-weight: 700;' + NL +
            '    color: #333333;' + NL +
            '    margin-bottom: 4px;' + NL +
            '}' + NL +
            '.tier-desc {' + NL +
            '    font-size: 0.9em;' + NL +
            '    color: #777777;' + NL +
            '    margin-bottom: 12px;' + NL +
            '}' + NL +
            '.tier-points {' + NL +
            '    font-size: 1.25em;' + NL +
            '    font-weight: 600;' + NL +
            '    color: #0072CE;' + NL +
            '    margin-bottom: 16px;' + NL +
            '}' + NL +
            '.tier-progress {' + NL +
            '    max-width: 300px;' + NL +
            '    margin: 0 auto;' + NL +
            '}' + NL +
            '.tier-progress-bar {' + NL +
            '    height: 8px;' + NL +
            '    background-color: #e0e0e0;' + NL +
            '    border-radius: 4px;' + NL +
            '    overflow: hidden;' + NL +
            '    margin-bottom: 8px;' + NL +
            '}' + NL +
            '.tier-progress-fill {' + NL +
            '    height: 100%;' + NL +
            '    background: linear-gradient(90deg, #0072CE 0%, #00A3E0 100%);' + NL +
            '    border-radius: 4px;' + NL +
            '    transition: width 0.5s ease;' + NL +
            '}' + NL +
            '.tier-progress-label {' + NL +
            '    font-size: 0.85em;' + NL +
            '    color: #666666;' + NL +
            '}';

        // ================================================================
        // 6. Apply SERVER SCRIPT update
        // ================================================================
        gs.info('[Skills Hub] Updating server script...');
        widgetGR.setValue('script', serverScript);

        // ================================================================
        // 7. Apply TEMPLATE update - replace gamification card with tier card
        // ================================================================
        gs.info('[Skills Hub] Updating template...');
        var currentTemplate = widgetGR.getValue('template') || '';

        if (currentTemplate.indexOf('gamification-card') > -1) {
            // Find and replace the gamification card section
            var gamStart = currentTemplate.indexOf('<div class="gamification-card"');
            if (gamStart === -1) {
                // Try alternate pattern
                gamStart = currentTemplate.indexOf('<div class=\'gamification-card\'');
            }
            if (gamStart > -1) {
                // Find the closing div - count nested divs
                var depth = 0;
                var searchPos = gamStart;
                var gamEnd = -1;
                while (searchPos < currentTemplate.length) {
                    var nextOpen = currentTemplate.indexOf('<div', searchPos + 1);
                    var nextClose = currentTemplate.indexOf('</div>', searchPos + 1);
                    if (nextClose === -1) break;

                    if (nextOpen > -1 && nextOpen < nextClose) {
                        depth++;
                        searchPos = nextOpen + 4;
                    } else {
                        if (depth === 0) {
                            gamEnd = nextClose + 6; // length of '</div>'
                            break;
                        }
                        depth--;
                        searchPos = nextClose + 6;
                    }
                }

                if (gamEnd > gamStart) {
                    var newTemplate = currentTemplate.substring(0, gamStart) + tierCardHTML + currentTemplate.substring(gamEnd);
                    widgetGR.setValue('template', newTemplate);
                    gs.info('[Skills Hub] Replaced gamification-card section in template');
                } else {
                    gs.warn('[Skills Hub] Could not find closing div for gamification-card. Appending tier card to template.');
                    widgetGR.setValue('template', currentTemplate + NL + tierCardHTML);
                }
            } else {
                gs.warn('[Skills Hub] gamification-card div not found by position. Appending tier card to template.');
                widgetGR.setValue('template', currentTemplate + NL + tierCardHTML);
            }
        } else if (currentTemplate.indexOf('tier-card') > -1) {
            gs.info('[Skills Hub] Template already contains tier-card. Leaving template unchanged.');
        } else {
            // No gamification card found - inject tier card before first skill-related section or append
            var skillSectionIdx = currentTemplate.indexOf('ng-repeat');
            if (skillSectionIdx > -1) {
                // Find the parent div before ng-repeat
                var parentStart = currentTemplate.lastIndexOf('<div', skillSectionIdx);
                if (parentStart > -1) {
                    var newTemplateInsert = currentTemplate.substring(0, parentStart) + tierCardHTML + NL + currentTemplate.substring(parentStart);
                    widgetGR.setValue('template', newTemplateInsert);
                    gs.info('[Skills Hub] Injected tier card before skill list in template');
                } else {
                    widgetGR.setValue('template', tierCardHTML + NL + currentTemplate);
                    gs.info('[Skills Hub] Prepended tier card to template');
                }
            } else {
                widgetGR.setValue('template', tierCardHTML + NL + currentTemplate);
                gs.info('[Skills Hub] Prepended tier card to template (no ng-repeat found)');
            }
        }

        // ================================================================
        // 8. Apply CSS update - replace gamification styles with tier styles
        // ================================================================
        gs.info('[Skills Hub] Updating CSS...');
        var currentCSS = widgetGR.getValue('css') || '';

        if (currentCSS.indexOf('.tier-card') > -1) {
            gs.info('[Skills Hub] CSS already contains .tier-card styles. Leaving CSS unchanged.');
        } else if (currentCSS.indexOf('.gamification-card') > -1) {
            // Remove old gamification styles and add tier styles
            // Find the gamification section
            var gamCSSStart = currentCSS.indexOf('.gamification-card');
            if (gamCSSStart > -1) {
                // Look backwards for a comment marker
                var commentBefore = currentCSS.lastIndexOf('/*', gamCSSStart);
                if (commentBefore > -1 && (gamCSSStart - commentBefore) < 100) {
                    gamCSSStart = commentBefore;
                }
                // Find the end of gamification CSS block - look for the next section comment or end
                var nextSection = currentCSS.indexOf('/*', gamCSSStart + 10);
                var gamCSSEnd;
                if (nextSection > -1) {
                    gamCSSEnd = nextSection;
                } else {
                    // Find the last closing brace that is part of gamification styles
                    // Search for patterns like .gamification-* and find their closing braces
                    gamCSSEnd = currentCSS.length;
                    var lastGamRef = currentCSS.lastIndexOf('.gamification');
                    if (lastGamRef > -1) {
                        var braceAfter = currentCSS.indexOf('}', lastGamRef);
                        if (braceAfter > -1) {
                            gamCSSEnd = braceAfter + 1;
                        }
                    }
                }

                var newCSS = currentCSS.substring(0, gamCSSStart) + tierCSS + NL + currentCSS.substring(gamCSSEnd);
                widgetGR.setValue('css', newCSS);
                gs.info('[Skills Hub] Replaced gamification CSS with tier CSS');
            }
        } else {
            // No gamification styles - just append tier styles
            if (currentCSS.trim().length > 0) {
                widgetGR.setValue('css', currentCSS + NL + NL + tierCSS);
            } else {
                widgetGR.setValue('css', tierCSS);
            }
            gs.info('[Skills Hub] Appended tier CSS (no gamification styles found to replace)');
        }

        // ================================================================
        // 9. Save the widget
        // ================================================================
        widgetGR.update();
        gs.info('[Skills Hub] Widget updated successfully.');

        // ================================================================
        // 10. Summary
        // ================================================================
        gs.info('[Skills Hub] ===== MY PROFILE TIER UPDATE SUMMARY =====');
        gs.info('[Skills Hub] Widget: ' + widgetName + ' (sys_id: ' + widgetSysId + ')');
        gs.info('[Skills Hub] Server script: replaced with tier calculation');
        gs.info('[Skills Hub] Template: gamification card replaced with tier card');
        gs.info('[Skills Hub] CSS: gamification styles replaced with tier styles');
        gs.info('[Skills Hub] Client script: NOT modified');
        gs.info('[Skills Hub] ===========================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 20_update_my_profile_tier: ' + e.message);
    }
})();
