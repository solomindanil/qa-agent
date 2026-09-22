# Controller attempts

- Initial `prepare.mts` invocation in the filesystem/network sandbox failed
  before binding any server or creating a managed workspace:
  `listen EPERM: operation not permitted 127.0.0.1`, exit 1, Node 22.23.1.
  The same unchanged script then started with scoped escalation for local-only
  fixture listeners and temporary registration/publication writes. This is an
  environment boundary, not an API oracle RED or product failure.
- Read-only `ps` inspection was unavailable (`operation not permitted: ps`);
  progress was inspected using generated files and the owned execution session.
- Registrations use the current Console's existing `registerAuthoredFixture`
  helper and Kernel APIs. The helper uses deterministic synthetic actors/clock
  and discovery inputs. This exercise does not qualify qa-init HTTP onboarding
  or actual independently discovered requirements.
- Source is unchanged. Root packaging gate: exit 0, 61 passed, zero failed,
  cancelled, skipped or todo; complete command output in root-gate.tap.
