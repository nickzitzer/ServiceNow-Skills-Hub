// 05_create_roles.js
// Skills Hub - Create Roles (skill_admin, skill_manager)
// Idempotent: checks for existing records before creating
// Run via: SN-Execute-Background-Script or Background Scripts UI

(function() {
    try {
        gs.info('[Skills Hub] Starting role creation...');

        // ============================================================
        // 1. skill_admin
        // ============================================================
        var skillAdminId = '';
        var grAdmin = new GlideRecord('sys_user_role');
        grAdmin.addQuery('name', 'skill_admin');
        grAdmin.query();
        if (grAdmin.next()) {
            skillAdminId = grAdmin.sys_id.toString();
            gs.info('[Skills Hub] Role "skill_admin" already exists (' + skillAdminId + ')');
        } else {
            grAdmin.initialize();
            grAdmin.name = 'skill_admin';
            grAdmin.description = 'Can approve skill requests and manage skill configuration';
            grAdmin.elevated_privilege = false;
            skillAdminId = grAdmin.insert();
            gs.info('[Skills Hub] Created role "skill_admin" (' + skillAdminId + ')');
        }

        // ============================================================
        // 2. skill_manager
        // ============================================================
        var skillManagerId = '';
        var grManager = new GlideRecord('sys_user_role');
        grManager.addQuery('name', 'skill_manager');
        grManager.query();
        if (grManager.next()) {
            skillManagerId = grManager.sys_id.toString();
            gs.info('[Skills Hub] Role "skill_manager" already exists (' + skillManagerId + ')');
        } else {
            grManager.initialize();
            grManager.name = 'skill_manager';
            grManager.description = 'Can validate and assess direct reports\' skills';
            grManager.elevated_privilege = false;
            skillManagerId = grManager.insert();
            gs.info('[Skills Hub] Created role "skill_manager" (' + skillManagerId + ')');
        }

        // ============================================================
        // 3. skill_manager contains skill_user
        // ============================================================
        var grSkillUser = new GlideRecord('sys_user_role');
        grSkillUser.addQuery('name', 'skill_user');
        grSkillUser.query();

        if (!grSkillUser.next()) {
            gs.error('[Skills Hub] skill_user role not found by name. Skipping role-contains relationship.');
        } else {
            var skillUserSysId = grSkillUser.getUniqueValue();
            // Check if the contains relationship already exists
            var grContains = new GlideRecord('sys_user_role_contains');
            grContains.addQuery('role', skillManagerId);
            grContains.addQuery('contains', skillUserSysId);
            grContains.query();
            if (grContains.next()) {
                gs.info('[Skills Hub] Role-contains relationship (skill_manager -> skill_user) already exists (' + grContains.sys_id.toString() + ')');
            } else {
                grContains.initialize();
                grContains.role = skillManagerId;
                grContains.contains = skillUserSysId;
                var containsId = grContains.insert();
                gs.info('[Skills Hub] Created role-contains relationship (skill_manager -> skill_user) (' + containsId + ')');
            }
        }

        gs.info('[Skills Hub] Role creation complete.');
    } catch (e) {
        gs.error('[Skills Hub] Role creation failed: ' + e.message);
    }
})();
