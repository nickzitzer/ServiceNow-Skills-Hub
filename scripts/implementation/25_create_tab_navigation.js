/**
 * Fix Script: 25_create_tab_navigation.js
 * Purpose: Create the "Skills Hub - Tab Navigation" widget with role-based tab visibility
 * Scope: Global
 * Idempotent: Yes - checks if widget already exists by ID before creating
 *
 * Creates sp_widget record:
 *   ID: skills-hub-tabs
 *   Name: Skills Hub - Tab Navigation
 *
 * Features:
 *   - Server script: determines tabs based on user role (managers see "Manager View")
 *   - Client script: handles tab click, broadcasts event for content widgets
 *   - Template: horizontal tab bar with icons (fa-user, fa-users-cog, fa-search, fa-trophy)
 *   - CSS: tab styling matching ServiceNow portal, active indicator, responsive
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: None - self-contained widget creation
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 25_create_tab_navigation =====');
        gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());

        var WIDGET_ID = 'skills-hub-tabs';
        var WIDGET_NAME = 'Skills Hub - Tab Navigation';

        // ================================================================
        // 1. Idempotency check
        // ================================================================
        var existing = new GlideRecord('sp_widget');
        existing.addQuery('id', WIDGET_ID);
        existing.query();

        if (existing.next()) {
            gs.info('[Skills Hub] Tab navigation widget already exists (sys_id: ' + existing.getUniqueValue() + ') - skipping creation');
            gs.info('[Skills Hub] To recreate, delete the existing widget first.');
            return;
        }

        // Also check by name
        var existingByName = new GlideRecord('sp_widget');
        existingByName.addQuery('name', WIDGET_NAME);
        existingByName.query();

        if (existingByName.next()) {
            gs.info('[Skills Hub] Tab navigation widget already exists by name (sys_id: ' + existingByName.getUniqueValue() + ') - skipping creation');
            return;
        }

        // ================================================================
        // 2. Build Server Script
        //    Determines which tabs to show based on user role.
        //    Managers see "Manager View"; everyone sees Profile/Find Expert/Leaderboard.
        // ================================================================
        var serverScript = ''
            + '(function() {\n'
            + '    var userId = gs.getUserID();\n'
            + '\n'
            + '    // Check if user is a manager (has direct reports)\n'
            + '    var isManager = false;\n'
            + '    var reportGR = new GlideRecord("sys_user");\n'
            + '    reportGR.addQuery("manager", userId);\n'
            + '    reportGR.addQuery("active", true);\n'
            + '    reportGR.setLimit(1);\n'
            + '    reportGR.query();\n'
            + '    if (reportGR.hasNext()) {\n'
            + '        isManager = true;\n'
            + '    }\n'
            + '\n'
            + '    // Build tab list\n'
            + '    data.tabs = [];\n'
            + '    data.tabs.push({ id: "profile", label: "My Profile", icon: "fa-user" });\n'
            + '\n'
            + '    if (isManager) {\n'
            + '        data.tabs.push({ id: "manager", label: "Manager View", icon: "fa-users-cog" });\n'
            + '    }\n'
            + '\n'
            + '    data.tabs.push({ id: "expert", label: "Find Expert", icon: "fa-search" });\n'
            + '    data.tabs.push({ id: "leaderboard", label: "Leaderboard", icon: "fa-trophy" });\n'
            + '\n'
            + '    // Read tab from URL parameter\n'
            + '    var urlTab = $sp.getParameter("tab") || "profile";\n'
            + '    data.activeTab = urlTab;\n'
            + '\n'
            + '    // Mark correct tab active (validate that the tab exists for this user)\n'
            + '    var validTab = false;\n'
            + '    for (var i = 0; i < data.tabs.length; i++) {\n'
            + '        if (data.tabs[i].id == urlTab) {\n'
            + '            data.tabs[i].active = true;\n'
            + '            validTab = true;\n'
            + '        } else {\n'
            + '            data.tabs[i].active = false;\n'
            + '        }\n'
            + '    }\n'
            + '\n'
            + '    // Fallback to profile if requested tab is not available\n'
            + '    if (!validTab && data.tabs.length > 0) {\n'
            + '        data.tabs[0].active = true;\n'
            + '        data.activeTab = data.tabs[0].id;\n'
            + '    }\n'
            + '\n'
            + '    data.isManager = isManager;\n'
            + '})();\n';

        // ================================================================
        // 3. Build Client Script
        //    Handles tab click and broadcasts event to load appropriate content.
        // ================================================================
        var clientScript = ''
            + 'function($rootScope) {\n'
            + '    /* jshint esversion: 5 */\n'
            + '    var c = this;\n'
            + '\n'
            + '    c.switchTab = function(tabId) {\n'
            + '        for (var i = 0; i < c.data.tabs.length; i++) {\n'
            + '            c.data.tabs[i].active = (c.data.tabs[i].id === tabId);\n'
            + '        }\n'
            + '        c.data.activeTab = tabId;\n'
            + '\n'
            + '        // Update URL without page reload\n'
            + '        var url = \'?id=skills_hub&tab=\' + tabId;\n'
            + '        window.history.replaceState({}, \'\', url);\n'
            + '\n'
            + '        // Broadcast tab change event for content widgets\n'
            + '        $rootScope.$broadcast(\'skills-hub-tab-change\', tabId);\n'
            + '    };\n'
            + '}\n';

        // ================================================================
        // 4. Build Template
        //    Horizontal tab bar with icons.
        // ================================================================
        var template = ''
            + '<div class="skills-hub-tabs">\n'
            + '    <div class="tab-header">\n'
            + '        <h2 class="page-title">\n'
            + '            <i class="fa fa-cubes"></i> Skills Hub\n'
            + '        </h2>\n'
            + '    </div>\n'
            + '    <ul class="nav nav-tabs skills-tabs">\n'
            + '        <li ng-repeat="tab in c.data.tabs" ng-class="{active: tab.active}">\n'
            + '            <a href="javascript:void(0)" ng-click="c.switchTab(tab.id)">\n'
            + '                <i class="fa" ng-class="tab.icon"></i>\n'
            + '                <span class="tab-label">{{tab.label}}</span>\n'
            + '            </a>\n'
            + '        </li>\n'
            + '    </ul>\n'
            + '</div>\n';

        // ================================================================
        // 5. Build CSS
        //    Tab styling matching ServiceNow portal design patterns,
        //    active tab indicator, and responsive layout.
        // ================================================================
        var css = ''
            + '/* Skills Hub - Tab Navigation */\n'
            + '\n'
            + '.skills-hub-tabs {\n'
            + '    margin-bottom: 0;\n'
            + '    padding: 20px 20px 0 20px;\n'
            + '    background-color: #fff;\n'
            + '}\n'
            + '\n'
            + '/* Page Title */\n'
            + '.skills-hub-tabs .page-title {\n'
            + '    font-size: 28px;\n'
            + '    font-weight: 600;\n'
            + '    color: #333;\n'
            + '    margin: 0 0 20px 0;\n'
            + '    padding: 0;\n'
            + '}\n'
            + '\n'
            + '.skills-hub-tabs .page-title i {\n'
            + '    color: #0072CE;\n'
            + '    margin-right: 8px;\n'
            + '}\n'
            + '\n'
            + '/* Tab Bar */\n'
            + '.skills-hub-tabs .skills-tabs {\n'
            + '    border-bottom: 2px solid #0072CE;\n'
            + '    margin-bottom: 0;\n'
            + '}\n'
            + '\n'
            + '.skills-hub-tabs .skills-tabs > li {\n'
            + '    margin-bottom: -2px;\n'
            + '}\n'
            + '\n'
            + '.skills-hub-tabs .skills-tabs > li > a {\n'
            + '    color: #555;\n'
            + '    font-size: 14px;\n'
            + '    font-weight: 500;\n'
            + '    padding: 10px 20px;\n'
            + '    border: 2px solid transparent;\n'
            + '    border-bottom: none;\n'
            + '    border-radius: 4px 4px 0 0;\n'
            + '    background-color: transparent;\n'
            + '    transition: color 0.2s, background-color 0.2s, border-color 0.2s;\n'
            + '}\n'
            + '\n'
            + '.skills-hub-tabs .skills-tabs > li > a:hover,\n'
            + '.skills-hub-tabs .skills-tabs > li > a:focus {\n'
            + '    color: #0072CE;\n'
            + '    background-color: #f0f7ff;\n'
            + '    border-color: #ddd #ddd transparent;\n'
            + '}\n'
            + '\n'
            + '.skills-hub-tabs .skills-tabs > li > a i {\n'
            + '    margin-right: 6px;\n'
            + '    font-size: 13px;\n'
            + '}\n'
            + '\n'
            + '/* Active Tab Indicator */\n'
            + '.skills-hub-tabs .skills-tabs > li.active > a,\n'
            + '.skills-hub-tabs .skills-tabs > li.active > a:hover,\n'
            + '.skills-hub-tabs .skills-tabs > li.active > a:focus {\n'
            + '    color: #0072CE;\n'
            + '    font-weight: 600;\n'
            + '    background-color: #fff;\n'
            + '    border: 2px solid #0072CE;\n'
            + '    border-bottom-color: #fff;\n'
            + '    cursor: default;\n'
            + '}\n'
            + '\n'
            + '/* Responsive - Tablet */\n'
            + '@media (max-width: 767px) {\n'
            + '    .skills-hub-tabs .page-title {\n'
            + '        font-size: 22px;\n'
            + '        margin-bottom: 15px;\n'
            + '    }\n'
            + '\n'
            + '    .skills-hub-tabs .skills-tabs > li > a {\n'
            + '        font-size: 12px;\n'
            + '        padding: 8px 12px;\n'
            + '    }\n'
            + '\n'
            + '    .skills-hub-tabs .skills-tabs > li > a i {\n'
            + '        display: block;\n'
            + '        text-align: center;\n'
            + '        margin-right: 0;\n'
            + '        margin-bottom: 4px;\n'
            + '        font-size: 16px;\n'
            + '    }\n'
            + '}\n'
            + '\n'
            + '/* Responsive - Mobile */\n'
            + '@media (max-width: 480px) {\n'
            + '    .skills-hub-tabs .skills-tabs {\n'
            + '        display: flex;\n'
            + '        flex-wrap: nowrap;\n'
            + '        overflow-x: auto;\n'
            + '        -webkit-overflow-scrolling: touch;\n'
            + '    }\n'
            + '\n'
            + '    .skills-hub-tabs .skills-tabs > li {\n'
            + '        flex-shrink: 0;\n'
            + '    }\n'
            + '\n'
            + '    .skills-hub-tabs .skills-tabs > li > a .tab-label {\n'
            + '        display: none;\n'
            + '    }\n'
            + '\n'
            + '    .skills-hub-tabs .skills-tabs > li > a i {\n'
            + '        font-size: 18px;\n'
            + '        margin-right: 0;\n'
            + '    }\n'
            + '}\n';

        // ================================================================
        // 6. Create the widget record
        // ================================================================
        var newWidget = new GlideRecord('sp_widget');
        newWidget.initialize();
        newWidget.setValue('id', WIDGET_ID);
        newWidget.setValue('name', WIDGET_NAME);
        newWidget.setValue('script', serverScript);
        newWidget.setValue('client_script', clientScript);
        newWidget.setValue('template', template);
        newWidget.setValue('css', css);
        newWidget.setValue('internal', false);
        newWidget.setValue('data_table', '');
        var widgetSysId = newWidget.insert();

        if (widgetSysId) {
            gs.info('[Skills Hub] Created tab navigation widget: ' + WIDGET_NAME + ' (sys_id: ' + widgetSysId + ')');
            gs.info('[Skills Hub] Widget ID: ' + WIDGET_ID);
        } else {
            gs.error('[Skills Hub] FAILED to create tab navigation widget');
        }

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== SCRIPT 25 SUMMARY =====');
        gs.info('[Skills Hub] Widget sys_id: ' + (widgetSysId || 'FAILED'));
        gs.info('[Skills Hub] Features:');
        gs.info('[Skills Hub]   - Role-based Manager View tab (only for users with direct reports)');
        gs.info('[Skills Hub]   - Tab icons: fa-user, fa-users-cog, fa-search, fa-trophy');
        gs.info('[Skills Hub]   - $rootScope broadcast on tab change');
        gs.info('[Skills Hub]   - Responsive CSS with mobile scroll');
        gs.info('[Skills Hub] =============================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 25_create_tab_navigation: ' + e.message);
    }
})();
