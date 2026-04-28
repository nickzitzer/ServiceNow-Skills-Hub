/**
 * Fix Script: 46_manager_matrix_label_polish.js
 * Purpose: Clean up Manager Matrix labels discovered during impersonation QA.
 *
 * Fixes:
 *   - Normalizes level 2 display from "Intermediate" to "Learner".
 *   - Normalizes manager assessed level notes to the same naming convention.
 *   - Adds accessible labels/tooltips to icon-only validate/dispute buttons.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 46_manager_matrix_label_polish =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Manager Matrix');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 46');
            return;
        }

        var client = widget.getValue('client_script') || '';
        var template = widget.getValue('template') || '';

        if (client.indexOf('normalizeLevelLabel') < 0) {
            client = client.replace('    var c = this;', [
                '    var c = this;',
                '',
                '    c.normalizeLevelLabel = function(level) {',
                '       if (!level) return level;',
                '       return String(level).replace("Intermediate", "Learner");',
                '    };'
            ].join('\n'));
        }

        template = replaceAll(template, '{{details.level}}', '{{c.normalizeLevelLabel(details.level)}}');
        template = replaceAll(template, '{{details.manager_assessed_level}}', '{{c.normalizeLevelLabel(details.manager_assessed_level)}}');
        template = replaceAll(template, 'value="Intermediate">Intermediate</option>', 'value="Learner">Learner</option>');
        template = replaceAll(template, '> Intermediate</span>', '> Learner</span>');
        template = replaceAll(template, '>Intermediate</span>', '>Learner</span>');

        template = replaceAll(template,
            '<button class="btn-validate" ng-click="c.validateSkill(user.userId, skillName, details)" uib-tooltip="Validate">',
            '<button class="btn-validate" ng-click="c.validateSkill(user.userId, skillName, details)" uib-tooltip="Validate skill" aria-label="Validate {{skillName}} for {{user.name}}">');
        template = replaceAll(template,
            '<button class="btn-dispute" ng-click="c.openDisputeModal(user.userId, user.name, skillName, details)" uib-tooltip="Dispute">',
            '<button class="btn-dispute" ng-click="c.openDisputeModal(user.userId, user.name, skillName, details)" uib-tooltip="Dispute skill" aria-label="Dispute {{skillName}} for {{user.name}}">');

        widget.setValue('client_script', client);
        widget.setValue('template', template);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 46_manager_matrix_label_polish =====');
    } catch (e) {
        gs.error('[Skills Hub] 46_manager_matrix_label_polish failed: ' + e.message);
    }
})();
