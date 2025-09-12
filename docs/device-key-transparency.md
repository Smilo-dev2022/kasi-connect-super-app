Device key transparency – overview and first steps

Goal

Provide cryptographic verifiability that a user’s device keys match what the server advertises.

Initial approach (Day 1)

- Publish a per-user key manifest (append-only) with:
  - user_id, device_id, device_public_key, created_at, revoked_at
- Maintain an auditable transparency log root (Merkle tree) for batches.
- Expose `/keys/transparency` endpoint providing latest tree head and proofs for a given user.

Client verification stub

- Fetch manifest and proof.
- Verify inclusion proof against signed tree head.
- Check device key matches the one used in sessions.
- Record last verified tree head for pinning.

Threats and mitigations

- Ghost device insertion: mitigated by public, auditable log and client pinning.
- Key substitution: inclusion proof and signature check.
- Rollback: pin the latest verified tree head per user and enforce monotonicity.

Next steps

- Implement server-side log structure and signing.
- Add independent auditor fetch and comparison.

