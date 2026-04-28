/**
 * Fix Script: 64_dispute_details_modal_layout_fix.js
 * Purpose: Fix Manager Matrix dispute details modal layout.
 *
 * Root cause:
 *   UI Bootstrap modals render outside the widget DOM, so widget-scoped CSS for
 *   .detail-row may not apply. The modal still opens, but labels run into values.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        gs.info('[Skills Hub] ===== STARTING 64_dispute_details_modal_layout_fix =====');

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Manager Matrix');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            gs.error('[Skills Hub] Manager Matrix widget not found. Aborting 64.');
            return;
        }

        var client = widget.getValue('client_script') || '';
        var marker = 'Skills Hub Dispute Details Modal Layout 64';

        if (client.indexOf(marker) > -1) {
            gs.info('[Skills Hub] Dispute details modal layout fix already applied');
            return;
        }

        var oldTemplate = 'template: \'<div class="modal-header"><h4 class="modal-title">{{skillName}}</h4><div class="small text-muted">{{user.name}}</div></div><div class="modal-body"><div class="detail-row"><strong>Status</strong><span>{{statusLabel}}</span></div><div class="detail-row" ng-if="details.manager_assessed_level"><strong>Suggested level</strong><span>{{details.manager_assessed_level}}</span></div><div class="detail-row" ng-if="details.last_manager_validation"><strong>Last validated</strong><span>{{details.last_manager_validation}}</span></div><div class="detail-notes" ng-if="details.validation_notes"><strong>Notes</strong><div>{{details.validation_notes}}</div></div><div ng-if="!details.validation_notes" class="text-muted">No notes recorded.</div></div><div class="modal-footer"><button class="btn btn-default" ng-click="$close()">Close</button></div>\',';
        var newTemplate = 'template: \'<div class="modal-header"><h4 class="modal-title" style="margin:0;">{{skillName}}</h4><div class="small text-muted">{{user.name}}</div></div><div class="modal-body"><div style="display:grid; grid-template-columns:140px 1fr; gap:8px 16px; align-items:start;"><strong>Status</strong><span>{{statusLabel}}</span><strong ng-if="details.manager_assessed_level">Suggested level</strong><span ng-if="details.manager_assessed_level">{{details.manager_assessed_level}}</span><strong ng-if="details.last_manager_validation">Last validated</strong><span ng-if="details.last_manager_validation">{{details.last_manager_validation}}</span></div><div ng-if="details.validation_notes" style="margin-top:14px;"><strong>Notes</strong><div style="margin-top:6px; white-space:pre-line; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px; color:#334155;">{{details.validation_notes}}</div></div><div ng-if="!details.validation_notes" class="text-muted" style="margin-top:14px;">No notes recorded.</div></div><div class="modal-footer"><button class="btn btn-default" ng-click="$close()">Close</button></div>\',';

        if (client.indexOf(oldTemplate) < 0) {
            gs.warn('[Skills Hub] Expected dispute modal template not found; applying marker only was skipped');
            return;
        }

        client = client.replace(oldTemplate, newTemplate);
        client = client.replace('  // Skills Hub Dispute Polish 60', '  // Skills Hub Dispute Polish 60\n  // ' + marker);

        widget.setValue('client_script', client);
        widget.update();

        gs.info('[Skills Hub] ===== COMPLETED 64_dispute_details_modal_layout_fix =====');
    } catch (e) {
        gs.error('[Skills Hub] 64_dispute_details_modal_layout_fix failed: ' + e.message);
    }
})();
