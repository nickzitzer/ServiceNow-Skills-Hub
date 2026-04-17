// ============================================================
// Fix Script: Split shared skills into per-category records
// Affects 13 skills that appear in multiple groups
// Creates new cmn_skill records + updates cmn_skill_m2m_category
// Run in: Scripts - Background (Global scope)
// ============================================================

(function() {
    var LOG = 'SkillsSplit';
    var created = 0, relinked = 0, kept = 0;

    function findCategory(groupName, parentName) {
        var parentGR = new GlideRecord('cmn_skill_category');
        parentGR.addQuery('name', parentName);
        parentGR.addNullQuery('parent');
        parentGR.query();
        // If not found at top level, search as child of Epic
        if (!parentGR.next()) {
            parentGR = new GlideRecord('cmn_skill_category');
            parentGR.addQuery('name', parentName);
            parentGR.query();
            if (!parentGR.next()) return null;
        }
        var parentId = parentGR.getUniqueValue();
        var groupGR = new GlideRecord('cmn_skill_category');
        groupGR.addQuery('name', groupName);
        groupGR.addQuery('parent', parentId);
        groupGR.query();
        if (groupGR.next()) return groupGR.getUniqueValue();
        return null;
    }

    // --- Bridges/Interfaces (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Bridges/Interfaces');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Bridges/Interfaces'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Ambulatory
        origGR.setValue('display_skill_name', 'Bridges/Interfaces (Ambulatory)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Ambulatory', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Bridges/Interfaces -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Technical / Integration
        var catId = findCategory('Integration', 'Epic Technical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Bridges/Interfaces');
            existCheck.addQuery('display_skill_name', 'Bridges/Interfaces (Integration)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Bridges/Interfaces (Integration)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Bridges/Interfaces');
                newSkill.setValue('display_skill_name', 'Bridges/Interfaces (Integration)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Bridges/Interfaces (Integration) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Integration under Epic Technical');
        }

    })();

    // --- Charge Entry (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Charge Entry');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Charge Entry'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Revenue Cycle / Professional Billing
        origGR.setValue('display_skill_name', 'Charge Entry (Professional Billing)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Professional Billing', 'Epic Revenue Cycle');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Charge Entry -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Revenue Cycle / Charge router
        var catId = findCategory('Charge router', 'Epic Revenue Cycle');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Charge Entry');
            existCheck.addQuery('display_skill_name', 'Charge Entry (Charge router)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Charge Entry (Charge router)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Charge Entry');
                newSkill.setValue('display_skill_name', 'Charge Entry (Charge router)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Charge Entry (Charge router) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Charge router under Epic Revenue Cycle');
        }

    })();

    // --- Claim Submission (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Claim Submission');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Claim Submission'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Revenue Cycle / Hospital Billing
        origGR.setValue('display_skill_name', 'Claim Submission (Hospital Billing)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Hospital Billing', 'Epic Revenue Cycle');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Claim Submission -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Revenue Cycle / Professional Billing
        var catId = findCategory('Professional Billing', 'Epic Revenue Cycle');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Claim Submission');
            existCheck.addQuery('display_skill_name', 'Claim Submission (Professional Billing)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Claim Submission (Professional Billing)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Claim Submission');
                newSkill.setValue('display_skill_name', 'Claim Submission (Professional Billing)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Claim Submission (Professional Billing) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Professional Billing under Epic Revenue Cycle');
        }

    })();

    // --- Clinical Decision Support (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Clinical Decision Support');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Clinical Decision Support'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Pharmacy
        origGR.setValue('display_skill_name', 'Clinical Decision Support (Pharmacy)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Pharmacy', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Clinical Decision Support -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Inpatient
        var catId = findCategory('Inpatient', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Clinical Decision Support');
            existCheck.addQuery('display_skill_name', 'Clinical Decision Support (Inpatient)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Clinical Decision Support (Inpatient)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Clinical Decision Support');
                newSkill.setValue('display_skill_name', 'Clinical Decision Support (Inpatient)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Clinical Decision Support (Inpatient) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Inpatient under Epic Clinical');
        }

    })();

    // --- Data Courier (3 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Data Courier');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Data Courier'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Ambulatory
        origGR.setValue('display_skill_name', 'Data Courier (Ambulatory)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Ambulatory', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Data Courier -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Access / Cadence
        var catId = findCategory('Cadence', 'Epic Access');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Data Courier');
            existCheck.addQuery('display_skill_name', 'Data Courier (Cadence)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Data Courier (Cadence)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Data Courier');
                newSkill.setValue('display_skill_name', 'Data Courier (Cadence)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Data Courier (Cadence) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Cadence under Epic Access');
        }

        // Create new record for: Epic Clinical / Grand Central
        var catId = findCategory('Grand Central', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Data Courier');
            existCheck.addQuery('display_skill_name', 'Data Courier (Grand Central)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Data Courier (Grand Central)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Data Courier');
                newSkill.setValue('display_skill_name', 'Data Courier (Grand Central)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Data Courier (Grand Central) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Grand Central under Epic Clinical');
        }

    })();

    // --- Hospital Care at Home (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Hospital Care at Home');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Hospital Care at Home'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Inpatient
        origGR.setValue('display_skill_name', 'Hospital Care at Home (Inpatient)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Inpatient', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Hospital Care at Home -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Grand Central
        var catId = findCategory('Grand Central', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Hospital Care at Home');
            existCheck.addQuery('display_skill_name', 'Hospital Care at Home (Grand Central)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Hospital Care at Home (Grand Central)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Hospital Care at Home');
                newSkill.setValue('display_skill_name', 'Hospital Care at Home (Grand Central)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Hospital Care at Home (Grand Central) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Grand Central under Epic Clinical');
        }

    })();

    // --- Import/Export (3 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Import/Export');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Import/Export'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Access / Cadence
        origGR.setValue('display_skill_name', 'Import/Export (Cadence)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Cadence', 'Epic Access');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Import/Export -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Inpatient
        var catId = findCategory('Inpatient', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Import/Export');
            existCheck.addQuery('display_skill_name', 'Import/Export (Inpatient)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Import/Export (Inpatient)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Import/Export');
                newSkill.setValue('display_skill_name', 'Import/Export (Inpatient)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Import/Export (Inpatient) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Inpatient under Epic Clinical');
        }

        // Create new record for: Epic Clinical / Grand Central
        var catId = findCategory('Grand Central', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Import/Export');
            existCheck.addQuery('display_skill_name', 'Import/Export (Grand Central)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Import/Export (Grand Central)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Import/Export');
                newSkill.setValue('display_skill_name', 'Import/Export (Grand Central)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Import/Export (Grand Central) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Grand Central under Epic Clinical');
        }

    })();

    // --- Medication Administration (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Medication Administration');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Medication Administration'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Ambulatory
        origGR.setValue('display_skill_name', 'Medication Administration (Ambulatory)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Ambulatory', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Medication Administration -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Inpatient
        var catId = findCategory('Inpatient', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Medication Administration');
            existCheck.addQuery('display_skill_name', 'Medication Administration (Inpatient)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Medication Administration (Inpatient)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Medication Administration');
                newSkill.setValue('display_skill_name', 'Medication Administration (Inpatient)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Medication Administration (Inpatient) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Inpatient under Epic Clinical');
        }

    })();

    // --- Profiles (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Profiles');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Profiles'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Ambulatory
        origGR.setValue('display_skill_name', 'Profiles (Ambulatory)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Ambulatory', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Profiles -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Inpatient
        var catId = findCategory('Inpatient', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Profiles');
            existCheck.addQuery('display_skill_name', 'Profiles (Inpatient)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Profiles (Inpatient)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Profiles');
                newSkill.setValue('display_skill_name', 'Profiles (Inpatient)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Profiles (Inpatient) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Inpatient under Epic Clinical');
        }

    })();

    // --- Security Liason (3 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Security Liason');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Security Liason'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Grand Central
        origGR.setValue('display_skill_name', 'Security Liason (Grand Central)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Grand Central', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Security Liason -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Inpatient
        var catId = findCategory('Inpatient', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Security Liason');
            existCheck.addQuery('display_skill_name', 'Security Liason (Inpatient)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Security Liason (Inpatient)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Security Liason');
                newSkill.setValue('display_skill_name', 'Security Liason (Inpatient)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Security Liason (Inpatient) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Inpatient under Epic Clinical');
        }

        // Create new record for: Epic Clinical / ASAP
        var catId = findCategory('ASAP', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Security Liason');
            existCheck.addQuery('display_skill_name', 'Security Liason (ASAP)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Security Liason (ASAP)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Security Liason');
                newSkill.setValue('display_skill_name', 'Security Liason (ASAP)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Security Liason (ASAP) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: ASAP under Epic Clinical');
        }

    })();

    // --- SmartTools (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'SmartTools');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: SmartTools'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Ambulatory
        origGR.setValue('display_skill_name', 'SmartTools (Ambulatory)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Ambulatory', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for SmartTools -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Access / Cadence
        var catId = findCategory('Cadence', 'Epic Access');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'SmartTools');
            existCheck.addQuery('display_skill_name', 'SmartTools (Cadence)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: SmartTools (Cadence)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'SmartTools');
                newSkill.setValue('display_skill_name', 'SmartTools (Cadence)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: SmartTools (Cadence) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Cadence under Epic Access');
        }

    })();

    // --- Storyboard (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Storyboard');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Storyboard'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Inpatient
        origGR.setValue('display_skill_name', 'Storyboard (Inpatient)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Inpatient', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Storyboard -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Grand Central
        var catId = findCategory('Grand Central', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Storyboard');
            existCheck.addQuery('display_skill_name', 'Storyboard (Grand Central)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Storyboard (Grand Central)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Storyboard');
                newSkill.setValue('display_skill_name', 'Storyboard (Grand Central)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Storyboard (Grand Central) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Grand Central under Epic Clinical');
        }

    })();

    // --- Storyboard build (2 groups) ---
    (function() {
        var origGR = new GlideRecord('cmn_skill');
        origGR.addQuery('name', 'Storyboard build');
        origGR.query();
        if (!origGR.next()) { gs.warn(LOG + ': Skill not found: Storyboard build'); return; }
        var origId = origGR.getUniqueValue();
        var origDesc = origGR.getValue('description') || '';

        // Keep original record for: Epic Clinical / Ambulatory
        origGR.setValue('display_skill_name', 'Storyboard build (Ambulatory)');
        origGR.update();
        kept++;

        // Verify/fix M2M link for original
        var catId0 = findCategory('Ambulatory', 'Epic Clinical');
        if (catId0) {
            // Delete any M2M links for the original that point to OTHER categories
            var oldM2M = new GlideRecord('cmn_skill_m2m_category');
            oldM2M.addQuery('skill', origId);
            oldM2M.addQuery('category', '!=', catId0);
            oldM2M.query();
            while (oldM2M.next()) {
                gs.info(LOG + ': Removing old M2M link for Storyboard build -> ' + oldM2M.category.getDisplayValue());
                oldM2M.deleteRecord();
            }
            // Ensure correct link exists
            var checkM2M = new GlideRecord('cmn_skill_m2m_category');
            checkM2M.addQuery('skill', origId);
            checkM2M.addQuery('category', catId0);
            checkM2M.query();
            if (!checkM2M.hasNext()) {
                var newLink = new GlideRecord('cmn_skill_m2m_category');
                newLink.initialize();
                newLink.setValue('skill', origId);
                newLink.setValue('category', catId0);
                newLink.insert();
                relinked++;
            }
        }

        // Create new record for: Epic Clinical / Specialty Apps
        var catId = findCategory('Specialty Apps', 'Epic Clinical');
        if (catId) {
            // Check if we already created this split
            var existCheck = new GlideRecord('cmn_skill');
            existCheck.addQuery('name', 'Storyboard build');
            existCheck.addQuery('display_skill_name', 'Storyboard build (Specialty Apps)');
            existCheck.query();
            var newSkillId;
            if (existCheck.next()) {
                newSkillId = existCheck.getUniqueValue();
                gs.info(LOG + ': Already exists: Storyboard build (Specialty Apps)');
            } else {
                var newSkill = new GlideRecord('cmn_skill');
                newSkill.initialize();
                newSkill.setValue('name', 'Storyboard build');
                newSkill.setValue('display_skill_name', 'Storyboard build (Specialty Apps)');
                newSkill.setValue('description', origDesc);
                newSkill.setValue('active', true);
                newSkillId = newSkill.insert();
                created++;
                gs.info(LOG + ': Created: Storyboard build (Specialty Apps) (' + newSkillId + ')');
            }
            // Create M2M link
            var m2mCheck = new GlideRecord('cmn_skill_m2m_category');
            m2mCheck.addQuery('skill', newSkillId);
            m2mCheck.addQuery('category', catId);
            m2mCheck.query();
            if (!m2mCheck.hasNext()) {
                var m2m = new GlideRecord('cmn_skill_m2m_category');
                m2m.initialize();
                m2m.setValue('skill', newSkillId);
                m2m.setValue('category', catId);
                m2m.insert();
                relinked++;
            }
        } else {
            gs.warn(LOG + ': Category not found: Specialty Apps under Epic Clinical');
        }

    })();

    gs.info(LOG + ': === SPLIT COMPLETE ===');
    gs.info(LOG + ': Original records updated (display_skill_name): ' + kept);
    gs.info(LOG + ': New skill records created: ' + created);
    gs.info(LOG + ': M2M links created/verified: ' + relinked);
})();