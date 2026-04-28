/**
 * Verification Script: 59_verify_find_expert_hierarchy_filters.js
 * Purpose: Verify Find Expert hierarchy-aware filter patch.
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    var prefix = '[Skills Hub 59 Verify] ';
    var passed = 0;
    var failed = 0;

    function pass(message) {
        passed++;
        gs.info(prefix + 'PASS - ' + message);
    }

    function fail(message) {
        failed++;
        gs.error(prefix + 'FAIL - ' + message);
    }

    function contains(label, text, marker) {
        if ((text || '').indexOf(marker) > -1) pass(label + ' contains marker: ' + marker);
        else fail(label + ' missing marker: ' + marker);
    }

    try {
        gs.info(prefix + '===== STARTING FIND EXPERT HIERARCHY FILTER VERIFICATION =====');

        var widget = new GlideRecord('sp_widget');
        widget.addQuery('name', 'Skills Hub - Find Expert');
        widget.setLimit(1);
        widget.query();
        if (!widget.next()) {
            fail('Find Expert widget missing');
            gs.info(prefix + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
            return;
        }

        pass('Find Expert widget exists');
        var server = widget.getValue('script') || '';
        contains('Find Expert server', server, 'Skills Hub Hierarchy Filters 58');
        contains('Find Expert server', server, 'sh58HierarchyDisplaySet("cmn_department", departmentFilter)');
        contains('Find Expert server', server, 'sh58HierarchyDisplaySet("core_company", businessUnitFilter)');
        contains('Find Expert server', server, 'sh58HierarchyDisplaySet("sys_user_group", groupFilter)');
        contains('Find Expert server', server, 'sh58UserInGroupHierarchy(uid, groupFilter, groupHierarchy)');

        var dept = new GlideRecord('cmn_department');
        if (dept.isValid()) pass('cmn_department table is valid');
        else fail('cmn_department table is invalid');
        if (dept.isValidField('parent')) pass('cmn_department.parent field exists for hierarchy expansion');
        else fail('cmn_department.parent field missing');

        var group = new GlideRecord('sys_user_group');
        if (group.isValid()) pass('sys_user_group table is valid');
        else fail('sys_user_group table is invalid');
        if (group.isValidField('parent')) pass('sys_user_group.parent field exists for hierarchy expansion');
        else fail('sys_user_group.parent field missing');

        var company = new GlideRecord('core_company');
        if (company.isValid()) pass('core_company table is valid');
        else fail('core_company table is invalid');
        if (company.isValidField('parent')) pass('core_company.parent field exists for business-unit hierarchy expansion');
        else gs.warn(prefix + 'WARN - core_company.parent field missing; business-unit filter will remain exact-match fallback');

        gs.info(prefix + '===== COMPLETE: ' + passed + ' passed, ' + failed + ' failed =====');
    } catch (e) {
        gs.error(prefix + 'Verification failed unexpectedly: ' + e.message);
    }
})();
