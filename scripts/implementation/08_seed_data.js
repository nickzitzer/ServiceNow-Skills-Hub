/**
 * Fix Script: 08_seed_data.js
 * Purpose: Seed skill profile requirements and a sample category group
 * Scope: Global
 * Idempotent: Yes - checks for existing records by name before creating
 *
 * Seeds:
 *   - 5 role-based skill profile requirements (u_skill_profile_requirement)
 *   - 1 sample skill category group (u_skill_category_group)
 *   - 2 system properties for tier/gamification config (sys_properties)
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: Run 01 through 04 first (tables and choices must exist)
 */
(function() {
    try {
        var results = {
            requirementsCreated: 0,
            requirementsSkipped: 0,
            groupsCreated: 0,
            groupsSkipped: 0,
            propertiesCreated: 0,
            propertiesSkipped: 0,
            skillsCreated: 0,
            errors: []
        };

        gs.info('[Skills Hub] ===== STARTING SEED DATA =====');

        // ================================================================
        // Helper: Get or create a cmn_skill record by name
        // ================================================================
        function getOrCreateSkill(skillName) {
            var gr = new GlideRecord('cmn_skill');
            gr.addQuery('name', skillName);
            gr.query();
            if (gr.next()) {
                return gr.getUniqueValue();
            }
            gr.initialize();
            gr.name = skillName;
            var id = gr.insert();
            if (id) {
                gs.info('[Skills Hub] Created cmn_skill: ' + skillName + ' (' + id + ')');
                results.skillsCreated++;
            } else {
                gs.error('[Skills Hub] FAILED to create cmn_skill: ' + skillName);
                results.errors.push('Failed to create skill: ' + skillName);
            }
            return id;
        }

        // ================================================================
        // Helper: Create a profile requirement if it does not already exist
        // ================================================================
        function seedRequirement(jobTitle, skillName, requiredLevel, priority) {
            try {
                var skillId = getOrCreateSkill(skillName);
                if (!skillId) return;

                var gr = new GlideRecord('u_skill_profile_requirement');
                gr.addQuery('u_job_title', jobTitle);
                gr.addQuery('u_skill', skillId);
                gr.query();
                if (gr.hasNext()) {
                    gs.info('[Skills Hub] Requirement exists: ' + jobTitle + ' / ' + skillName);
                    results.requirementsSkipped++;
                    return;
                }
                gr.initialize();
                gr.u_job_title = jobTitle;
                gr.u_skill = skillId;
                gr.u_required_level = requiredLevel;
                gr.u_priority = priority;
                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Created requirement: ' + jobTitle + ' / ' + skillName + ' (' + id + ')');
                    results.requirementsCreated++;
                } else {
                    var msg = 'FAILED to create requirement: ' + jobTitle + ' / ' + skillName;
                    gs.error('[Skills Hub] ' + msg);
                    results.errors.push(msg);
                }
            } catch (e) {
                var errMsg = 'Error creating requirement "' + jobTitle + ' / ' + skillName + '": ' + e.message;
                gs.error('[Skills Hub] ' + errMsg);
                results.errors.push(errMsg);
            }
        }

        // ================================================================
        // SKILL PROFILE REQUIREMENTS (5 sample records)
        // ================================================================
        gs.info('[Skills Hub] --- Seeding Skill Profile Requirements ---');

        seedRequirement('Software Engineer', 'JavaScript', 'proficient', 'required');
        seedRequirement('Software Engineer', 'ServiceNow', 'intermediate', 'preferred');
        seedRequirement('Team Lead', 'Leadership', 'advanced', 'required');
        seedRequirement('Business Analyst', 'Requirements Analysis', 'proficient', 'required');
        seedRequirement('DevOps Engineer', 'CI/CD', 'proficient', 'required');

        // ================================================================
        // SKILL CATEGORY GROUP (1 sample group)
        // ================================================================
        gs.info('[Skills Hub] --- Seeding Skill Category Group ---');

        var groupName = 'Full Stack Development';
        var grp = new GlideRecord('u_skill_category_group');
        grp.addQuery('u_group_name', groupName);
        grp.query();
        if (grp.hasNext()) {
            gs.info('[Skills Hub] Category group exists: ' + groupName);
            results.groupsSkipped++;
        } else {
            grp.initialize();
            grp.u_group_name = groupName;
            grp.u_description = 'Cross-category group combining front-end, back-end, and infrastructure skills';
            var groupId = grp.insert();
            if (groupId) {
                gs.info('[Skills Hub] Created category group: ' + groupName + ' (' + groupId + ')');
                results.groupsCreated++;
            } else {
                gs.error('[Skills Hub] FAILED to create category group: ' + groupName);
                results.errors.push('Failed to create category group: ' + groupName);
            }
        }

        // ================================================================
        // TIER SYSTEM PROPERTIES (2 system properties)
        // ================================================================
        gs.info('[Skills Hub] --- Seeding Tier System Properties ---');

        function seedProperty(propName, propValue, propDescription) {
            try {
                var pr = new GlideRecord('sys_properties');
                pr.addQuery('name', propName);
                pr.query();
                if (pr.hasNext()) {
                    gs.info('[Skills Hub] Property exists: ' + propName);
                    results.propertiesSkipped++;
                    return;
                }
                pr.initialize();
                pr.name = propName;
                pr.value = propValue;
                pr.description = propDescription;
                pr.type = 'string';
                var id = pr.insert();
                if (id) {
                    gs.info('[Skills Hub] Created property: ' + propName + ' (' + id + ')');
                    results.propertiesCreated++;
                } else {
                    var msg = 'FAILED to create property: ' + propName;
                    gs.error('[Skills Hub] ' + msg);
                    results.errors.push(msg);
                }
            } catch (e) {
                var errMsg = 'Error creating property "' + propName + '": ' + e.message;
                gs.error('[Skills Hub] ' + errMsg);
                results.errors.push(errMsg);
            }
        }

        // Tier configuration — scoring weights and tier thresholds
        var tierConfig = JSON.stringify({
            scoring: {
                per_skill: 10,
                proficiency: { novice: 2, intermediate: 5, proficient: 10, advanced: 20, expert: 35 },
                endorsement_received: 5,
                endorsement_given: 3,
                manager_validated: 15,
                skill_added_this_quarter: 8
            },
            tiers: [
                { name: 'Starter', min: 0, max: 49, icon: 'fa-seedling', description: 'Just getting started' },
                { name: 'Contributor', min: 50, max: 149, icon: 'fa-hand-holding-heart', description: 'Building your portfolio' },
                { name: 'Specialist', min: 150, max: 299, icon: 'fa-star', description: 'Deep expertise emerging' },
                { name: 'Trailblazer', min: 300, max: 499, icon: 'fa-fire', description: 'Leading by example' },
                { name: 'Luminary', min: 500, max: 999999, icon: 'fa-sun', description: 'Organizational skill champion' }
            ]
        });

        seedProperty(
            'skills_hub.tier_config',
            tierConfig,
            'Skills Hub tier system configuration (JSON). Defines scoring weights and tier thresholds.'
        );

        seedProperty(
            'skills_hub.scoring_enabled',
            'true',
            'Skills Hub tier scoring enabled flag. Set to false to disable tier calculations.'
        );

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== SEED DATA SUMMARY =====');
        gs.info('[Skills Hub] Skills created (cmn_skill): ' + results.skillsCreated);
        gs.info('[Skills Hub] Requirements created: ' + results.requirementsCreated);
        gs.info('[Skills Hub] Requirements skipped (already existed): ' + results.requirementsSkipped);
        gs.info('[Skills Hub] Category groups created: ' + results.groupsCreated);
        gs.info('[Skills Hub] Category groups skipped (already existed): ' + results.groupsSkipped);
        gs.info('[Skills Hub] Properties created: ' + results.propertiesCreated);
        gs.info('[Skills Hub] Properties skipped (already existed): ' + results.propertiesSkipped);
        gs.info('[Skills Hub] Errors: ' + results.errors.length);
        if (results.errors.length > 0) {
            for (var i = 0; i < results.errors.length; i++) {
                gs.error('[Skills Hub] Error: ' + results.errors[i]);
            }
        }
        gs.info('[Skills Hub] ================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 08_seed_data: ' + e.message);
    }
})();
