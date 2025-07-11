# Data Reference - MITRE ATT&CK Visualization

## 📊 Data Overview

### File Information
- **Primary Data**: `mitre.csv` (16KB, 247 lines)
- **Backup Data**: `mitre copy.csv` (24KB, 247 lines)
- **Format**: CSV with 4 columns
- **Encoding**: UTF-8

### Data Structure
```csv
Tactic,TechniqueName,STRIDE,CIA
Reconnaissance,Active Scanning,Information Disclosure,Confidentiality
```

## 🎯 ATT&CK Tactics (14 Categories)

| Tactic | Description | Techniques Count |
|--------|-------------|-----------------|
| **Reconnaissance** | Gathering information to plan future operations | 10 |
| **Resource Development** | Establishing infrastructure and capabilities | 8 |
| **Initial Access** | Gaining initial foothold in target environment | 9 |
| **Execution** | Running malicious code on target systems | 14 |
| **Persistence** | Maintaining access across system restarts | 19 |
| **Privilege Escalation** | Obtaining higher-level permissions | 14 |
| **Defense Evasion** | Avoiding detection by security controls | 42 |
| **Credential Access** | Stealing account names and passwords | 15 |
| **Discovery** | Understanding target environment | 22 |
| **Lateral Movement** | Moving through target environment | 9 |
| **Collection** | Gathering data of interest | 17 |
| **Command and Control** | Communicating with controlled systems | 16 |
| **Exfiltration** | Stealing data from target environment | 9 |
| **Impact** | Manipulating system and data integrity | 13 |

## 🔍 STRIDE Classification (6 Categories)

