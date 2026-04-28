/**
 * Fix Script: 47_restore_manager_level_labels.js
 * Purpose: Restore Manager Matrix visible level labels after script 46.
 *
 * Fixes:
 *   - Replaces controller-helper level rendering with inline Angular expressions.
 *   - Keeps the Intermediate -> Learner display normalization.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 47_restore_manager_level_labels =====');

        function replaceAll(text, find, replacement) {
            return text.split(find).join(replacement);
        }

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Manager Matrix');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.warn('[Skills Hub] Manager Matrix widget not found during script 47');
            return;
        }

        var template = widget.getValue('template') || '';

        template = replaceAll(
            template,
            '{{c.normalizeLevelLabel(details.level)}}',
            '{{details.level == "Intermediate" ? "Learner" : details.level}}'
        );
        template = replaceAll(
            template,
            '{{c.normalizeLevelLabel(details.manager_assessed_level)}}',
            '{{details.manager_assessed_level == "Intermediate" ? "Learner" : details.manager_assessed_level}}'
        );

        // If script 46 did not run but this script is run later, normalize the original template safely.
        template = replaceAll(
            template,
            '{{details.level}}',
            '{{details.level == "Intermediate" ? "Learner" : details.level}}'
        );
        template = replaceAll(
            template,
            '{{details.manager_assessed_level}}',
            '{{details.manager_assessed_level == "Intermediate" ? "Learner" : details.manager_assessed_level}}'
        );

        widget.setValue('template', template);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 47_restore_manager_level_labels =====');
    } catch (e) {
        gs.error('[Skills Hub] 47_restore_manager_level_labels failed: ' + e.message);
    }
})();
