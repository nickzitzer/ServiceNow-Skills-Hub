/**
 * Fix Script: 62_dispute_loop_template_repair.js
 * Purpose: Repair Manager Matrix template insertion from script 60.
 *
 * Root cause:
 *   Script 60 used exact multi-line replacements for the prior manager-notes block.
 *   The live Manager Matrix template has drifted through earlier patches, so the
 *   client/CSS changes landed but the compact status details button did not.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 62_dispute_loop_template_repair =====');

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Manager Matrix');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.error('[Skills Hub] Manager Matrix widget not found. Aborting 62.');
            return;
        }

        var template = widget.getValue('template') || '';
        var button = '<button type="button" class="status-chip-compact" ng-if="details.status == \'disputed\' || details.status == \'review_requested\' || details.validation_notes || details.manager_assessed_level" ng-click="c.showDisputeDetails(skillName, details, user)" uib-tooltip="View status details">{{c.disputeStatusLabel(details) || "Details"}}</button>';

        if (template.indexOf('status-chip-compact') > -1) {
            gs.info('[Skills Hub] Manager Matrix already contains status-chip-compact');
            return;
        }

        var replaced = false;
        var notesStart = template.indexOf('<div class="manager-notes"');
        if (notesStart > -1) {
            var notesEnd = template.indexOf('</div>', notesStart);
            if (notesEnd > -1) {
                template = template.substring(0, notesStart) + button + template.substring(notesEnd + 6);
                replaced = true;
                gs.info('[Skills Hub] Replaced manager-notes block with compact status button');
            }
        }

        if (!replaced) {
            var spActions = '<span class="sp-actions" ng-if="!details.validated">';
            if (template.indexOf(spActions) > -1) {
                template = template.replace(spActions, button + '\n                          ' + spActions);
                replaced = true;
                gs.info('[Skills Hub] Inserted compact status button before manager action buttons');
            }
        }

        if (!replaced) {
            var skillPillClose = '                       </div>';
            if (template.indexOf(skillPillClose) > -1) {
                template = template.replace(skillPillClose, '                          ' + button + '\n' + skillPillClose);
                replaced = true;
                gs.info('[Skills Hub] Inserted compact status button before skill pill close');
            }
        }

        if (!replaced) {
            gs.error('[Skills Hub] Could not find a safe Manager Matrix insertion point for status-chip-compact');
            return;
        }

        widget.setValue('template', template);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 62_dispute_loop_template_repair =====');
    } catch (e) {
        gs.error('[Skills Hub] 62_dispute_loop_template_repair failed: ' + e.message);
    }
})();
