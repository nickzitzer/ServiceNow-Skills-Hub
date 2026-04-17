/**
 * Fix Script: 13_create_notifications.js
 * Purpose: Create email notification records for Skills Hub events
 * Scope: Global
 * Idempotent: Yes - safe to re-run (checks existence by name before creating)
 *
 * Creates:
 *   1. "Skills Hub - Skill Request Submitted" - on u_skill_request insert (status=pending)
 *   2. "Skills Hub - Skill Request Approved" - on u_skill_request update (status changes to approved)
 *   3. "Skills Hub - Skill Request Rejected" - on u_skill_request update (status changes to rejected)
 *   4. "Skills Hub - Skill Validated by Manager" - on sys_user_has_skill update (validation_status changes to validated)
 *   5. "Skills Hub - Skill Disputed by Manager" - on sys_user_has_skill update (validation_status changes to disputed)
 *   6. "Skills Hub - Skill Endorsed" - on u_m2m_skill_endorsement insert
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 10_create_update_set_phase2.js first
 */
(function() {
    try {
        var created = 0;
        var existed = 0;
        var errors = 0;

        // ================================================================
        // Helper: Create or skip an email notification (by name)
        // ================================================================
        function createNotification(config) {
            var gr = new GlideRecord('sysevent_email_action');
            gr.addQuery('name', config.name);
            gr.query();

            if (gr.next()) {
                gs.info('[Skills Hub] Notification already exists: "' + config.name + '" (sys_id: ' + gr.getUniqueValue() + ')');
                existed++;
                return gr.getUniqueValue();
            }

            gr.initialize();
            gr.setValue('name', config.name);
            gr.setValue('collection', config.collection);
            gr.setValue('action_insert', config.action_insert || false);
            gr.setValue('action_update', config.action_update || false);
            gr.setValue('action_delete', false);
            gr.setValue('active', true);

            if (config.condition) {
                gr.setValue('condition', config.condition);
            }
            if (config.recipient_fields) {
                gr.setValue('recipient_fields', config.recipient_fields);
            }

            gr.setValue('subject', config.subject);
            gr.setValue('message_html', config.message_html);

            // Content type for HTML email
            gr.setValue('content_type', 'text/html');

            var id = gr.insert();
            if (id) {
                gs.info('[Skills Hub] Created notification: "' + config.name + '" (sys_id: ' + id + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create notification: "' + config.name + '"');
                errors++;
            }
            return id;
        }

        // ============================================================
        // 1. Skills Hub - Skill Request Submitted
        //    Fires on insert of u_skill_request when status = pending
        //    Sends to the requester confirming submission
        // ============================================================
        createNotification({
            name: 'Skills Hub - Skill Request Submitted',
            collection: 'u_skill_request',
            action_insert: true,
            action_update: false,
            condition: 'u_status=pending',
            recipient_fields: 'u_requested_by',
            subject: 'Skills Hub: Your Skill Request Has Been Submitted',
            message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                '</div>' +
                '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                '<h2 style="color: #333333; margin-top: 0;">Skill Request Submitted</h2>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Your request to add a new skill has been submitted and is awaiting review by a Skills Administrator.</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill Name</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Category</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_category.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Justification</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_justification}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #e68a00; font-weight: bold;">Pending Review</span></td></tr>' +
                '</table>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'You will be notified when your request has been reviewed.</p>' +
                '</div>' +
                '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                '</div></div>'
        });

        // ============================================================
        // 2. Skills Hub - Skill Request Approved
        //    Fires on update of u_skill_request when status changes to approved
        //    Sends to the requester confirming approval
        // ============================================================
        createNotification({
            name: 'Skills Hub - Skill Request Approved',
            collection: 'u_skill_request',
            action_insert: false,
            action_update: true,
            condition: 'u_statusCHANGESTOapproved',
            recipient_fields: 'u_requested_by',
            subject: 'Skills Hub: Your Skill Request Has Been Approved',
            message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                '</div>' +
                '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                '<h2 style="color: #2e7d32; margin-top: 0;">Skill Request Approved</h2>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Congratulations! Your request to add a new skill has been approved. The skill is now available in the Skills Hub catalog.</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill Name</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Category</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_category.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Approved By</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approved_by.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Approval Date</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approval_date}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #2e7d32; font-weight: bold;">Approved</span></td></tr>' +
                '</table>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'You can now add this skill to your profile through the Skills Hub.</p>' +
                '</div>' +
                '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                '</div></div>'
        });

        // ============================================================
        // 3. Skills Hub - Skill Request Rejected
        //    Fires on update of u_skill_request when status changes to rejected
        //    Sends to the requester informing of rejection
        // ============================================================
        createNotification({
            name: 'Skills Hub - Skill Request Rejected',
            collection: 'u_skill_request',
            action_insert: false,
            action_update: true,
            condition: 'u_statusCHANGESTOrejected',
            recipient_fields: 'u_requested_by',
            subject: 'Skills Hub: Your Skill Request Was Not Approved',
            message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                '</div>' +
                '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                '<h2 style="color: #c62828; margin-top: 0;">Skill Request Not Approved</h2>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Unfortunately, your request to add a new skill was not approved at this time.</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill Name</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Category</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_category.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Reason</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_rejection_reason}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Reviewed By</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approved_by.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Review Date</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_approval_date}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #c62828; font-weight: bold;">Not Approved</span></td></tr>' +
                '</table>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'If you believe this skill should be reconsidered, please contact your Skills Administrator or submit a new request with additional justification.</p>' +
                '</div>' +
                '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                '</div></div>'
        });

        // ============================================================
        // 4. Skills Hub - Skill Validated by Manager
        //    Fires on update of sys_user_has_skill when validation_status
        //    changes to "validated"
        //    Sends to the skill owner (user field)
        // ============================================================
        createNotification({
            name: 'Skills Hub - Skill Validated by Manager',
            collection: 'sys_user_has_skill',
            action_insert: false,
            action_update: true,
            condition: 'u_validation_statusCHANGESTOvalidated',
            recipient_fields: 'user',
            subject: 'Skills Hub: Your Skill Has Been Validated',
            message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                '</div>' +
                '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                '<h2 style="color: #2e7d32; margin-top: 0;">Skill Validated</h2>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Great news! Your manager has validated one of your skills in the Skills Hub.</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Proficiency Level</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill_level}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Validation Date</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_last_manager_validation}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #2e7d32; font-weight: bold;">Validated</span></td></tr>' +
                '</table>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Manager-validated skills carry additional weight in the Skills Hub and contribute toward your tier ranking.</p>' +
                '</div>' +
                '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                '</div></div>'
        });

        // ============================================================
        // 5. Skills Hub - Skill Disputed by Manager
        //    Fires on update of sys_user_has_skill when validation_status
        //    changes to "disputed"
        //    Sends to the skill owner (user field) with manager's notes
        // ============================================================
        createNotification({
            name: 'Skills Hub - Skill Disputed by Manager',
            collection: 'sys_user_has_skill',
            action_insert: false,
            action_update: true,
            condition: 'u_validation_statusCHANGESTOdisputed',
            recipient_fields: 'user',
            subject: 'Skills Hub: Your Skill Assessment Has Been Disputed',
            message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                '</div>' +
                '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                '<h2 style="color: #e68a00; margin-top: 0;">Skill Assessment Disputed</h2>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Your manager has reviewed one of your skills and has a different assessment of your proficiency level. ' +
                'Please review the details below and discuss with your manager if needed.</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 180px; border: 1px solid #e0e0e0;">Skill</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Your Self-Assessment</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${skill_level}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Manager Assessment</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_manager_assessed_level}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Manager Notes</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_validation_notes}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Status</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #e68a00; font-weight: bold;">Disputed</span></td></tr>' +
                '</table>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Consider discussing this with your manager to align on your skill development goals. ' +
                'You can view your full skill profile in the <a href="/sp?id=skills_hub" style="color: #0072CE;">Skills Hub</a>.</p>' +
                '</div>' +
                '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                '</div></div>'
        });

        // ============================================================
        // 6. Skills Hub - Skill Endorsed
        //    Fires on insert of u_m2m_skill_endorsement
        //    Sends to the skill owner (via u_skill_record.user reference)
        //    Note: recipient_fields traverses the reference chain
        //    u_skill_record -> sys_user_has_skill.user -> sys_user
        // ============================================================
        createNotification({
            name: 'Skills Hub - Skill Endorsed',
            collection: 'u_m2m_skill_endorsement',
            action_insert: true,
            action_update: false,
            recipient_fields: 'u_skill_record.user',
            subject: "Skills Hub: You've Been Endorsed!",
            message_html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                '</div>' +
                '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                '<h2 style="color: #1565c0; margin-top: 0;">You Have a New Endorsement!</h2>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'A colleague has endorsed one of your skills in the Skills Hub.</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 140px; border: 1px solid #e0e0e0;">Skill</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_skill_record.skill.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Endorsed By</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${u_endorser.name}</td></tr>' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; border: 1px solid #e0e0e0;">Date</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;">${sys_created_on}</td></tr>' +
                '</table>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Peer endorsements strengthen your skill profile and contribute toward your tier ranking in the Skills Hub.</p>' +
                '</div>' +
                '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                'This is an automated message from the Skills Hub. Please do not reply directly to this email.' +
                '</div></div>'
        });

        // ============================================================
        // Summary
        // ============================================================
        gs.info('[Skills Hub] ===== NOTIFICATIONS SUMMARY =====');
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Already existed: ' + existed);
        gs.info('[Skills Hub] Errors: ' + errors);
        gs.info('[Skills Hub] =======================================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 13_create_notifications: ' + e.message);
    }
})();