### 1. Spoofing (S)
**Definition**: Impersonating someone or something else to gain unauthorized access
- **Color**: Blue (#74b9ff)
- **Examples**: Email spoofing, IP spoofing, MAC spoofing
- **Common in**: Initial Access, Defense Evasion, Credential Access

### 2. Tampering (T)
**Definition**: Modifying data or code to achieve malicious goals
- **Color**: Green (#55efc4)
- **Examples**: Code injection, registry modification, file tampering
- **Common in**: Execution, Persistence, Defense Evasion

### 3. Repudiation (R)
**Definition**: Denying responsibility for actions or events
- **Color**: Orange (#fdcb6e)
- **Examples**: Log deletion, audit trail manipulation
- **Common in**: Defense Evasion, Impact

### 4. Information Disclosure (I)
**Definition**: Exposing sensitive information to unauthorized parties
- **Color**: Red (#e17055)
- **Examples**: Data exfiltration, credential dumping, network sniffing
- **Common in**: Reconnaissance, Credential Access, Discovery

### 5. Denial of Service (D)
**Definition**: Preventing legitimate users from accessing resources
- **Color**: Purple (#6c5ce7)
- **Examples**: DDoS attacks, resource exhaustion, service disruption
- **Common in**: Impact, Defense Evasion

### 6. Elevation of Privilege (E)
**Definition**: Gaining higher-level permissions than intended
- **Color**: Yellow (#ffeaa7)
- **Examples**: Privilege escalation, account manipulation, token theft
- **Common in**: Privilege Escalation, Defense Evasion, Persistence

## 🛡️ CIA Framework (6 Categories)

### 1. Confidentiality (C)
**Definition**: Ensuring information is accessible only to authorized users
- **Color**: Blue (#74b9ff)
- **Focus**: Data protection, access control, encryption
- **Threats**: Information disclosure, data breaches, unauthorized access

### 2. Integrity (I)
**Definition**: Maintaining accuracy and consistency of data
- **Color**: Green (#55efc4)
- **Focus**: Data validation, checksums, digital signatures
- **Threats**: Data tampering, unauthorized modifications, corruption

### 3. Availability (A)
**Definition**: Ensuring systems and data are accessible when needed
- **Color**: Orange (#fdcb6e)
- **Focus**: System uptime, redundancy, disaster recovery
- **Threats**: Denial of service, system failures, resource exhaustion

### 4. Authorization (Z)
**Definition**: Controlling access to resources based on user permissions
- **Color**: Orange (#e65100)
- **Focus**: Access control, privilege management, role-based security
- **Threats**: Privilege escalation, unauthorized access, permission bypass

### 5. Authenticity (T)
**Definition**: Verifying the identity and legitimacy of users and data
- **Color**: Purple (#7b1fa2)
- **Focus**: Identity verification, digital signatures, trust validation
- **Threats**: Identity spoofing, credential theft, trust manipulation

### 6. Non-Repudiation (N)
**Definition**: Ensuring that parties cannot deny the authenticity of their actions or communications
- **Color**: Green (#2e7d32)
- **Focus**: Audit trails, digital signatures, proof of origin
- **Threats**: Log deletion, audit manipulation, signature forgery

## 📈 Data Statistics

### Technique Distribution by Tactic
```
Defense Evasion:     42 techniques (17.0%)
Discovery:          22 techniques (8.9%)
Collection:         17 techniques (6.9%)
Command and Control: 16 techniques (6.5%)
Credential Access:   15 techniques (6.1%)
Execution:          14 techniques (5.7%)
Privilege Escalation: 14 techniques (5.7%)
Persistence:        19 techniques (7.7%)
Impact:             13 techniques (5.3%)
Initial Access:      9 techniques (3.6%)
Lateral Movement:    9 techniques (3.6%)
Exfiltration:        9 techniques (3.6%)
Resource Development: 8 techniques (3.2%)
Reconnaissance:     10 techniques (4.0%)
```

### STRIDE Distribution
```
Tampering:           High frequency
Information Disclosure: High frequency
Elevation of Privilege: Medium frequency
Spoofing:            Medium frequency
Denial of Service:   Low frequency
Repudiation:         Low frequency
```

### CIA Distribution
```
Confidentiality:     High frequency
Integrity:           High frequency
Availability:        Medium frequency
Authorization:       Medium frequency
Authenticity:        Low frequency
Non-Repudiation:     Low frequency
```

## 🔗 Common Relationships

### High-Impact Technique Combinations
1. **Initial Access + Persistence**: Establish foothold and maintain access
2. **Credential Access + Lateral Movement**: Steal credentials to move through network
3. **Discovery + Collection**: Understand environment to gather valuable data
4. **Defense Evasion + Execution**: Avoid detection while running malicious code

### STRIDE-CIA Mappings
- **Spoofing** → **Confidentiality** (impersonation breaks access control)
- **Tampering** → **Integrity** (modification affects data accuracy)
- **Information Disclosure** → **Confidentiality** (exposure breaks privacy)
- **Denial of Service** → **Availability** (disruption affects access)
- **Elevation of Privilege** → **Confidentiality** (unauthorized access)
- **Repudiation** → **Integrity** (denial affects accountability)

## 📋 Sample Data Entries

### Reconnaissance Techniques
```csv
Reconnaissance,Active Scanning,Information Disclosure,Confidentiality
Reconnaissance,Gather Victim Host Information,Information Disclosure,Confidentiality
Reconnaissance,Gather Victim Identity Information,Information Disclosure,Confidentiality
Reconnaissance,Gather Victim Network Information,Information Disclosure,Confidentiality
Reconnaissance,Gather Victim Org Information,Information Disclosure,Confidentiality
Reconnaissance,Phishing for Information,Information Disclosure,Confidentiality
Reconnaissance,Search Closed Sources,Information Disclosure,Confidentiality
Reconnaissance,Search Open Technical Databases,Information Disclosure,Confidentiality
Reconnaissance,Search Open Websites/Domains,Information Disclosure,Confidentiality
Reconnaissance,Search Victim-Owned Websites,Information Disclosure,Confidentiality
```

### Defense Evasion Techniques
```csv
Defense Evasion,Abuse Elevation Control Mechanism,Elevation of Privilege,Authorization
Defense Evasion,Access Token Manipulation,Elevation of Privilege,Authorization
Defense Evasion,BITS Jobs,Tampering,Integrity
Defense Evasion,Build Image on Host,Tampering,Integrity
Defense Evasion,Debugger Evasion,Tampering,Integrity
Defense Evasion,Deobfuscate/Decode Files or Information,Tampering,Integrity
Defense Evasion,Deploy Container,Tampering,Integrity
Defense Evasion,Direct Volume Access,Tampering,Integrity
Defense Evasion,Domain or Tenant Policy Modification,Tampering,Integrity
Defense Evasion,Email Spoofing,Spoofing,Authenticity
```

## 🎯 Data Validation Rules

### Required Fields
- **Tactic**: Must be one of the 14 valid ATT&CK tactics
- **TechniqueName**: Non-empty string, unique identifier
- **STRIDE**: Must be one of 6 valid STRIDE categories (or empty)
- **CIA**: Must be one of 6 valid CIA categories (or empty)

### Data Quality Checks
1. **Completeness**: All required fields present
2. **Consistency**: Technique names match ATT&CK framework
3. **Accuracy**: STRIDE/CIA classifications are appropriate
4. **Uniqueness**: No duplicate technique entries

## 🔧 Data Processing Functions

### CSV Parsing
```javascript
function parseCSVData(csvText) {
    const rows = csvText.split('\n').map(row => row.split(','));
    const headers = rows[0];
    const dataRows = rows.slice(1).filter(row => row.length > 1);
    
    return dataRows.map(row => ({
        tactic: row[0].trim(),
        techniqueName: row[1].trim(),
        stride: row[2].trim(),
        cia: row[3].trim()
    }));
}
```

### Data Validation
```javascript
function validateTechnique(technique) {
    const validTactics = [
        'Reconnaissance', 'Resource Development', 'Initial Access',
        'Execution', 'Persistence', 'Privilege Escalation',
        'Defense Evasion', 'Credential Access', 'Discovery',
        'Lateral Movement', 'Collection', 'Command and Control',
        'Exfiltration', 'Impact'
    ];
    
    const validStride = [
        'Spoofing', 'Tampering', 'Repudiation',
        'Information Disclosure', 'Denial of Service', 'Elevation of Privilege'
    ];
    
    const validCia = ['Confidentiality', 'Integrity', 'Availability', 'Authorization', 'Authenticity', 'Non-Repudiation'];
    
    return {
        tacticValid: validTactics.includes(technique.tactic),
        strideValid: !technique.stride || validStride.includes(technique.stride),
        ciaValid: !technique.cia || validCia.includes(technique.cia)
    };
}
```

## 📊 Export Formats

### JSON Structure
```json
{
  "tactics": [
    {
      "name": "Reconnaissance",
      "techniques": [
        {
          "name": "Active Scanning",
          "stride": "Information Disclosure",
          "cia": "Confidentiality"
        }
      ]
    }
  ]
}
```

### Statistics Export
```json
{
  "totalTechniques": 247,
  "tacticsCount": 14,
  "strideDistribution": {
    "Tampering": 85,
    "Information Disclosure": 67,
    "Elevation of Privilege": 45,
    "Spoofing": 23,
    "Denial of Service": 12,
    "Repudiation": 8
  },
  "ciaDistribution": {
    "Confidentiality": 120,
    "Integrity": 95,
    "Availability": 32,
    "Authorization": 45,
    "Authenticity": 15,
    "Non-Repudiation": 8
  }
}
```

---

This data reference provides comprehensive information about the ATT&CK data structure, classifications, and relationships used in the visualization project. 