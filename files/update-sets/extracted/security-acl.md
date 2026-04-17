# SECURITY ACL

**Total Records**: 3
**Fully Extracted**: 3/3

## Summary by Action

- **INSERT_OR_UPDATE**: 3 records

## Records

### 1. sys_security_acl_00979f983b363654d0e9da6aa5e45a3a

**Table**: `sys_security_acl`
**Record Type**: `sys_security_acl`
**Action**: INSERT_OR_UPDATE
**Fields**: 26

**Key Fields**:

- **name**: `u_m2m_skill_endorsement`
- **active**: `true`
- **sys_name**: `u_m2m_skill_endorsement`

**Additional Fields**:

- `admin_overrides`: true
- `advanced`: false
- `decision_type`: allow
- `local_or_existing`: Existing
- `operation`: read
- `sys_class_name`: sys_security_acl
- `sys_created_by`: ZITZERN2
- `sys_created_on`: 2026-01-28 20:14:06

_... and 8 more fields_

**All Fields (JSON)**:

```json
{
  "active": "true",
  "admin_overrides": "true",
  "advanced": "false",
  "applies_to": "",
  "condition": "",
  "controlled_by_refs": "",
  "decision_type": "allow",
  "description": "",
  "local_or_existing": "Existing",
  "name": "u_m2m_skill_endorsement",
  "operation": {
    "value": "read",
    "attributes": {
      "display_value": "read"
    }
  },
  "script": "",
  "security_attribute": "",
  "sys_class_name": "sys_security_acl",
  "sys_created_by": "ZITZERN2",
  "sys_created_on": "2026-01-28 20:14:06",
  "sys_id": "00979f983b363654d0e9da6aa5e45a3a",
  "sys_mod_count": "0",
  "sys_name": "u_m2m_skill_endorsement",
  "sys_package": {
    "value": "global",
    "attributes": {
      "display_value": "Global",
      "source": "global"
    }
  },
  "sys_policy": "",
  "sys_scope": {
    "value": "global",
    "attributes": {
      "display_value": "Global"
    }
  },
  "sys_update_name": "sys_security_acl_00979f983b363654d0e9da6aa5e45a3a",
  "sys_updated_by": "ZITZERN2",
  "sys_updated_on": "2026-01-28 20:14:06",
  "type": {
    "value": "record",
    "attributes": {
      "display_value": "record"
    }
  }
}
```

---

### 2. sys_security_acl_80979f983b363654d0e9da6aa5e45a25

**Table**: `sys_security_acl`
**Record Type**: `sys_security_acl`
**Action**: INSERT_OR_UPDATE
**Fields**: 26

**Key Fields**:

- **name**: `u_m2m_skill_endorsement`
- **active**: `true`
- **sys_name**: `u_m2m_skill_endorsement`

**Additional Fields**:

- `admin_overrides`: true
- `advanced`: false
- `decision_type`: allow
- `local_or_existing`: Existing
- `operation`: create
- `sys_class_name`: sys_security_acl
- `sys_created_by`: ZITZERN2
- `sys_created_on`: 2026-01-28 20:14:06

_... and 8 more fields_

**All Fields (JSON)**:

```json
{
  "active": "true",
  "admin_overrides": "true",
  "advanced": "false",
  "applies_to": "",
  "condition": "",
  "controlled_by_refs": "",
  "decision_type": "allow",
  "description": "",
  "local_or_existing": "Existing",
  "name": "u_m2m_skill_endorsement",
  "operation": {
    "value": "create",
    "attributes": {
      "display_value": "create"
    }
  },
  "script": "",
  "security_attribute": "",
  "sys_class_name": "sys_security_acl",
  "sys_created_by": "ZITZERN2",
  "sys_created_on": "2026-01-28 20:14:06",
  "sys_id": "80979f983b363654d0e9da6aa5e45a25",
  "sys_mod_count": "0",
  "sys_name": "u_m2m_skill_endorsement",
  "sys_package": {
    "value": "global",
    "attributes": {
      "display_value": "Global",
      "source": "global"
    }
  },
  "sys_policy": "",
  "sys_scope": {
    "value": "global",
    "attributes": {
      "display_value": "Global"
    }
  },
  "sys_update_name": "sys_security_acl_80979f983b363654d0e9da6aa5e45a25",
  "sys_updated_by": "ZITZERN2",
  "sys_updated_on": "2026-01-28 20:14:06",
  "type": {
    "value": "record",
    "attributes": {
      "display_value": "record"
    }
  }
}
```

---

### 3. sys_security_acl_c097131c3b323654d0e9da6aa5e45ac8

**Table**: `sys_security_acl`
**Record Type**: `sys_security_acl`
**Action**: INSERT_OR_UPDATE
**Fields**: 26

**Key Fields**:

- **name**: `sys_user_has_skill.u_interest_level`
- **active**: `true`
- **sys_name**: `sys_user_has_skill.u_interest_level`
- **condition**: `userDYNAMIC90d1921e5f510100a9ad2572f2b477fe`

**Additional Fields**:

- `admin_overrides`: true
- `advanced`: false
- `decision_type`: allow
- `local_or_existing`: Existing
- `operation`: write
- `sys_class_name`: sys_security_acl
- `sys_created_by`: ZITZERN2
- `sys_created_on`: 2026-01-28 20:14:05

_... and 8 more fields_

**All Fields (JSON)**:

```json
{
  "active": "true",
  "admin_overrides": "true",
  "advanced": "false",
  "applies_to": "",
  "condition": {
    "value": "userDYNAMIC90d1921e5f510100a9ad2572f2b477fe",
    "attributes": {
      "table": "sys_user_has_skill.u_interest_level"
    }
  },
  "controlled_by_refs": "",
  "decision_type": "allow",
  "description": "",
  "local_or_existing": "Existing",
  "name": "sys_user_has_skill.u_interest_level",
  "operation": {
    "value": "write",
    "attributes": {
      "display_value": "write"
    }
  },
  "script": "",
  "security_attribute": "",
  "sys_class_name": "sys_security_acl",
  "sys_created_by": "ZITZERN2",
  "sys_created_on": "2026-01-28 20:14:05",
  "sys_id": "c097131c3b323654d0e9da6aa5e45ac8",
  "sys_mod_count": "0",
  "sys_name": "sys_user_has_skill.u_interest_level",
  "sys_package": {
    "value": "global",
    "attributes": {
      "display_value": "Global",
      "source": "global"
    }
  },
  "sys_policy": "",
  "sys_scope": {
    "value": "global",
    "attributes": {
      "display_value": "Global"
    }
  },
  "sys_update_name": "sys_security_acl_c097131c3b323654d0e9da6aa5e45ac8",
  "sys_updated_by": "ZITZERN2",
  "sys_updated_on": "2026-01-28 20:14:05",
  "type": {
    "value": "record",
    "attributes": {
      "display_value": "record"
    }
  }
}
```

---
