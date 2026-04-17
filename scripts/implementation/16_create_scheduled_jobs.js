/**
 * Fix Script: 16_create_scheduled_jobs.js
 * Purpose: Create scheduled jobs and event registration for Phase 2 processes
 * Scope: Global
 * Idempotent: Yes - safe to re-run (checks existence before creating)
 *
 * Creates:
 *   1. "Skills Hub - Monthly Validation Reminder" scheduled job (monthly, 1st at 08:00)
 *   2. "skills_hub.validation_reminder" event registration
 *
 * Run via: Scripts - Background (Global scope)
 * Prerequisite: Run 10_create_update_set_phase2.js through 15 first
 */
(function() {
    try {
        var created = 0;
        var existed = 0;
        var errors = 0;

        // ================================================================
        // Helper: Create or skip a scheduled job (by name)
        // ================================================================
        function createScheduledJob(config) {
            var gr = new GlideRecord('sysauto_script');
            gr.addQuery('name', config.name);
            gr.query();

            if (gr.next()) {
                gs.info('[Skills Hub] Scheduled job already exists: "' + config.name + '" (sys_id: ' + gr.getUniqueValue() + ')');
                existed++;
                return gr.getUniqueValue();
            }

            gr.initialize();
            gr.setValue('name', config.name);
            gr.setValue('active', true);
            gr.setValue('run_type', config.run_type);
            gr.setValue('script', config.script);

            if (config.run_dayofmonth) {
                gr.setValue('run_dayofmonth', config.run_dayofmonth);
            }
            if (config.run_dayofweek) {
                gr.setValue('run_dayofweek', config.run_dayofweek);
            }
            if (config.run_time) {
                gr.setValue('run_time', config.run_time);
            }

            var id = gr.insert();
            if (id) {
                gs.info('[Skills Hub] Created scheduled job: "' + config.name + '" (sys_id: ' + id + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create scheduled job: "' + config.name + '"');
                errors++;
            }
            return id;
        }

        // ============================================================
        // 1. Skills Hub - Monthly Validation Reminder
        //    Runs monthly on the 1st at 08:00
        //    Finds managers with direct reports who have unvalidated
        //    skills and queues a reminder event for each.
        // ============================================================
        createScheduledJob({
            name: 'Skills Hub - Monthly Validation Reminder',
            run_type: 'monthly',
            run_dayofmonth: 1,
            run_time: '08:00:00',
            script:
                '// Find all managers with direct reports who have unvalidated skills\n' +
                'var managers = {};\n' +
                '\n' +
                'var gr = new GlideRecord(\'sys_user_has_skill\');\n' +
                'gr.addQuery(\'u_validation_status\', \'!=\', \'validated\');\n' +
                'gr.addQuery(\'user.active\', true);\n' +
                'gr.addQuery(\'user.manager\', \'!=\', \'\');\n' +
                'gr.query();\n' +
                '\n' +
                'while (gr.next()) {\n' +
                '    var managerId = gr.user.manager.toString();\n' +
                '    var managerName = gr.user.manager.getDisplayValue();\n' +
                '    var managerEmail = gr.user.manager.email.toString();\n' +
                '\n' +
                '    if (!managers[managerId]) {\n' +
                '        managers[managerId] = {\n' +
                '            name: managerName,\n' +
                '            email: managerEmail,\n' +
                '            pendingCount: 0,\n' +
                '            employees: {}\n' +
                '        };\n' +
                '    }\n' +
                '\n' +
                '    var empName = gr.user.getDisplayValue();\n' +
                '    if (!managers[managerId].employees[empName]) {\n' +
                '        managers[managerId].employees[empName] = 0;\n' +
                '    }\n' +
                '    managers[managerId].employees[empName]++;\n' +
                '    managers[managerId].pendingCount++;\n' +
                '}\n' +
                '\n' +
                '// Send reminder to each manager\n' +
                'for (var mid in managers) {\n' +
                '    var mgr = managers[mid];\n' +
                '    if (mgr.pendingCount > 0) {\n' +
                '        gs.eventQueue(\'skills_hub.validation_reminder\', null, mid, mgr.pendingCount.toString());\n' +
                '        gs.info(\'[Skills Hub] Validation reminder queued for manager: \' + mgr.name + \' (\' + mgr.pendingCount + \' pending)\');\n' +
                '    }\n' +
                '}\n'
        });

        // ============================================================
        // 2. Register system event: skills_hub.validation_reminder
        //    Used by the Monthly Validation Reminder job to trigger
        //    notification emails to managers.
        // ============================================================
        var evt = new GlideRecord('sysevent_register');
        evt.addQuery('event_name', 'skills_hub.validation_reminder');
        evt.query();

        if (evt.next()) {
            gs.info('[Skills Hub] Event registration already exists: skills_hub.validation_reminder (sys_id: ' + evt.getUniqueValue() + ')');
            existed++;
        } else {
            evt.initialize();
            evt.setValue('event_name', 'skills_hub.validation_reminder');
            evt.setValue('description', 'Skills Hub - Monthly validation reminder event for managers');
            var evtId = evt.insert();

            if (evtId) {
                gs.info('[Skills Hub] Created event registration: skills_hub.validation_reminder (sys_id: ' + evtId + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create event registration: skills_hub.validation_reminder');
                errors++;
            }
        }

        // ============================================================
        // 3. Create notification for skills_hub.validation_reminder event
        //    Sends a summary email to the manager listing employees
        //    with unvalidated skills.
        //    parm1 = manager sys_id, parm2 = pending count
        // ============================================================
        var notif = new GlideRecord('sysevent_email_action');
        notif.addQuery('name', 'Skills Hub - Monthly Validation Reminder');
        notif.query();

        if (notif.next()) {
            gs.info('[Skills Hub] Notification already exists: "Skills Hub - Monthly Validation Reminder" (sys_id: ' + notif.getUniqueValue() + ')');
            existed++;
        } else {
            notif.initialize();
            notif.setValue('name', 'Skills Hub - Monthly Validation Reminder');
            notif.setValue('event_name', 'skills_hub.validation_reminder');
            notif.setValue('active', true);
            notif.setValue('content_type', 'text/html');
            notif.setValue('subject', 'Skills Hub: Team Skills Awaiting Your Validation');

            // event parm1 = manager sys_id (used as recipient)
            // event parm2 = pending skill count (used in template)
            notif.setValue('event_parm_1', 'true');

            notif.setValue('message_html',
                '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
                '<div style="background-color: #0072CE; padding: 20px; text-align: center;">' +
                '<h1 style="color: #ffffff; margin: 0; font-size: 24px;">Skills Hub</h1>' +
                '</div>' +
                '<div style="padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0;">' +
                '<h2 style="color: #333333; margin-top: 0;">Monthly Validation Reminder</h2>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'You have team members with skills that have not yet been validated. ' +
                'Regular skill validation helps maintain accurate skill data across the organization.</p>' +
                '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
                '<tr><td style="padding: 8px 12px; background-color: #f5f5f5; font-weight: bold; width: 180px; border: 1px solid #e0e0e0;">Pending Validations</td>' +
                '<td style="padding: 8px 12px; border: 1px solid #e0e0e0;"><span style="color: #e68a00; font-weight: bold;">${event.parm2} skill(s)</span></td></tr>' +
                '</table>' +
                '<p style="color: #555555; font-size: 14px; line-height: 1.6;">' +
                'Please visit the <a href="/sp?id=skills_hub&tab=manager" style="color: #0072CE;">Skills Hub Manager View</a> ' +
                'to review and validate your team\'s skills.</p>' +
                '</div>' +
                '<div style="padding: 12px 24px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #999999;">' +
                'This is an automated monthly reminder from the Skills Hub. Please do not reply directly to this email.' +
                '</div></div>'
            );

            var notifId = notif.insert();
            if (notifId) {
                gs.info('[Skills Hub] Created notification: "Skills Hub - Monthly Validation Reminder" (sys_id: ' + notifId + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create notification: "Skills Hub - Monthly Validation Reminder"');
                errors++;
            }
        }

        // ============================================================
        // Summary
        // ============================================================
        gs.info('[Skills Hub] ===== SCHEDULED JOBS SUMMARY =====');
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Already existed: ' + existed);
        gs.info('[Skills Hub] Errors: ' + errors);
        gs.info('[Skills Hub] =====================================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 16_create_scheduled_jobs: ' + e.message);
    }
})();
