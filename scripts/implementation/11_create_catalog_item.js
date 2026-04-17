/**
 * Fix Script: 11_create_catalog_item.js
 * Purpose: Create the "Request New Skill" service catalog item with variables
 * Scope: Global
 * Idempotent: Yes - safe to re-run
 *
 * Creates:
 *   1. "Skills Hub" catalog category (under Service Catalog)
 *   2. "Request New Skill" catalog item
 *   3. Catalog variables: u_skill_name (Single Line), u_skill_category (Reference), u_justification (Multi-line)
 *
 * Run via: Scripts - Background (Global scope)
 */
(function() {
    try {
        var created = 0;
        var existed = 0;
        var errors = 0;

        // ============================================================
        // 1. Find the Service Catalog
        // ============================================================
        var catalogId = '';
        var catalog = new GlideRecord('sc_catalog');
        catalog.addQuery('title', 'Service Catalog');
        catalog.query();

        if (catalog.next()) {
            catalogId = catalog.getUniqueValue();
            gs.info('[Skills Hub] Found Service Catalog (sys_id: ' + catalogId + ')');
        } else {
            gs.error('[Skills Hub] Service Catalog not found. Cannot create catalog item.');
            return;
        }

        // ============================================================
        // 2. Find or create "Skills Hub" category
        // ============================================================
        var categoryId = '';
        var existingCat = new GlideRecord('sc_category');
        existingCat.addQuery('title', 'Skills Hub');
        existingCat.query();

        if (existingCat.next()) {
            categoryId = existingCat.getUniqueValue();
            gs.info('[Skills Hub] Category already exists: Skills Hub (sys_id: ' + categoryId + ')');
            existed++;
        } else {
            var newCat = new GlideRecord('sc_category');
            newCat.initialize();
            newCat.setValue('title', 'Skills Hub');
            newCat.setValue('description', 'Skills Hub catalog items for skill requests, endorsements, and management');
            newCat.setValue('sc_catalog', catalogId);
            newCat.setValue('active', true);
            categoryId = newCat.insert();

            if (categoryId) {
                gs.info('[Skills Hub] Created category: Skills Hub (sys_id: ' + categoryId + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create category: Skills Hub');
                errors++;
                return;
            }
        }

        // ============================================================
        // 3. Find or create "Request New Skill" catalog item
        // ============================================================
        var catItemId = '';
        var existingItem = new GlideRecord('sc_cat_item');
        existingItem.addQuery('name', 'Request New Skill');
        existingItem.query();

        if (existingItem.next()) {
            catItemId = existingItem.getUniqueValue();
            gs.info('[Skills Hub] Catalog item already exists: Request New Skill (sys_id: ' + catItemId + ')');
            existed++;
        } else {
            var newItem = new GlideRecord('sc_cat_item');
            newItem.initialize();
            newItem.setValue('name', 'Request New Skill');
            newItem.setValue('short_description', 'Request a new skill to be added to the Skills Hub');
            newItem.setValue('description', 'Use this form to request that a new skill be added to the Skills Hub catalog. Your request will be reviewed by a Skills Administrator.');
            newItem.setValue('category', categoryId);
            newItem.setValue('active', true);
            catItemId = newItem.insert();

            if (catItemId) {
                gs.info('[Skills Hub] Created catalog item: Request New Skill (sys_id: ' + catItemId + ')');
                created++;
            } else {
                gs.error('[Skills Hub] FAILED to create catalog item: Request New Skill');
                errors++;
                return;
            }
        }

        // ============================================================
        // 4. Create catalog variables
        // ============================================================
        var variables = [
            {
                name: 'u_skill_name',
                question_text: 'Skill Name',
                type: 16,           // Single Line Text
                mandatory: true,
                order: 100,
                reference: ''
            },
            {
                name: 'u_skill_category',
                question_text: 'Category',
                type: 8,            // Reference
                mandatory: true,
                order: 200,
                reference: 'cmn_skill_category'
            },
            {
                name: 'u_justification',
                question_text: 'Justification',
                type: 6,            // Multi-line Text
                mandatory: true,
                order: 300,
                reference: ''
            }
        ];

        for (var i = 0; i < variables.length; i++) {
            var v = variables[i];

            // Check if variable already exists for this catalog item
            var existingVar = new GlideRecord('item_option_new');
            existingVar.addQuery('cat_item', catItemId);
            existingVar.addQuery('name', v.name);
            existingVar.query();

            if (existingVar.next()) {
                gs.info('[Skills Hub] Variable already exists: ' + v.name + ' (sys_id: ' + existingVar.getUniqueValue() + ')');
                existed++;
            } else {
                var newVar = new GlideRecord('item_option_new');
                newVar.initialize();
                newVar.setValue('cat_item', catItemId);
                newVar.setValue('name', v.name);
                newVar.setValue('question_text', v.question_text);
                newVar.setValue('type', v.type);
                newVar.setValue('mandatory', v.mandatory);
                newVar.setValue('order', v.order);

                if (v.reference) {
                    newVar.setValue('reference', v.reference);
                }

                var varId = newVar.insert();

                if (varId) {
                    gs.info('[Skills Hub] Created variable: ' + v.name + ' (type: ' + v.type + ', sys_id: ' + varId + ')');
                    created++;
                } else {
                    gs.error('[Skills Hub] FAILED to create variable: ' + v.name);
                    errors++;
                }
            }
        }

        // ============================================================
        // Summary
        // ============================================================
        gs.info('[Skills Hub] ===== CATALOG ITEM SUMMARY =====');
        gs.info('[Skills Hub] Category sys_id: ' + categoryId);
        gs.info('[Skills Hub] Catalog Item sys_id: ' + catItemId);
        gs.info('[Skills Hub] Created: ' + created);
        gs.info('[Skills Hub] Already existed: ' + existed);
        gs.info('[Skills Hub] Errors: ' + errors);
        gs.info('[Skills Hub] =================================');

    } catch (e) {
        gs.error('[Skills Hub] Error in 11_create_catalog_item: ' + e.message);
    }
})();
