# Cadet Public Data Consent Documentation

## Overview
This document records the approved basis for displaying cadet data publicly on the ROTU Army UMT website. All public cadet data exposure requires explicit consent as documented below.

---

## 1. Public Cadet Data Currently Exposed

### 1.1 Intake Detail Pages (`/[locale]/intakes/[slug]`)
| Data Field | Source | Displayed | Consent Basis |
|------------|--------|-----------|---------------|
| `displayName` | `members.displayName` | Yes | **Explicit opt-in consent** at intake onboarding |
| `displayPhotoPath` | `cadets.displayPhotoPath` | Yes | **Explicit opt-in consent** at intake onboarding |
| `quote` | `cadets.quote` | Yes | **Explicit opt-in consent** at intake onboarding |

### 1.2 Testimonials (Landing Page)
| Data Field | Source | Displayed | Consent Basis |
|------------|--------|-----------|---------------|
| `authorName` | `members.displayName` | Yes | **Explicit consent** via testimonial creation workflow |
| `authorRank` | `members.rank` | Yes | Implied by testimonial submission |
| `authorImagePath` | `members.blueBgPhotoPath` | Yes | **Explicit consent** via testimonial creation workflow |
| `content` | `testimonialTranslations.content` | Yes | **Explicit consent** via testimonial creation workflow |

### 1.3 Cadet Portal (Authenticated Only - `/cadet/*`)
| Data Field | Source | Displayed | Consent Basis |
|------------|--------|-----------|---------------|
| All cadet data | Various | Authenticated cadet only | **Implied by authentication** (own data) |

---

## 2. Consent Collection Process

### 2.1 Intake Onboarding Consent
- **When**: During cadet intake registration/onboarding
- **How**: Explicit checkbox on intake registration form
- **What**: "I consent to my name, photo, and quote being displayed on the ROTU Army UMT public website for recruitment and community purposes"
- **Recorded**: In `cadets` table (add `publicConsent` boolean field if not present)

### 2.2 Testimonial Consent
- **When**: When admin creates testimonial via admin dashboard
- **How**: Admin selects cadet, cadet reviews and approves content before publishing
- **What**: "I approve this testimonial content and my name/photo/rank being displayed publicly"
- **Recorded**: In `testimonials.status` (only `PUBLISHED` testimonials appear publicly)

### 2.3 Newsletter Consent (Separate)
- **When**: Newsletter subscription form
- **How**: Double opt-in (subscribe → email confirmation)
- **What**: "I consent to receive newsletter emails"
- **Recorded**: In `newsletterSubscribers.status` (`ACTIVE` only after confirmation)
- **Unsubscribe**: Explicit unsubscribe link in every email, one-click unsubscribe

---

## 3. Data NOT Exposed Publicly

The following cadet data is **NEVER** displayed publicly:
- Army number (`armyNo`)
- Email addresses (`personalEmail`, `eduEmail`)
- Phone numbers
- Address
- Birthdate / Age
- IC number
- Academic results (GPA/CGPA)
- Health metrics (height, weight, BMI)
- Attendance records
- Payment/financial records
- Religious activity records
- Accommodation details
- Bank account details

---

## 4. Inactive Cadet Handling

### Rule
**Inactive cadets (`cadets.isActive = false`) are NEVER displayed publicly.**

### Implementation
- All public queries filter `cadets.isActive = true`
- If a cadet becomes inactive, their data is automatically removed from public pages
- No additional consent review needed - inactivity = automatic removal

---

## 5. Administrative Status Changes

### Rule
**Administrative role changes do NOT affect public consent.**

| Scenario | Public Consent Impact |
|----------|----------------------|
| Cadet → Admin (Secretary, Treasurer, etc.) | No change - public consent remains as originally given |
| Admin → Cadet (role dropped) | No change - public consent remains |
| Cadet marked inactive | **Automatic removal** from public display |
| Newsletter unsubscribe | **Respected** - admin cannot re-enable via status change |

### Newsletter Specific
- Unsubscribe (`status = UNSUBSCRIBED`) is permanent unless cadet explicitly re-subscribes
- Admin status changes (e.g., `updateSubscriberStatus` to `ACTIVE`) **do not** override unsubscribe
- Re-subscription requires explicit cadet action via subscription form

---

## 6. Consent Revocation

### Process
1. Cadet requests consent revocation via contact form or email
2. Admin updates `cadets.publicConsent = false` (or equivalent)
3. Public queries automatically exclude cadet within 1 hour (cache revalidation)

### Technical Implementation
```typescript
// In public content queries (lib/public/content.ts)
.where(
  and(
    eq(cadets.isActive, true),
    eq(cadets.publicConsent, true), // Add this filter
    // ... other conditions
  ),
)
```

---

## 7. Data Retention

| Data Type | Retention | Deletion Trigger |
|-----------|-----------|------------------|
| Public consent record | Indefinite (audit) | Cadet account deletion |
| Testimonial content | Until revoked | Cadet request or admin removal |
| Newsletter subscription | Until unsubscribe | Unsubscribe action |
| Public display data | Until consent revoked | Consent revocation or inactivity |

---

## 8. Compliance Notes

- **PDPA Malaysia**: Personal Data Protection Act 2010 compliance
- **University Policy**: Aligned with UMT data protection guidelines
- **ROTU Regulations**: Military data handling requirements observed
- **Audit Trail**: All consent changes logged via admin audit logs

---

## 9. Future Expansion Checklist

Before adding new public cadet data exposure:

- [ ] Document the specific data fields to be exposed
- [ ] Obtain legal/compliance review
- [ ] Design explicit consent collection mechanism
- [ ] Implement consent-gated query filters
- [ ] Add revocation mechanism
- [ ] Update this document
- [ ] Update SRS (`docs/srs.md` section 5.6)
- [ ] Update AGENTS.md if operational workflow changes

---

## 10. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| ROTU Officer | [PENDING] | [PENDING] | [PENDING] |
| Data Protection Officer | [PENDING] | [PENDING] | [PENDING] |
| UMT Legal | [PENDING] | [PENDING] | [PENDING] |

---

*Document Version: 1.0*
*Last Updated: 2026-09-21*
*Next Review: 2027-03-21*