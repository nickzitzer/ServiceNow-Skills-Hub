/**
 * Fix Script: 30_create_pa_dashboard.js
 * Purpose: Create a Performance Analytics dashboard with tabs and widgets for Skills Hub
 * Scope: Global
 * Idempotent: Yes - checks existence by name before creating any record
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 29_create_pa_indicators.js first (indicators must exist)
 *
 * Creates:
 *   1. PA Dashboard: "Skills Hub - Analytics Dashboard" (pa_dashboards)
 *   2. Dashboard Tabs (pa_m2m_dashboard_tabs or pa_dashboard_tabs):
 *      - Overview
 *      - Demand Analysis
 *      - Capacity
 *   3. Widgets (pa_widgets) linked to tabs:
 *      - Overview: Skills Supply (bar), Endorsement Velocity (line), Validation Rate (gauge)
 *      - Demand Analysis: Skills Demand (bar), Skill Growth (line)
 *      - Capacity: Capacity Utilization (gauge), Gap Analysis (list)
 *
 * NOTE: Requires Performance Analytics plugin (com.snc.pa).
 *       Script detects missing PA tables and exits gracefully with a warning.
 */
(function() {
    try {
        var created = 0;
        var skipped = 0;
        var errors = 0;

        gs.info('[Skills Hub] === Creating PA Dashboard ===');

        // ================================================================
        // Pre-flight: Check if PA tables exist
        // ================================================================
        function paTableExists(tableName) {
            var tbl = new GlideRecord('sys_db_object');
            tbl.addQuery('name', tableName);
            tbl.query();
            return tbl.hasNext();
        }

        if (!paTableExists('pa_dashboards')) {
            gs.warn('[Skills Hub] PA table "pa_dashboards" not found. The Performance Analytics plugin (com.snc.pa) may not be activated. Skipping dashboard creation.');
            gs.warn('[Skills Hub] To resolve: Activate the "Performance Analytics - Content Pack" plugin, then re-run this script.');
            return;
        }

        // Determine which tab table is available
        // Newer instances use pa_m2m_dashboard_tabs, older may use pa_dashboard_tabs
        var tabTableName = '';
        if (paTableExists('pa_m2m_dashboard_tabs')) {
            tabTableName = 'pa_m2m_dashboard_tabs';
        } else if (paTableExists('pa_dashboard_tabs')) {
            tabTableName = 'pa_dashboard_tabs';
        } else {
            gs.warn('[Skills Hub] Neither "pa_m2m_dashboard_tabs" nor "pa_dashboard_tabs" found. Cannot create dashboard tabs.');
            gs.warn('[Skills Hub] Dashboard record will be created but tabs/widgets may need manual configuration.');
        }

        var widgetTableName = '';
        if (paTableExists('pa_widgets')) {
            widgetTableName = 'pa_widgets';
        } else {
            gs.warn('[Skills Hub] PA table "pa_widgets" not found. Widgets will not be created.');
        }

        // ================================================================
        // Helper: Look up a PA indicator sys_id by name
        // ================================================================
        function getIndicatorId(indicatorName) {
            var gr = new GlideRecord('pa_indicators');
            gr.addQuery('name', indicatorName);
            gr.query();
            if (gr.next()) {
                return gr.getUniqueValue();
            }
            gs.warn('[Skills Hub] PA Indicator not found: "' + indicatorName + '" - was 29_create_pa_indicators.js run first?');
            return null;
        }

        // ================================================================
        // 1. Create the Dashboard
        // ================================================================
        gs.info('[Skills Hub] --- Creating PA Dashboard ---');

        var dashboardId = '';
        var dashGr = new GlideRecord('pa_dashboards');
        dashGr.addQuery('name', 'Skills Hub - Analytics Dashboard');
        dashGr.query();

        if (dashGr.next()) {
            dashboardId = dashGr.getUniqueValue();
            gs.info('[Skills Hub] PA Dashboard already exists: "Skills Hub - Analytics Dashboard" (' + dashboardId + ')');
            skipped++;
        } else {
            dashGr.initialize();
            dashGr.setValue('name', 'Skills Hub - Analytics Dashboard');
            dashGr.setValue('description', 'Skills Hub analytics dashboard providing visibility into skills supply, demand, endorsement activity, validation coverage, and capacity utilization across the organization.');
            dashGr.setValue('active', true);
            dashboardId = dashGr.insert();

            if (dashboardId) {
                gs.info('[Skills Hub] Created PA Dashboard: "Skills Hub - Analytics Dashboard" (' + dashboardId + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create PA Dashboard: "Skills Hub - Analytics Dashboard"');
                errors++;
            }
        }

        if (!dashboardId) {
            gs.error('[Skills Hub] Cannot proceed without dashboard. Aborting tab and widget creation.');
            return;
        }

        // ================================================================
        // 2. Create Dashboard Tabs
        // ================================================================
        var tabIds = {};

        function createTab(tabName, tabOrder) {
            if (!tabTableName) {
                gs.warn('[Skills Hub] No tab table available. Skipping tab: "' + tabName + '"');
                return null;
            }

            try {
                var gr = new GlideRecord(tabTableName);
                gr.addQuery('dashboard', dashboardId);
                gr.addQuery('tab_title', tabName);
                gr.query();

                if (gr.next()) {
                    gs.info('[Skills Hub] Dashboard tab already exists: "' + tabName + '" (' + gr.getUniqueValue() + ')');
                    skipped++;
                    return gr.getUniqueValue();
                }

                gr.initialize();
                gr.setValue('dashboard', dashboardId);
                gr.setValue('tab_title', tabName);
                gr.setValue('order', tabOrder);
                gr.setValue('active', true);
                var id = gr.insert();

                if (id) {
                    gs.info('[Skills Hub] Created dashboard tab: "' + tabName + '" (' + id + ')');
                    created++;
                    return id;
                } else {
                    gs.error('[Skills Hub] FAILED to create dashboard tab: "' + tabName + '"');
                    errors++;
                    return null;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error creating tab "' + tabName + '": ' + e.message);
                errors++;
                return null;
            }
        }

        gs.info('[Skills Hub] --- Creating Dashboard Tabs ---');

        tabIds.overview = createTab('Overview', 100);
        tabIds.demand = createTab('Demand Analysis', 200);
        tabIds.capacity = createTab('Capacity', 300);

        // ================================================================
        // 3. Create Widgets
        // ================================================================
        function createWidget(config) {
            if (!widgetTableName) {
                gs.warn('[Skills Hub] No widget table available. Skipping widget: "' + config.name + '"');
                return null;
            }

            try {
                var gr = new GlideRecord(widgetTableName);
                gr.addQuery('name', config.name);
                gr.query();

                if (gr.next()) {
                    gs.info('[Skills Hub] PA Widget already exists: "' + config.name + '" (' + gr.getUniqueValue() + ')');
                    skipped++;
                    return gr.getUniqueValue();
                }

                gr.initialize();
                gr.setValue('name', config.name);

                if (config.indicator) {
                    gr.setValue('indicator', config.indicator);
                }

                if (config.visualization) {
                    gr.setValue('visualization', config.visualization);
                }

                if (config.type) {
                    gr.setValue('type', config.type);
                }

                if (config.tab) {
                    gr.setValue('tab', config.tab);
                }

                if (config.order !== undefined) {
                    gr.setValue('order', config.order);
                }

                if (config.active !== undefined) {
                    gr.setValue('active', config.active);
                } else {
                    gr.setValue('active', true);
                }

                if (config.description) {
                    gr.setValue('description', config.description);
                }

                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Created PA Widget: "' + config.name + '" (' + id + ')');
                    created++;
                    return id;
                } else {
                    gs.error('[Skills Hub] FAILED to create PA Widget: "' + config.name + '"');
                    errors++;
                    return null;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error creating widget "' + config.name + '": ' + e.message);
                errors++;
                return null;
            }
        }

        // Look up all indicator sys_ids
        gs.info('[Skills Hub] --- Looking up PA Indicator sys_ids ---');

        var indSupplyId = getIndicatorId('Skills Hub - Skills Supply');
        var indEndorsementId = getIndicatorId('Skills Hub - Endorsement Velocity');
        var indValidationId = getIndicatorId('Skills Hub - Validation Rate');
        var indGrowthId = getIndicatorId('Skills Hub - Skill Growth');
        var indDemandId = getIndicatorId('Skills Hub - Skills Demand');
        var indCapacityId = getIndicatorId('Skills Hub - Capacity Utilization');

        gs.info('[Skills Hub] --- Creating Dashboard Widgets ---');

        // -- Overview Tab Widgets --
        createWidget({
            name: 'Skills Hub - Skills Supply Overview',
            indicator: indSupplyId,
            visualization: 'bar',
            tab: tabIds.overview,
            order: 100,
            description: 'Bar chart showing total skills supply (count of active user skill records)'
        });

        createWidget({
            name: 'Skills Hub - Endorsement Velocity Overview',
            indicator: indEndorsementId,
            visualization: 'line',
            tab: tabIds.overview,
            order: 200,
            description: 'Line chart tracking endorsement activity velocity over time'
        });

        createWidget({
            name: 'Skills Hub - Validation Rate Overview',
            indicator: indValidationId,
            visualization: 'gauge',
            tab: tabIds.overview,
            order: 300,
            description: 'Gauge showing percentage of skills validated by managers'
        });

        // -- Demand Analysis Tab Widgets --
        createWidget({
            name: 'Skills Hub - Skills Demand Chart',
            indicator: indDemandId,
            visualization: 'bar',
            tab: tabIds.demand,
            order: 100,
            description: 'Bar chart showing skills demand from story-skill assignments'
        });

        createWidget({
            name: 'Skills Hub - Skill Growth Trend',
            indicator: indGrowthId,
            visualization: 'line',
            tab: tabIds.demand,
            order: 200,
            description: 'Line chart tracking new skill assignments over time'
        });

        // -- Capacity Tab Widgets --
        createWidget({
            name: 'Skills Hub - Capacity Utilization Gauge',
            indicator: indCapacityId,
            visualization: 'gauge',
            tab: tabIds.capacity,
            order: 100,
            description: 'Gauge showing overall capacity utilization ratio (supply / demand)'
        });

        createWidget({
            name: 'Skills Hub - Gap Analysis',
            indicator: indDemandId,
            visualization: 'list',
            tab: tabIds.capacity,
            order: 200,
            description: 'Table/list view showing skills where demand exceeds supply, ranked by gap severity'
        });

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== PA DASHBOARD CREATION SUMMARY =====');
        gs.info('[Skills Hub] Dashboard: Skills Hub - Analytics Dashboard (' + dashboardId + ')');
        gs.info('[Skills Hub] Tab table used: ' + (tabTableName || 'NONE'));
        gs.info('[Skills Hub] Widget table used: ' + (widgetTableName || 'NONE'));
        gs.info('[Skills Hub] Tabs: Overview (' + (tabIds.overview || 'N/A') + '), Demand Analysis (' + (tabIds.demand || 'N/A') + '), Capacity (' + (tabIds.capacity || 'N/A') + ')');
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
        gs.info('[Skills Hub] Errors: ' + errors);
        gs.info('[Skills Hub] ============================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 30_create_pa_dashboard: ' + e.message);
    }
})();
