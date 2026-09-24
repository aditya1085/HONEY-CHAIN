# Honey Chain Security Specification & Hardening Matrix

## 1. Data Invariants
1. **Admin Master Gate**: The `/admins/{adminId}` collection is read-only for authenticated users and writable only by admin accounts or bootstrap initializers. Role checks rely on document existence `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or the bootstrapped admin email `adityatripathi1085@gmail.com`.
2. **Beekeeper Profile Integrity**:
   - Only the authenticated owner can create their initial beekeeper registration (`incoming().userId == request.auth.uid`).
   - A non-admin cannot self-assign status `approved`, cannot set `beekeeperId`, and cannot approve themselves.
   - Updates to status, `rejectionReason`, `approvedBy`, `approvedAt`, and `beekeeperId` can ONLY be performed by an admin.
   - Sensitive fields: Aadhaar full number must NEVER be stored; only `aadhaarLast4` (4 digits) and `aadhaarHash` are accepted.
3. **Counters Security**:
   - `/counters/{counterId}` can only be read or modified by authenticated verified accounts via server/admin transactions or authenticated beekeeper operations strictly for ID incrementation. Direct client arbitrary resets or negative decrements are blocked.
4. **Hive Entity Integrity**:
   - Hives must belong to an approved beekeeper (`beekeeperId`).
   - `hiveId` is immutable once set and cannot be tampered with.
5. **Activity Log Append-Only**:
   - Activity logs can only be created with `actorId == request.auth.uid` (or admin). They cannot be modified or deleted by regular clients.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Self-Approval Privilege Escalation)**: Regular user attempts to set `status: "approved"` and assign themselves `beekeeperId: "B001"` on create.
2. **Payload 2 (Ghost Field Attack)**: Malicious user injects undeclared administrative attributes `isAdmin: true` into their user profile.
3. **Payload 3 (Identity Spoofing in Beekeeper Registration)**: Attacker registers a beekeeper document using victim's `userId: "victim_user_123"`.
4. **Payload 4 (Aadhaar Data Exfiltration / PII Infiltration)**: Attacker submits a full 12-digit Aadhaar number instead of 4 digits.
5. **Payload 5 (Path Variable / ID Poisoning)**: Attacker attempts to write to `/beekeepers/<script>alert(1)</script>` or a 2KB junk string ID.
6. **Payload 6 (Terminal State Tampering)**: Regular user tries to overwrite a rejected or suspended beekeeper profile back to `approved`.
7. **Payload 7 (Unbounded Counter Tampering)**: Attacker sets `/counters/beekeepers` sequence directly to `-9999` or `9999999`.
8. **Payload 8 (Activity Log Forgery)**: Attacker creates an activity log impersonating another `actorId`.
9. **Payload 9 (Activity Log Deletion)**: Attacker tries to wipe the audit trail via `deleteDoc` on `/activityLogs/{logId}`.
10. **Payload 10 (Denial of Wallet String Injection)**: Attacker writes a 1MB payload in `address` or `name`.
11. **Payload 11 (Unauthenticated Hive Creation)**: Guest user attempts to register a hive without authentication.
12. **Payload 12 (Admin Bypass with Unverified Email)**: Attacker creates an unverified account with admin's email and tries to bypass admin endpoints without token verification.

---

## 3. Test Runner & Verification Assertions
All 12 malicious payloads must be rejected with `PERMISSION_DENIED` by Firestore rules and client validation guards.
