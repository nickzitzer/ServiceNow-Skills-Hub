/**
 * Fix Script: 29_create_pa_indicators.js
 * Purpose: Create Performance Analytics indicators and breakdowns for Skills Hub
 * Scope: Global
 * Idempotent: Yes - checks existence by name before creating any record
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 27_create_update_set_phase4.js and 28_create_demand_tables.js first
 *
 * Creates:
 *   Indicators (pa_indicators):
 *     1. Skills Hub - Skills Supply
 *     2. Skills Hub - Endorsement Velocity
 *     3. Skills Hub - Validation Rate
 *     4. Skills Hub - Skill Growth
 *     5. Skills Hub - Skills Demand
 *     6. Skills Hub - Capacity Utilization (scripted)
 *
 *   Breakdowns (pa_breakdowns):
 *     1. Skills Hub - By Department
 *     2. Skills Hub - By Proficiency Level
 *
 *   Breakdown relations (pa_indicator_breakdowns):
 *     Each indicator linked to both breakdowns (where applicable)
 *
 * NOTE: Requires Performance Analytics plugin (com.snc.pa).
 *       Script detects missing PA tables and exits gracefully with a warning.
 */
(function() {
    try {
        var created = 0;
        var skipped = 0;
        var errors = 0;

        gs.info('[Skills Hub] === Creating PA Indicators & Breakdowns ===');

        // ================================================================
        // Pre-flight: Check if PA tables exist
        // ================================================================
        function paTableExists(tableName) {
            var tbl = new GlideRecord('sys_db_object');
            tbl.addQuery('name', tableName);
            tbl.query();
            return tbl.hasNext();
        }

        if (!paTableExists('pa_indicators')) {
            gs.warn('[Skills Hub] PA table "pa_indicators" not found. The Performance Analytics plugin (com.snc.pa) may not be activated. Skipping PA indicator creation.');
            gs.warn('[Skills Hub] To resolve: Activate the "Performance Analytics - Content Pack" plugin, then re-run this script.');
            return;
        }

        if (!paTableExists('pa_breakdowns')) {
            gs.warn('[Skills Hub] PA table "pa_breakdowns" not found. The Performance Analytics plugin (com.snc.pa) may not be activated. Skipping PA breakdown creation.');
            return;
        }

        // ================================================================
        // Helper: Create a PA indicator if it does not already exist
        // ================================================================
        function createIndicator(config) {
            try {
                var gr = new GlideRecord('pa_indicators');
                gr.addQuery('name', config.name);
                gr.query();
                if (gr.next()) {
                    gs.info('[Skills Hub] PA Indicator already exists: "' + config.name + '" (' + gr.getUniqueValue() + ')');
                    skipped++;
                    return gr.getUniqueValue();
                }

                gr.initialize();
                gr.setValue('name', config.name);
                gr.setValue('description', config.description || '');

                // Indicator type: 1 = collect, 2 = derive/formula, 3 = manual
                if (config.type !== undefined) {
                    gr.setValue('type', config.type);
                }

                if (config.cube) {
                    gr.setValue('cube', config.cube);
                }

                if (config.fact_table) {
                    gr.setValue('fact_table', config.fact_table);
                }

                if (config.aggregate) {
                    gr.setValue('aggregate', config.aggregate);
                }

                if (config.conditions) {
                    gr.setValue('conditions', config.conditions);
                }

                if (config.frequency) {
                    gr.setValue('frequency', config.frequency);
                }

                if (config.active !== undefined) {
                    gr.setValue('active', config.active);
                } else {
                    gr.setValue('active', true);
                }

                if (config.direction) {
                    gr.setValue('direction', config.direction);
                }

                if (config.formula) {
                    gr.setValue('formula', config.formula);
                }

                if (config.script) {
                    gr.setValue('script', config.script);
                }

                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Created PA Indicator: "' + config.name + '" (' + id + ')');
                    created++;
                    return id;
                } else {
                    gs.error('[Skills Hub] FAILED to create PA Indicator: "' + config.name + '"');
                    errors++;
                    return null;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error creating indicator "' + config.name + '": ' + e.message);
                errors++;
                return null;
            }
        }

        // ================================================================
        // Helper: Create a PA breakdown if it does not already exist
        // ================================================================
        function createBreakdown(config) {
            try {
                var gr = new GlideRecord('pa_breakdowns');
                gr.addQuery('name', config.name);
                gr.query();
                if (gr.next()) {
                    gs.info('[Skills Hub] PA Breakdown already exists: "' + config.name + '" (' + gr.getUniqueValue() + ')');
                    skipped++;
                    return gr.getUniqueValue();
                }

                gr.initialize();
                gr.setValue('name', config.name);
                gr.setValue('description', config.description || '');

                if (config.fact_table) {
                    gr.setValue('fact_table', config.fact_table);
                }

                if (config.dimension) {
                    gr.setValue('dimension', config.dimension);
                }

                if (config.active !== undefined) {
                    gr.setValue('active', config.active);
                } else {
                    gr.setValue('active', true);
                }

                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Created PA Breakdown: "' + config.name + '" (' + id + ')');
                    created++;
                    return id;
                } else {
                    gs.error('[Skills Hub] FAILED to create PA Breakdown: "' + config.name + '"');
                    errors++;
                    return null;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error creating breakdown "' + config.name + '": ' + e.message);
                errors++;
                return null;
            }
        }

        // ================================================================
        // Helper: Link an indicator to a breakdown (pa_indicator_breakdowns)
        // ================================================================
        function linkIndicatorBreakdown(indicatorId, breakdownId, indicatorName, breakdownName) {
            if (!indicatorId || !breakdownId) {
                gs.warn('[Skills Hub] Skipping breakdown link - missing indicator or breakdown ID for "' + indicatorName + '" / "' + breakdownName + '"');
                return null;
            }

            try {
                var tableName = 'pa_indicator_breakdowns';
                if (!paTableExists(tableName)) {
                    gs.warn('[Skills Hub] Table "' + tableName + '" not found. Skipping indicator-breakdown link.');
                    return null;
                }

                var gr = new GlideRecord(tableName);
                gr.addQuery('indicator', indicatorId);
                gr.addQuery('breakdown', breakdownId);
                gr.query();
                if (gr.next()) {
                    gs.info('[Skills Hub] Indicator-breakdown link already exists: "' + indicatorName + '" <-> "' + breakdownName + '"');
                    skipped++;
                    return gr.getUniqueValue();
                }

                gr.initialize();
                gr.setValue('indicator', indicatorId);
                gr.setValue('breakdown', breakdownId);
                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Linked indicator "' + indicatorName + '" to breakdown "' + breakdownName + '" (' + id + ')');
                    created++;
                    return id;
                } else {
                    gs.error('[Skills Hub] FAILED to link indicator "' + indicatorName + '" to breakdown "' + breakdownName + '"');
                    errors++;
                    return null;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error linking indicator-breakdown: ' + e.message);
                errors++;
                return null;
            }
        }

        // ================================================================
        // Create Breakdowns
        // ================================================================
        gs.info('[Skills Hub] --- Creating PA Breakdowns ---');

        var bdDeptId = createBreakdown({
            name: 'Skills Hub - By Department',
            description: 'Break down Skills Hub indicators by user department',
            fact_table: 'sys_user_has_skill',
            dimension: 'user.department'
        });

        var bdLevelId = createBreakdown({
            name: 'Skills Hub - By Proficiency Level',
            description: 'Break down Skills Hub indicators by skill proficiency level',
            fact_table: 'sys_user_has_skill',
            dimension: 'skill_level'
        });

        // ================================================================
        // Indicator 1: Skills Supply
        // ================================================================
        gs.info('[Skills Hub] --- Creating PA Indicators ---');

        var indSupplyId = createIndicator({
            name: 'Skills Hub - Skills Supply',
            description: 'Count of active user skill records. Measures total skills supply across the organization.',
            type: 1,
            fact_table: 'sys_user_has_skill',
            aggregate: 'COUNT',
            conditions: 'user.active=true',
            frequency: 'daily',
            direction: 'maximize',
            active: true
        });

        // ================================================================
        // Indicator 2: Endorsement Velocity
        // ================================================================
        var indEndorsementId = createIndicator({
            name: 'Skills Hub - Endorsement Velocity',
            description: 'Count of peer endorsements. Tracks endorsement activity velocity across the organization.',
            type: 1,
            fact_table: 'u_m2m_skill_endorsement',
            aggregate: 'COUNT',
            frequency: 'daily',
            direction: 'maximize',
            active: true
        });

        // ================================================================
        // Indicator 3: Validation Rate
        // ================================================================
        var indValidationId = createIndicator({
            name: 'Skills Hub - Validation Rate',
            description: 'Count of manager-validated skills for active users. Measures validation coverage.',
            type: 1,
            fact_table: 'sys_user_has_skill',
            aggregate: 'COUNT',
            conditions: 'u_validation_status=validated^user.active=true',
            frequency: 'daily',
            direction: 'maximize',
            active: true
        });

        // ================================================================
        // Indicator 4: Skill Growth
        // ================================================================
        var indGrowthId = createIndicator({
            name: 'Skills Hub - Skill Growth',
            description: 'Count of user skill records for active users. Tracks growth of skill assignments over time.',
            type: 1,
            fact_table: 'sys_user_has_skill',
            aggregate: 'COUNT',
            conditions: 'user.active=true',
            frequency: 'daily',
            direction: 'maximize',
            active: true
        });

        // ================================================================
        // Indicator 5: Skills Demand
        // ================================================================
        var indDemandId = createIndicator({
            name: 'Skills Hub - Skills Demand',
            description: 'Count of active story-skill assignments. Measures demand for skills from project work.',
            type: 1,
            fact_table: 'u_story_skill_assignment',
            aggregate: 'COUNT',
            conditions: 'u_active=true',
            frequency: 'daily',
            direction: 'minimize',
            active: true
        });

        // ================================================================
        // Indicator 6: Capacity Utilization (Scripted)
        // ================================================================
        var capacityScript = '(function() {\n' +
            '    try {\n' +
            '        // Calculate supply: count of active user skills\n' +
            '        var supplyGA = new GlideAggregate(\'sys_user_has_skill\');\n' +
            '        supplyGA.addQuery(\'user.active\', true);\n' +
            '        supplyGA.addAggregate(\'COUNT\');\n' +
            '        supplyGA.query();\n' +
            '        var supply = 0;\n' +
            '        if (supplyGA.next()) {\n' +
            '            supply = parseInt(supplyGA.getAggregate(\'COUNT\')) || 0;\n' +
            '        }\n' +
            '        \n' +
            '        // Calculate demand: count of active story-skill assignments\n' +
            '        var demandGA = new GlideAggregate(\'u_story_skill_assignment\');\n' +
            '        demandGA.addQuery(\'u_active\', true);\n' +
            '        demandGA.addAggregate(\'COUNT\');\n' +
            '        demandGA.query();\n' +
            '        var demand = 0;\n' +
            '        if (demandGA.next()) {\n' +
            '            demand = parseInt(demandGA.getAggregate(\'COUNT\')) || 0;\n' +
            '        }\n' +
            '        \n' +
            '        // Capacity utilization = (supply / demand) * 100, capped at 100\n' +
            '        var utilization = 0;\n' +
            '        if (demand > 0) {\n' +
            '            utilization = Math.round((supply / demand) * 100);\n' +
            '        } else if (supply > 0) {\n' +
            '            utilization = 100; // Supply exists but no demand\n' +
            '        }\n' +
            '        \n' +
            '        return utilization;\n' +
            '    } catch (e) {\n' +
            '        gs.error(\'[Skills Hub] Capacity Utilization script error: \' + e.message);\n' +
            '        return 0;\n' +
            '    }\n' +
            '})();';

        var indCapacityId = createIndicator({
            name: 'Skills Hub - Capacity Utilization',
            description: 'Ratio of skills supply to demand expressed as a percentage. Supply / Demand * 100. Scripted indicator computing real-time capacity utilization.',
            type: 2,
            frequency: 'daily',
            direction: 'maximize',
            active: true,
            script: capacityScript
        });

        // ================================================================
        // Link Indicators to Breakdowns
        // ================================================================
        gs.info('[Skills Hub] --- Linking Indicators to Breakdowns ---');

        // Skills Supply - both breakdowns
        linkIndicatorBreakdown(indSupplyId, bdDeptId, 'Skills Supply', 'By Department');
        linkIndicatorBreakdown(indSupplyId, bdLevelId, 'Skills Supply', 'By Proficiency Level');

        // Endorsement Velocity - department breakdown
        linkIndicatorBreakdown(indEndorsementId, bdDeptId, 'Endorsement Velocity', 'By Department');

        // Validation Rate - both breakdowns
        linkIndicatorBreakdown(indValidationId, bdDeptId, 'Validation Rate', 'By Department');
        linkIndicatorBreakdown(indValidationId, bdLevelId, 'Validation Rate', 'By Proficiency Level');

        // Skill Growth - both breakdowns
        linkIndicatorBreakdown(indGrowthId, bdDeptId, 'Skill Growth', 'By Department');
        linkIndicatorBreakdown(indGrowthId, bdLevelId, 'Skill Growth', 'By Proficiency Level');

        // Skills Demand - department breakdown
        linkIndicatorBreakdown(indDemandId, bdDeptId, 'Skills Demand', 'By Department');

        // Capacity Utilization - department breakdown
        linkIndicatorBreakdown(indCapacityId, bdDeptId, 'Capacity Utilization', 'By Department');

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== PA INDICATORS & BREAKDOWNS SUMMARY =====');
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
        gs.info('[Skills Hub] Errors: ' + errors);
        gs.info('[Skills Hub] ===============================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 29_create_pa_indicators: ' + e.message);
    }
})();
