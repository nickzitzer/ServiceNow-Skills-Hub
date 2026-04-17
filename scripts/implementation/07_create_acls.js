/**
 * 07_create_acls.js
 * Creates ACLs for Skills Hub tables.
 * Idempotent: checks for existing records before creating.
 * Target: sys_security_acl table, sys_security_acl_role table
 */
(function() {
    try {
        var created = 0;
        var skipped = 0;
        var errors = 0;

        gs.info('[Skills Hub] === Creating ACLs ===');

        /**
         * Creates an ACL if it does not already exist.
         * @param {object} config - ACL configuration
         * @param {string} config.name - ACL name (table or table.field)
         * @param {string} config.operation - Operation (read/write/create/delete)
         * @param {boolean} [config.admin_overrides] - Admin overrides flag (default true)
         * @param {boolean} [config.advanced] - Advanced script flag (default false)
         * @param {string} [config.script] - Advanced script body
         * @param {string} [config.description] - ACL description
         * @param {string} [config.type] - ACL type (default 'record')
         * @returns {string|null} sys_id of created/existing record
         */
        function createACL(config) {
            try {
                var gr = new GlideRecord('sys_security_acl');
                gr.addQuery('name', config.name);
                gr.addQuery('operation', config.operation);
                gr.query();
                if (gr.next()) {
                    gs.info('[Skills Hub] ACL exists: ' + config.name + ' (' + config.operation + ') (' + gr.sys_id.toString() + ')');
                    skipped++;
                    return gr.sys_id.toString();
                }
                gr.initialize();
                gr.name = config.name;
                gr.operation = config.operation;
                gr.admin_overrides = (config.admin_overrides !== undefined) ? config.admin_overrides : true;
                gr.active = true;
                gr.type = config.type || 'record';
                gr.advanced = config.advanced || false;
                if (config.script) {
                    gr.script = config.script;
                }
                if (config.description) {
                    gr.description = config.description;
                }
                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Created ACL: ' + config.name + ' (' + config.operation + ') (' + id + ')');
                    created++;
                    return id;
                } else {
                    gs.error('[Skills Hub] Failed to create ACL: ' + config.name + ' (' + config.operation + ')');
                    errors++;
                    return null;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error creating ACL ' + config.name + ' (' + config.operation + '): ' + e.message);
                errors++;
                return null;
            }
        }

        /**
         * Adds a role to an ACL if the mapping does not already exist.
         * @param {string} aclId - sys_id of the ACL
         * @param {string} roleName - Name of the role to add
         */
        function addACLRole(aclId, roleName) {
            try {
                if (!aclId) {
                    gs.error('[Skills Hub] Cannot add role "' + roleName + '": ACL sys_id is null');
                    return;
                }
                // Look up role sys_id
                var role = new GlideRecord('sys_user_role');
                role.addQuery('name', roleName);
                role.query();
                if (!role.next()) {
                    gs.error('[Skills Hub] Role not found: ' + roleName);
                    errors++;
                    return;
                }

                var gr = new GlideRecord('sys_security_acl_role');
                gr.addQuery('sys_security_acl', aclId);
                gr.addQuery('sys_user_role', role.sys_id);
                gr.query();
                if (gr.hasNext()) {
                    gs.info('[Skills Hub] ACL role exists: ' + roleName + ' on ACL ' + aclId);
                    return;
                }
                gr.initialize();
                gr.sys_security_acl = aclId;
                gr.sys_user_role = role.sys_id;
                var id = gr.insert();
                if (id) {
                    gs.info('[Skills Hub] Added role "' + roleName + '" to ACL (' + id + ')');
                } else {
                    gs.error('[Skills Hub] Failed to add role "' + roleName + '" to ACL ' + aclId);
                    errors++;
                }
            } catch (e) {
                gs.error('[Skills Hub] Error adding role "' + roleName + '" to ACL: ' + e.message);
                errors++;
            }
        }

        // ============================================================
        // 1. u_m2m_skill_endorsement - read (skill_user)
        // ============================================================
        var aclEndorsementRead = createACL({
            name: 'u_m2m_skill_endorsement',
            operation: 'read',
            admin_overrides: true,
            advanced: false,
            description: 'Endorsement read: skill_user'
        });
        addACLRole(aclEndorsementRead, 'skill_user');

        // ============================================================
        // 2. u_m2m_skill_endorsement - create (skill_user, endorser must be current user)
        // ============================================================
        var aclEndorsementCreate = createACL({
            name: 'u_m2m_skill_endorsement',
            operation: 'create',
            admin_overrides: true,
            advanced: true,
            script: 'answer = current.u_endorser == gs.getUserID() || gs.hasRole(\'admin\');',
            description: 'Endorsement create: skill_user, endorser must be current user'
        });
        addACLRole(aclEndorsementCreate, 'skill_user');

        // ============================================================
        // 3. u_m2m_skill_endorsement - write (skill_user)
        // ============================================================
        var aclEndorsementWrite = createACL({
            name: 'u_m2m_skill_endorsement',
            operation: 'write',
            admin_overrides: true,
            advanced: false,
            description: 'Endorsement write: skill_user'
        });
        addACLRole(aclEndorsementWrite, 'skill_user');

        // ============================================================
        // 4. u_m2m_skill_endorsement - delete (skill_user, endorser must be current user or admin)
        // ============================================================
        var aclEndorsementDelete = createACL({
            name: 'u_m2m_skill_endorsement',
            operation: 'delete',
            admin_overrides: true,
            advanced: true,
            script: 'answer = current.u_endorser == gs.getUserID() || gs.hasRole(\'admin\');',
            description: 'Endorsement delete: endorser must be current user or admin'
        });
        addACLRole(aclEndorsementDelete, 'skill_user');

        // ============================================================
        // 5. sys_user_has_skill.u_manager_assessed_level - write (manager only)
        // ============================================================
        createACL({
            name: 'sys_user_has_skill.u_manager_assessed_level',
            operation: 'write',
            type: 'record',
            admin_overrides: true,
            advanced: true,
            script: 'answer = current.user.manager == gs.getUserID() || gs.hasRole(\'admin\');',
            description: 'Manager assessed level: only manager or admin'
        });

        // ============================================================
        // 6. sys_user_has_skill.u_validation_status - write (manager only)
        // ============================================================
        createACL({
            name: 'sys_user_has_skill.u_validation_status',
            operation: 'write',
            type: 'record',
            admin_overrides: true,
            advanced: true,
            script: 'answer = current.user.manager == gs.getUserID() || gs.hasRole(\'admin\');',
            description: 'Validation status: only manager or admin'
        });

        // ============================================================
        // 7. sys_user_has_skill.u_validation_notes - write (manager only)
        // ============================================================
        createACL({
            name: 'sys_user_has_skill.u_validation_notes',
            operation: 'write',
            type: 'record',
            admin_overrides: true,
            advanced: true,
            script: 'answer = current.user.manager == gs.getUserID() || gs.hasRole(\'admin\');',
            description: 'Validation notes: only manager or admin'
        });

        // ============================================================
        // 8. u_skill_request - create (skill_user)
        // ============================================================
        var aclSkillRequestCreate = createACL({
            name: 'u_skill_request',
            operation: 'create',
            admin_overrides: true,
            advanced: false,
            description: 'Skill request create: any authenticated skill_user'
        });
        addACLRole(aclSkillRequestCreate, 'skill_user');

        // ============================================================
        // 9. u_skill_request - read (skill_user)
        // ============================================================
        var aclSkillRequestRead = createACL({
            name: 'u_skill_request',
            operation: 'read',
            admin_overrides: true,
            advanced: false,
            description: 'Skill request read: skill_user'
        });
        addACLRole(aclSkillRequestRead, 'skill_user');

        // ============================================================
        // 10. u_skill_request - write (skill_admin)
        // ============================================================
        var aclSkillRequestWrite = createACL({
            name: 'u_skill_request',
            operation: 'write',
            admin_overrides: true,
            advanced: false,
            description: 'Skill request write: skill_admin only'
        });
        addACLRole(aclSkillRequestWrite, 'skill_admin');

        // ============================================================
        // 11. u_skill_request - delete (admin)
        // ============================================================
        var aclSkillRequestDelete = createACL({
            name: 'u_skill_request',
            operation: 'delete',
            admin_overrides: true,
            advanced: false,
            description: 'Skill request delete: admin only'
        });
        addACLRole(aclSkillRequestDelete, 'admin');

        // ============================================================
        // 12. u_skill_profile_requirement - read (skill_user)
        // ============================================================
        var aclProfileReqRead = createACL({
            name: 'u_skill_profile_requirement',
            operation: 'read',
            admin_overrides: true,
            advanced: false,
            description: 'Profile requirement read: skill_user'
        });
        addACLRole(aclProfileReqRead, 'skill_user');

        // ============================================================
        // 13. u_skill_profile_requirement - create (admin)
        // ============================================================
        var aclProfileReqCreate = createACL({
            name: 'u_skill_profile_requirement',
            operation: 'create',
            admin_overrides: true,
            advanced: false,
            description: 'Profile requirement create: admin only'
        });
        addACLRole(aclProfileReqCreate, 'admin');

        // ============================================================
        // 14. u_skill_profile_requirement - write (admin)
        // ============================================================
        var aclProfileReqWrite = createACL({
            name: 'u_skill_profile_requirement',
            operation: 'write',
            admin_overrides: true,
            advanced: false,
            description: 'Profile requirement write: admin only'
        });
        addACLRole(aclProfileReqWrite, 'admin');

        // ============================================================
        // 15. u_skill_profile_requirement - delete (admin)
        // ============================================================
        var aclProfileReqDelete = createACL({
            name: 'u_skill_profile_requirement',
            operation: 'delete',
            admin_overrides: true,
            advanced: false,
            description: 'Profile requirement delete: admin only'
        });
        addACLRole(aclProfileReqDelete, 'admin');

        // ---------------------------------------------------------------
        // Summary
        // ---------------------------------------------------------------
        var total = created + skipped + errors;
        gs.info('[Skills Hub] === ACL Creation Complete ===');
        gs.info('[Skills Hub] Total processed: ' + total);
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Skipped (already existed): ' + skipped);
        gs.info('[Skills Hub] Errors: ' + errors);

    } catch (e) {
        gs.error('[Skills Hub] Fatal error in ACL creation script: ' + e.message);
    }
})();
