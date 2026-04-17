/**
 * Fix Script: 01_create_update_set.js
 * Purpose: Create and set the "Skills Hub - Phase 1 - Foundation" update set
 * Scope: Global
 * Idempotent: Yes - safe to re-run
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        var UPDATE_SET_NAME = 'Skills Hub - Phase 1 - Foundation';
        var UPDATE_SET_DESC = 'Phase 1: Data model extensions, business rules, ACLs, and roles for Skills Hub enhancements';
        var updateSetId = '';

        // Check if the update set already exists and is in progress
        var existing = new GlideRecord('sys_update_set');
        existing.addQuery('name', UPDATE_SET_NAME);
        existing.addQuery('state', 'in progress');
        existing.query();

        if (existing.next()) {
            updateSetId = existing.getUniqueValue();
            gs.info('[Skills Hub] Update set already exists: ' + UPDATE_SET_NAME + ' (sys_id: ' + updateSetId + ')');
        } else {
            // Create the update set
            var newSet = new GlideRecord('sys_update_set');
            newSet.initialize();
            newSet.setValue('name', UPDATE_SET_NAME);
            newSet.setValue('description', UPDATE_SET_DESC);
            newSet.setValue('state', 'in progress');
            newSet.setValue('application', 'global');
            updateSetId = newSet.insert();

            if (updateSetId) {
                gs.info('[Skills Hub] Created update set: ' + UPDATE_SET_NAME + ' (sys_id: ' + updateSetId + ')');
            } else {
                gs.error('[Skills Hub] FAILED to create update set: ' + UPDATE_SET_NAME);
                return;
            }
        }

        // Set as current update set for this session
        var userPref = new GlideRecord('sys_update_set');
        if (userPref.get(updateSetId)) {
            gs.getSession().putClientData('current_update_set', updateSetId);

            var currentUser = gs.getUserID();
            var pref = new GlideRecord('sys_user_preference');
            pref.addQuery('user', currentUser);
            pref.addQuery('name', 'sys_update_set');
            pref.query();

            if (pref.next()) {
                pref.setValue('value', updateSetId);
                pref.update();
                gs.info('[Skills Hub] Updated user preference to current update set: ' + updateSetId);
            } else {
                pref.initialize();
                pref.setValue('user', currentUser);
                pref.setValue('name', 'sys_update_set');
                pref.setValue('value', updateSetId);
                pref.insert();
                gs.info('[Skills Hub] Created user preference for current update set: ' + updateSetId);
            }
        }

        gs.info('[Skills Hub] ===== UPDATE SET READY =====');
        gs.info('[Skills Hub] Name: ' + UPDATE_SET_NAME);
        gs.info('[Skills Hub] sys_id: ' + updateSetId);
        gs.info('[Skills Hub] State: in progress');
        gs.info('[Skills Hub] =============================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 01_create_update_set: ' + e.message);
    }
})();
