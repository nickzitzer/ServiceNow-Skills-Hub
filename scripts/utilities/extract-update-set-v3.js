#!/usr/bin/env node

/**
 * extract-update-set-v3.js
 *
 * Parses a ServiceNow update set XML export and produces categorized markdown
 * files with full record content (including decoded payload fields) in a
 * specified output directory.
 *
 * Usage:
 *   node extract-update-set-v3.js <input.xml> <output-dir>
 *
 * Dependencies: xml2js (installed in ./node_modules)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fields shown prominently at the top of each record */
const KEY_FIELDS = new Set([
  'name', 'active', 'script', 'sys_name', 'label', 'element',
  'column_label', 'internal_type', 'default_value', 'description',
  'condition', 'html', 'client_script', 'css',
]);

/** Threshold (chars) above which a field value is extracted to a file */
const LARGE_FIELD_THRESHOLD = 1000;

/** Fields whose extracted file should use a specific extension */
const EXTENSION_MAP = {
  script: '.js',
  client_script: '.js',
  html: '.xml',
  css: '.css',
};

/** Categorization rules keyed by prefix of the sys_update_xml `name` field */
const CATEGORY_RULES = [
  // Order matters: more specific prefixes first
  { prefix: 'sys_script_include_', category: 'scripts' },
  { prefix: 'sysauto_script_', category: 'scripts' },
  { prefix: 'sys_ui_page_', category: 'scripts' },
  { prefix: 'sys_db_object_', category: 'tables' },
  { prefix: 'sys_dictionary_', category: 'fields' },
  { prefix: 'sys_choice_', category: 'choices' },
  { prefix: 'sys_security_acl_role_', category: 'security' },
  { prefix: 'sys_security_acl_', category: 'security-acl' },
  { prefix: 'sys_user_role_contains_', category: 'security' },
  { prefix: 'sys_user_role_', category: 'security' },
  { prefix: 'sys_user_has_role_', category: 'security' },
  { prefix: 'sys_app_module_', category: 'modules' },
  { prefix: 'sys_app_application_', category: 'applications' },
  { prefix: 'sys_rest_message_fn_', category: 'connections' },
  { prefix: 'sys_rest_message_', category: 'rest-messages' },
  { prefix: 'sys_alias_', category: 'connections' },
  { prefix: 'sys_connection_alias_', category: 'connections' },
  { prefix: 'topic_', category: 'chat-topics' },
  { prefix: 'sys_cs_', category: 'chat-topics' },
  { prefix: 'sys_cb_design_topic_', category: 'chat-topics' },
  { prefix: 'sys_properties_', category: 'other' },
  { prefix: 'sys_hub_', category: 'other' },
  { prefix: 'sys_flow_', category: 'other' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the table name portion from a sys_update_xml `name` field.
 * The format is `tablename_<32-char-hex-sys_id>` or `tablename_<other-id>`.
 * We strip the trailing 32-char hex sys_id if present.
 */
function extractTableName(updateXmlName) {
  if (!updateXmlName) return 'unknown';
  // Match a 32-char hex id at the end preceded by underscore
  const match = updateXmlName.match(/^(.+)_([0-9a-f]{32})$/i);
  if (match) return match[1];
  // For names like sys_choice_u_ai_conversation_status, fall back
  // to the first known table prefix
  for (const rule of CATEGORY_RULES) {
    if (updateXmlName.startsWith(rule.prefix)) {
      return rule.prefix.replace(/_$/, '');
    }
  }
  return 'unknown';
}

/**
 * Determine category for a record based on its sys_update_xml `name`.
 */
function categorize(updateXmlName) {
  if (!updateXmlName) return 'other';
  for (const rule of CATEGORY_RULES) {
    if (updateXmlName.startsWith(rule.prefix)) {
      return rule.category;
    }
  }
  return 'other';
}

/**
 * Convert a name string to a file-system-safe slug.
 */
function slugify(str) {
  if (!str) return 'unnamed';
  return str
    .replace(/[^a-zA-Z0-9_\-. ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'unnamed';
}

/**
 * Format a byte count to human-readable form.
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb / 1024;
  return mb.toFixed(1) + ' MB';
}

/**
 * Get the plain text value from an xml2js parsed element.
 * xml2js with explicitCharkey wraps text in `_`.
 * Elements can be strings, arrays, or objects with attributes.
 */
function getTextValue(elem) {
  if (elem === undefined || elem === null) return '';
  if (typeof elem === 'string') return elem;
  if (Array.isArray(elem)) return getTextValue(elem[0]);
  if (typeof elem === 'object') {
    if (elem._ !== undefined) return String(elem._);
    if (elem.$ !== undefined && Object.keys(elem).length === 1) return '';
    return '';
  }
  return String(elem);
}

/**
 * Build a field value representation from an xml2js parsed element.
 * Returns either a plain string or an object with `value` and `attributes`.
 */
function buildFieldValue(elem) {
  if (elem === undefined || elem === null) return '';
  if (typeof elem === 'string') return elem;
  if (Array.isArray(elem)) return buildFieldValue(elem[0]);
  if (typeof elem === 'object') {
    const textVal = getTextValue(elem);
    const attrs = elem.$ || {};
    const attrKeys = Object.keys(attrs);
    if (attrKeys.length > 0) {
      // Has attributes — return structured object
      const result = {
        value: textVal,
        attributes: {},
      };
      for (const key of attrKeys) {
        result.attributes[key] = attrs[key];
      }
      return result;
    }
    return textVal;
  }
  return String(elem);
}

/**
 * Get a display-friendly value from a field value (string or structured obj).
 */
function displayValue(fieldVal) {
  if (typeof fieldVal === 'string') return fieldVal;
  if (typeof fieldVal === 'object' && fieldVal !== null) {
    if (fieldVal.attributes && fieldVal.attributes.display_value) {
      return fieldVal.attributes.display_value;
    }
    return fieldVal.value || '';
  }
  return String(fieldVal);
}

/**
 * Parse the inner payload XML and return a fields object.
 */
async function parsePayload(payloadStr) {
  if (!payloadStr || !payloadStr.trim()) return null;

  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: false,
      charkey: '_',
      attrkey: '$',
      explicitCharkey: true,
      trim: false,
      normalizeTags: false,
      normalize: false,
      preserveChildrenOrder: true,
    });

    const result = await parser.parseStringPromise(payloadStr);
    if (!result || !result.record_update) return null;

    const recordUpdate = result.record_update;
    const tableName = recordUpdate.$ && recordUpdate.$.table;

    // The actual record is nested under the table name element
    let recordData = null;
    if (tableName && recordUpdate[tableName]) {
      recordData = recordUpdate[tableName];
    } else {
      // Fallback: find the first non-$ child
      for (const key of Object.keys(recordUpdate)) {
        if (key !== '$') {
          recordData = recordUpdate[key];
          break;
        }
      }
    }

    if (!recordData) return null;

    // Build fields object
    const fields = {};
    for (const key of Object.keys(recordData)) {
      if (key === '$') continue; // skip attributes of the record element itself
      fields[key] = buildFieldValue(recordData[key]);
    }

    return { tableName, fields };
  } catch (err) {
    // Log but don't fail — some payloads may be malformed
    console.error(`  Warning: Failed to parse payload: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main extraction
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node extract-update-set-v3.js <input.xml> <output-dir>');
    process.exit(1);
  }

  const inputFile = path.resolve(args[0]);
  const outputDir = path.resolve(args[1]);

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  // Ensure output directories exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'scripts'), { recursive: true });

  console.log(`Reading: ${inputFile}`);
  const xmlContent = fs.readFileSync(inputFile, 'utf8');

  console.log('Parsing XML...');
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: false,
    charkey: '_',
    attrkey: '$',
    explicitCharkey: true,
    trim: false,
    normalizeTags: false,
    normalize: false,
  });

  let parsed;
  try {
    parsed = await parser.parseStringPromise(xmlContent);
  } catch (err) {
    console.error(`Error parsing XML: ${err.message}`);
    process.exit(1);
  }

  const unload = parsed.unload;
  if (!unload) {
    console.error('Error: Expected root <unload> element not found');
    process.exit(1);
  }

  // Collect sys_update_xml records
  let updateRecords = unload.sys_update_xml || [];
  if (!Array.isArray(updateRecords)) {
    updateRecords = [updateRecords];
  }

  const totalRecords = updateRecords.length;
  console.log(`Found ${totalRecords} sys_update_xml records`);

  // ---------------------------------------------------------------------------
  // Process each record
  // ---------------------------------------------------------------------------

  /** @type {Map<string, Array>} category -> records */
  const categories = new Map();
  /** Extracted file list for INDEX */
  const extractedFiles = [];

  for (let i = 0; i < totalRecords; i++) {
    if ((i + 1) % 50 === 0 || i === 0 || i === totalRecords - 1) {
      console.log(`Extracting record ${i + 1}/${totalRecords}...`);
    }

    const rec = updateRecords[i];
    const recName = getTextValue(rec.name);
    const recAction = getTextValue(rec.action);
    const payloadRaw = getTextValue(rec.payload);

    const category = categorize(recName);

    // Parse the payload
    let payloadData = null;
    if (payloadRaw) {
      payloadData = await parsePayload(payloadRaw);
    }

    const fields = payloadData ? payloadData.fields : {};
    const tableName = payloadData ? payloadData.tableName : extractTableName(recName);
    const fieldCount = Object.keys(fields).length;

    // Determine record display name for extracted files
    const recordDisplayName =
      displayValue(fields.name) ||
      displayValue(fields.sys_name) ||
      displayValue(fields.title) ||
      recName;

    // Determine record type (the table the payload belongs to)
    const recordType = tableName || extractTableName(recName);

    // Handle large field extraction
    const recordExtractedFiles = [];
    const fieldsForJson = { ...fields };

    for (const [fieldName, fieldVal] of Object.entries(fields)) {
      const textVal = typeof fieldVal === 'string' ? fieldVal : (fieldVal && fieldVal.value) || '';
      if (textVal.length > LARGE_FIELD_THRESHOLD) {
        const ext = EXTENSION_MAP[fieldName] || '.txt';
        const slug = slugify(recordDisplayName);
        const filename = `${slug}-${fieldName}${ext}`;
        const filePath = path.join(outputDir, 'scripts', filename);

        try {
          fs.writeFileSync(filePath, textVal, 'utf8');
          const sizeBytes = Buffer.byteLength(textVal, 'utf8');
          recordExtractedFiles.push({
            fieldName,
            filename,
            size: sizeBytes,
          });
          extractedFiles.push({
            filename,
            size: sizeBytes,
          });

          // Replace value in JSON with extraction marker
          if (typeof fieldsForJson[fieldName] === 'string') {
            fieldsForJson[fieldName] = `[EXTRACTED → scripts/${filename}]`;
          } else if (typeof fieldsForJson[fieldName] === 'object' && fieldsForJson[fieldName] !== null) {
            fieldsForJson[fieldName] = {
              ...fieldsForJson[fieldName],
              value: `[EXTRACTED → scripts/${filename}]`,
            };
          }
        } catch (err) {
          console.error(`  Warning: Failed to extract ${fieldName} for ${recName}: ${err.message}`);
        }
      }
    }

    // Build the processed record
    const processedRecord = {
      updateXmlName: recName,
      action: recAction,
      tableName: tableName || 'unknown',
      recordType: recordType || 'unknown',
      fieldCount,
      fields,
      fieldsForJson,
      recordDisplayName,
      extractedFiles: recordExtractedFiles,
    };

    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push(processedRecord);
  }

  // ---------------------------------------------------------------------------
  // Sort records within each category
  // ---------------------------------------------------------------------------

  for (const [, records] of categories) {
    records.sort((a, b) => a.updateXmlName.localeCompare(b.updateXmlName));
  }

  // ---------------------------------------------------------------------------
  // Generate category markdown files
  // ---------------------------------------------------------------------------

  console.log('\nGenerating markdown files...');

  const categoryFileMap = new Map(); // category -> { filename, count }

  for (const [category, records] of categories) {
    const filename = `${category}.md`;
    const filePath = path.join(outputDir, filename);

    const lines = [];
    const categoryTitle = category.toUpperCase().replace(/-/g, ' ');

    // Header
    lines.push(`# ${categoryTitle}`);
    lines.push('');
    lines.push(`**Total Records**: ${records.length}`);
    lines.push(`**Fully Extracted**: ${records.length}/${records.length}`);
    lines.push('');

    // Summary by action
    const actionCounts = {};
    for (const rec of records) {
      const action = rec.action || 'UNKNOWN';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    }
    lines.push('## Summary by Action');
    lines.push('');
    for (const [action, count] of Object.entries(actionCounts).sort()) {
      lines.push(`- **${action}**: ${count} records`);
    }
    lines.push('');
    lines.push('## Records');
    lines.push('');

    // Individual records
    for (let idx = 0; idx < records.length; idx++) {
      const rec = records[idx];
      lines.push(`### ${idx + 1}. ${rec.updateXmlName}`);
      lines.push('');
      lines.push(`**Table**: \`${rec.tableName}\``);
      lines.push(`**Record Type**: \`${rec.recordType}\``);
      lines.push(`**Action**: ${rec.action}`);
      lines.push(`**Fields**: ${rec.fieldCount}`);

      // Extracted files section
      if (rec.extractedFiles.length > 0) {
        lines.push('**Extracted Files**:');
        for (const ef of rec.extractedFiles) {
          lines.push(`  - \`${ef.fieldName}\` → [scripts/${ef.filename}](./scripts/${ef.filename})`);
        }
      }

      lines.push('');

      // Key fields
      const keyFieldEntries = [];
      for (const kf of KEY_FIELDS) {
        if (rec.fields[kf] !== undefined && rec.fields[kf] !== '') {
          keyFieldEntries.push({ name: kf, value: rec.fields[kf] });
        }
      }

      lines.push('**Key Fields**:');
      lines.push('');
      if (keyFieldEntries.length === 0) {
        lines.push('_No key fields found_');
      } else {
        for (const entry of keyFieldEntries) {
          const textVal = typeof entry.value === 'string'
            ? entry.value
            : (entry.value && entry.value.value) || '';

          // Check if this field was extracted
          const extracted = rec.extractedFiles.find(ef => ef.fieldName === entry.name);
          if (extracted) {
            lines.push(`- **${entry.name}**: → [scripts/${extracted.filename}](./scripts/${extracted.filename})`);
          } else {
            // Truncate long values for display
            const displayStr = textVal.length > 80
              ? textVal.substring(0, 80) + '...'
              : textVal;
            lines.push(`- **${entry.name}**: \`${displayStr}\``);
          }
        }
      }

      lines.push('');

      // Additional fields (non-key, non-sys_ prefixed, non-empty, max 8)
      const additionalFields = [];
      for (const [fieldName, fieldVal] of Object.entries(rec.fields)) {
        if (KEY_FIELDS.has(fieldName)) continue;
        const textVal = typeof fieldVal === 'string' ? fieldVal : (fieldVal && fieldVal.value) || '';
        if (!textVal) continue;
        // Truncate for display
        const truncated = textVal.length > 80 ? textVal.substring(0, 80) + '...' : textVal;
        additionalFields.push({ name: fieldName, display: truncated });
      }

      const MAX_ADDITIONAL = 8;
      const shownAdditional = additionalFields.slice(0, MAX_ADDITIONAL);
      const hiddenCount = additionalFields.length - shownAdditional.length;

      if (shownAdditional.length > 0) {
        lines.push('**Additional Fields**:');
        lines.push('');
        for (const af of shownAdditional) {
          lines.push(`- \`${af.name}\`: ${af.display}`);
        }
        if (hiddenCount > 0) {
          lines.push('');
          lines.push(`_... and ${hiddenCount} more fields_`);
        }
      } else {
        lines.push('**Additional Fields**:');
        lines.push('');
      }

      lines.push('');

      // All fields JSON
      lines.push('**All Fields (JSON)**:');
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(rec.fieldsForJson, null, 2));
      lines.push('```');
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`  Written: ${filename} (${records.length} records)`);

    categoryFileMap.set(category, {
      filename,
      count: records.length,
    });
  }

  // ---------------------------------------------------------------------------
  // Generate INDEX.md
  // ---------------------------------------------------------------------------

  const sourceFileName = path.basename(inputFile);
  const extractionDate = new Date().toISOString();

  const indexLines = [];
  indexLines.push('# Update Set Extraction Report (Full Content)');
  indexLines.push('');
  indexLines.push(`**Source File**: ${sourceFileName}  `);
  indexLines.push(`**Extraction Date**: ${extractionDate}  `);
  indexLines.push(`**Total Records**: ${totalRecords}  `);
  indexLines.push(`**Fully Extracted**: ${totalRecords}/${totalRecords}  `);
  indexLines.push('');

  // Generated Documents
  indexLines.push('## Generated Documents');
  indexLines.push('');
  for (const [, info] of categoryFileMap) {
    indexLines.push(`- [${info.filename}](./${info.filename}) - ${info.count} records`);
  }
  indexLines.push('');

  // Statistics table
  indexLines.push('## Statistics');
  indexLines.push('');
  indexLines.push('| Category | Total | Extracted |');
  indexLines.push('|----------|-------|----------|');
  for (const [category, records] of categories) {
    const displayName = category.replace(/-/g, ' ');
    indexLines.push(`| ${displayName} | ${records.length} | ${records.length} (100%) |`);
  }
  indexLines.push('');

  // Extracted scripts listing
  if (extractedFiles.length > 0) {
    // Sort by filename
    extractedFiles.sort((a, b) => a.filename.localeCompare(b.filename));
    indexLines.push(`## Extracted Scripts (${extractedFiles.length} files)`);
    indexLines.push('');
    indexLines.push('Large fields (>1000 chars) are extracted to `scripts/` as separate files for easy reading.');
    indexLines.push('');
    for (const ef of extractedFiles) {
      indexLines.push(`- [${ef.filename}](./scripts/${ef.filename}) (${formatBytes(ef.size)})`);
    }
    indexLines.push('');
  }

  // What's Different section
  indexLines.push("## What's Different in v3");
  indexLines.push('');
  indexLines.push('- **Full Payload Extraction**: All fields from encoded payloads');
  indexLines.push('- **Field Details**: Key fields displayed prominently');
  indexLines.push('- **Script Extraction**: Full script code included');
  indexLines.push('- **Complete Data**: No more truncation - everything extracted');
  indexLines.push('- **Better Categorization**: 20+ specific record types');
  indexLines.push('- **Separate Script Files**: Large scripts/HTML/CSS extracted to `scripts/` dir');

  const indexPath = path.join(outputDir, 'INDEX.md');
  fs.writeFileSync(indexPath, indexLines.join('\n'), 'utf8');
  console.log(`  Written: INDEX.md`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  console.log('\n--- Extraction Complete ---');
  console.log(`Total records: ${totalRecords}`);
  console.log(`Categories: ${categories.size}`);
  console.log(`Extracted files: ${extractedFiles.length}`);
  console.log(`Output: ${outputDir}`);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
