# Generative Scripts

Store generated and reusable scripts here:

## Categories

### `/implementation/`
Scripts generated during implementation phase:
- Table creation scripts
- Field creation scripts
- Business rule scripts
- Script include code

### `/testing/`
Test scripts for validation:
- Unit test scripts
- Integration test scripts
- Security test scripts
- Performance test scripts

### `/utilities/`
Reusable utility scripts:
- Data migration scripts
- Cleanup scripts
- Diagnostic scripts
- Batch operation scripts

### `/atf/`
ATF test definitions:
- Test suite configurations
- Test step definitions
- Test data setup

## Naming Convention

```
[category]_[name]_[version].js

Examples:
- impl_create_ai_tables_v1.js
- test_clevelandai_unit_v1.js
- util_cleanup_test_data.js
- atf_conversation_flow_test.js
```

## Script Header Template

```javascript
/**
 * Script: [Name]
 * Category: [Implementation|Testing|Utility|ATF]
 * Description: [What this script does]
 *
 * Prerequisites:
 * - [Requirement 1]
 * - [Requirement 2]
 *
 * Usage:
 * SN-Execute-Background-Script({ script: `[paste script]` })
 *
 * Author: [Name]
 * Date: [YYYY-MM-DD]
 * Version: [X.Y]
 */
```
