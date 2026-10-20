# KijaniKiosk CI Pipeline — Fault Injection Log

## Test purpose

Each pipeline stage was independently configured to fail using the Jenkins `FAIL_STAGE` parameter. The observed results below are based on the five test runs completed before the final Jenkinsfile cleanup update.

## Results

| Injected stage | Observed result | Downstream behaviour | Design rationale |
|---|---|---|---|
| Lint | `FAILURE`; `Injected failure: Lint` | Build, Verify, Archive and Publish skipped | Invalid or non-compliant code must be stopped before build resources are spent. |
| Build | `FAILURE`; `Injected failure: Build` | Verify, Archive and Publish skipped | An unsuccessful build cannot produce a trustworthy package for verification or release. |
| Verify | `FAILURE`; `Injected failure: Verify` in Test; Security Audit completed with zero reported vulnerabilities | Archive and Publish skipped | A package must not be released when required tests fail, even if the parallel security check succeeds. |
| Archive | `FAILURE`; `Injected failure: Archive` | Publish skipped | Publishing must stop if the expected versioned artifact has not been successfully archived. |
| Publish | `FAILURE`; `Injected failure: Publish` | No later delivery stage; post-build actions ran | A publication failure must be reported clearly rather than treated as a successful release. |

## Cleanup and recovery

All five injected runs ended with `FAILURE` at the intended stage. Post-build actions ran, including cleanup; JUnit warnings in early-stage failures were expected when tests had not produced a report.

After the five tests, a run with `FAIL_STAGE=None` completed Lint, Build, Verify, Archive and Publish successfully. The package `kijanikiosk-payments@1.0.0-76e4eb8` was published to Nexus, the security audit reported zero vulnerabilities, and the build finished with `SUCCESS`.

## Scope

These tests demonstrate the configured failure paths and downstream stage-skipping behaviour. They do not prove that every infrastructure outage or real-world security incident will behave identically. The updated Jenkinsfile must also complete a fresh green run before final submission.
