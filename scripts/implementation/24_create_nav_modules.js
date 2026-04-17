/**
 * Fix Script: 24_create_nav_modules.js
 * Purpose: Create application menu, navigation modules, and portal page for Skills Hub
 * Scope: Global
 * Idempotent: Yes - checks for existing records before creating
 *
 * Creates:
 *   1. Application Menu "Skills Hub" (sys_app_application)
 *   2. Navigation Modules (sys_app_module) under that menu:
 *      - My Profile   (order 100) -> /sp?id=skills_hub&tab=profile
 *      - Manager View  (order 200) -> /sp?id=skills_hub&tab=manager
 *      - Find Expert   (order 300) -> /sp?id=skills_hub&tab=expert
 *      - Leaderboard   (order 400) -> /sp?id=skills_hub&tab=leaderboard
 *   3. Service Portal Page "skills_hub" (sp_page)
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisites: None - this is self-contained
 */
(function() {
    try {
        var created = 0;
        var existed = 0;
        var errors = 0;

        gs.info('[Skills Hub] ===== STARTING 24_create_nav_modules =====');
        gs.info('[Skills Hub] Timestamp: ' + new GlideDateTime().getDisplayValue());

        // ================================================================
        // 1. Find or create the Application Menu
        // ================================================================
        var menuId = '';
        var existingMenu = new GlideRecord('sys_app_application');
        existingMenu.addQuery('title', 'Skills Hub');
        existingMenu.query();

        if (existingMenu.next()) {
            menuId = existingMenu.getUniqueValue();
            gs.info('[Skills Hub] Application menu already exists: Skills Hub (sys_id: ' + menuId + ')');
            existed++;
        } else {
            var newMenu = new GlideRecord('sys_app_application');
            newMenu.initialize();
            newMenu.setValue('title', 'Skills Hub');
            newMenu.setValue('hint', 'Manage your skills portfolio, find experts, and track team competencies');
            newMenu.setValue('category', 'Custom Applications');
            newMenu.setValue('active', true);
            newMenu.setValue('order', 1000);
            newMenu.setValue('device_type', 'browser');
            menuId = newMenu.insert();

            if (menuId) {
                gs.info('[Skills Hub] Created application menu: Skills Hub (sys_id: ' + menuId + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create application menu: Skills Hub');
                errors++;
                return;
            }
        }

        // ================================================================
        // 2. Create navigation modules (4 required)
        // ================================================================
        var modules = [
            {
                title: 'My Profile',
                order: 100,
                link_type: 'URL',
                args: '/sp?id=skills_hub&tab=profile'
            },
            {
                title: 'Manager View',
                order: 200,
                link_type: 'URL',
                args: '/sp?id=skills_hub&tab=manager'
            },
            {
                title: 'Find Expert',
                order: 300,
                link_type: 'URL',
                args: '/sp?id=skills_hub&tab=expert'
            },
            {
                title: 'Leaderboard',
                order: 400,
                link_type: 'URL',
                args: '/sp?id=skills_hub&tab=leaderboard'
            }
        ];

        for (var i = 0; i < modules.length; i++) {
            var mod = modules[i];

            var existingMod = new GlideRecord('sys_app_module');
            existingMod.addQuery('application', menuId);
            existingMod.addQuery('title', mod.title);
            existingMod.query();

            if (existingMod.next()) {
                gs.info('[Skills Hub] Module already exists: "' + mod.title + '" (sys_id: ' + existingMod.getUniqueValue() + ')');
                existed++;
            } else {
                var newMod = new GlideRecord('sys_app_module');
                newMod.initialize();
                newMod.setValue('title', mod.title);
                newMod.setValue('application', menuId);
                newMod.setValue('order', mod.order);
                newMod.setValue('link_type', mod.link_type);
                newMod.setValue('arguments', mod.args);
                newMod.setValue('active', true);
                var modId = newMod.insert();

                if (modId) {
                    gs.info('[Skills Hub] Created module: "' + mod.title + '" -> ' + mod.args + ' (sys_id: ' + modId + ')');
                    created++;
                } else {
                    gs.error('[Skills Hub] FAILED to create module: "' + mod.title + '"');
                    errors++;
                }
            }
        }

        // ================================================================
        // 3. Create Service Portal page "skills_hub"
        // ================================================================
        gs.info('[Skills Hub] --- Creating Portal Page ---');

        var existingPage = new GlideRecord('sp_page');
        existingPage.addQuery('id', 'skills_hub');
        existingPage.query();

        if (existingPage.next()) {
            gs.info('[Skills Hub] Portal page "skills_hub" already exists (sys_id: ' + existingPage.getUniqueValue() + ')');
            existed++;
        } else {
            var newPage = new GlideRecord('sp_page');
            newPage.initialize();
            newPage.setValue('id', 'skills_hub');
            newPage.setValue('title', 'Skills Hub');
            newPage.setValue('description', 'Central hub for managing skills, finding experts, and tracking team competencies');
            var pageId = newPage.insert();

            if (pageId) {
                gs.info('[Skills Hub] Created portal page: skills_hub (sys_id: ' + pageId + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create portal page');
                errors++;
            }
        }

        // ================================================================
        // Summary
        // ================================================================
        gs.info('[Skills Hub] ===== NAV MODULES SUMMARY =====');
        gs.info('[Skills Hub] Application Menu sys_id: ' + menuId);
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Already existed: ' + existed);
        gs.info('[Skills Hub] Errors: ' + errors);
        gs.info('[Skills Hub] ================================');

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in 24_create_nav_modules: ' + e.message);
    }
})();
