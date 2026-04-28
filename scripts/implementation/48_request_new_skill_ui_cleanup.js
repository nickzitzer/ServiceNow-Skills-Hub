/**
 * Fix Script: 48_request_new_skill_ui_cleanup.js
 * Purpose: Clean up the "Request New Skill" user flow without adding workflow.
 *
 * Fixes:
 *   - Makes the Add Skill modal's request path prominent and closes the modal before navigation.
 *   - Simplifies the catalog item copy around requesting a missing skill.
 *   - Uses one user-facing "Description" field for understanding/classification.
 *   - Hides duplicate description variables and re-labels the existing backend
 *     u_justification variable as Description for compatibility.
 *   - Updates request notification labels from Justification to Description.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 48_request_new_skill_ui_cleanup =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        function setIfValid(gr, fieldName, value) {
            if (gr.isValidField(fieldName)) {
                gr.setValue(fieldName, value);
            }
        }

        function findRequestItem() {
            var item = new GlideRecord('sc_cat_item');
            item.addQuery('name', 'Request New Skill');
            item.setLimit(1);
            item.query();
            return item.next() ? item : null;
        }

        var requestItem = findRequestItem();
        if (!requestItem) {
            gs.warn('[Skills Hub] Request New Skill catalog item not found during script 48');
        } else {
            var requestItemId = requestItem.getUniqueValue();

            requestItem.setValue('short_description', 'Request a missing skill for the Skills Hub catalog');
            requestItem.setValue(
                'description',
                'Use this form when a skill exists in the work people do, but is missing from the Skills Hub catalog. Describe what the skill means so it can be classified clearly.'
            );
            requestItem.update();
            gs.info('[Skills Hub] Request New Skill catalog item copy updated');

            // Existing backend processing reads current.variables.u_justification.
            // Keep that variable name, but make the user-facing field "Description".
            var vars = new GlideRecord('item_option_new');
            vars.addQuery('cat_item', requestItemId);
            vars.query();
            while (vars.next()) {
                var varName = vars.getValue('name') || '';
                var label = vars.getValue('question_text') || '';

                if (varName == 'u_skill_name') {
                    vars.setValue('question_text', 'Skill name');
                    vars.setValue('mandatory', true);
                    vars.setValue('order', 100);
                    setIfValid(vars, 'help_text', 'Enter the skill exactly as users should search for it.');
                    setIfValid(vars, 'instructions', 'Enter the skill exactly as users should search for it.');
                    vars.update();
                } else if (varName == 'u_skill_category') {
                    vars.setValue('question_text', 'Suggested category');
                    vars.setValue('mandatory', true);
                    vars.setValue('order', 200);
                    setIfValid(vars, 'help_text', 'Choose the closest existing category. The catalog owner can adjust it later.');
                    setIfValid(vars, 'instructions', 'Choose the closest existing category. The catalog owner can adjust it later.');
                    vars.update();
                } else if (varName == 'u_justification') {
                    vars.setValue('question_text', 'Description');
                    vars.setValue('mandatory', true);
                    vars.setValue('order', 300);
                    setIfValid(vars, 'help_text', 'Describe what this skill covers, example work it applies to, and any boundaries that help distinguish it from nearby skills.');
                    setIfValid(vars, 'instructions', 'Describe what this skill covers, example work it applies to, and any boundaries that help distinguish it from nearby skills.');
                    vars.update();
                } else if ((varName == 'description' || varName == 'u_description' || label == 'Description') && varName != 'u_justification') {
                    vars.setValue('active', false);
                    vars.setValue('mandatory', false);
                    vars.update();
                    gs.info('[Skills Hub] Disabled duplicate request description variable: ' + varName);
                }
            }

            // Patch the My Profile add modal request path.
            var profile = new GlideRecord('sp_widget');
            profile.addQuery('name', 'Skills Hub - My Profile');
            profile.setLimit(1);
            profile.query();
            if (profile.next()) {
                var template = profile.getValue('template') || '';
                var client = profile.getValue('client_script') || '';
                var css = profile.getValue('css') || '';
                var url = '?id=sc_cat_item&sys_id=' + requestItemId;

                var oldRequestHtml = [
                    '<div class="small" style="margin-top:15px; color:#64748b;">',
                    '            <i class="fa fa-info-circle"></i> Can\'t find a skill?',
                    '            <a href="?id=sc_cat_item&sys_id=' + requestItemId + '" style="color:#0078bf;">Request it here.</a>',
                    '        </div>'
                ].join('\n');

                var newRequestHtml = [
                    '<div class="request-skill-callout">',
                    '            <div class="request-skill-copy">',
                    '                <i class="fa fa-info-circle"></i>',
                    '                <span>Missing from the catalog?</span>',
                    '            </div>',
                    '            <button type="button" class="btn-request-skill" ng-click="requestNewSkill()">',
                    '                Request a new catalog skill',
                    '            </button>',
                    '        </div>'
                ].join('\n');

                if (template.indexOf('request-skill-callout') < 0) {
                    if (template.indexOf(oldRequestHtml) > -1) {
                        template = template.replace(oldRequestHtml, newRequestHtml);
                    } else {
                        template = template.replace(
                            '<a href="' + url + '" style="color:#0078bf;">Request it here.</a>',
                            '<button type="button" class="btn-request-skill" ng-click="requestNewSkill()">Request a new catalog skill</button>'
                        );
                    }
                }

                if (client.indexOf('$scope.requestNewSkill') < 0) {
                    client = client.replace(
                        '              $scope.cancel = function() {\n                  $uibModalInstance.dismiss("cancel");\n              };',
                        [
                            '              $scope.requestNewSkill = function() {',
                            '                  $uibModalInstance.dismiss("request_new_skill");',
                            '                  window.location.href = "' + url + '";',
                            '              };',
                            '',
                            '              $scope.cancel = function() {',
                            '                  $uibModalInstance.dismiss("cancel");',
                            '              };'
                        ].join('\n')
                    );
                }

                if (css.indexOf('Skills Hub Request Flow 48') < 0) {
                    css += [
                        '',
                        '/* Skills Hub Request Flow 48 */',
                        '.request-skill-callout { margin-top:16px; padding:12px; border:1px solid #dbeafe; background:#f0f9ff; border-radius:8px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }',
                        '.request-skill-copy { display:flex; align-items:center; gap:6px; color:#334155; font-size:13px; font-weight:600; }',
                        '.request-skill-copy i { color:#0078bf; }',
                        '.btn-request-skill { border:1px solid #0078bf; background:#fff; color:#0078bf; border-radius:8px; padding:7px 10px; font-size:12px; font-weight:700; }',
                        '.btn-request-skill:hover, .btn-request-skill:focus { background:#0078bf; color:#fff; outline:none; }'
                    ].join('\n');
                }

                profile.setValue('template', template);
                profile.setValue('client_script', client);
                profile.setValue('css', css);
                profile.update();
                gs.info('[Skills Hub] My Profile request path patched');
            } else {
                gs.warn('[Skills Hub] My Profile widget not found during script 48');
            }

            // Keep existing emails compatible but aligned with the simplified user-facing field.
            var email = new GlideRecord('sysevent_email_action');
            email.addQuery('name', 'STARTSWITH', 'Skills Hub - Skill Request');
            email.query();
            while (email.next()) {
                var html = email.getValue('message_html') || '';
                html = replaceAll(html, '>Justification</td>', '>Description</td>');
                html = replaceAll(html, 'additional justification', 'additional description');
                html = replaceAll(html, 'awaiting review by a Skills Administrator', 'captured for catalog review');
                html = replaceAll(html, 'reviewed by a Skills Administrator', 'reviewed for catalog fit');
                email.setValue('message_html', html);
                email.update();
            }
        }

        gs.info('[Skills Hub] ===== COMPLETED 48_request_new_skill_ui_cleanup =====');
    } catch (e) {
        gs.error('[Skills Hub] 48_request_new_skill_ui_cleanup failed: ' + e.message);
    }
})();
