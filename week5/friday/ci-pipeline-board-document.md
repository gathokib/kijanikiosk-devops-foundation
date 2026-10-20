# KijaniKiosk CI Pipeline
## Board-Ready Delivery Brief for Nia

### Executive summary

KijaniKiosk has an automated Continuous Integration (CI) pipeline for its payments package. Jenkins validates source code, builds a versioned package, verifies quality and dependency security, archives the artifact, and publishes it to the Nexus npm hosted repository.

A successful end-to-end run published `kijanikiosk-payments@1.0.0-76e4eb8`. Five independent fault-injection tests also demonstrated that failures at the configured pipeline stages prevent an unsuccessful release from proceeding.

### Pipeline design

| Stage | Purpose | Release control |
|---|---|---|
| Lint | Check source-code quality and style | Stop if checks fail |
| Build | Install dependencies and build a commit-versioned package | Stop if the build fails |
| Verify | Run tests and a security audit in parallel | Require successful verification |
| Archive | Create and fingerprint the package artifact | Stop if archiving fails |
| Publish | Publish the package to Nexus | Publish only after earlier stages pass |

The package version combines the base semantic version with a short Git commit SHA. This helps associate a published package with the source revision used to build it. The archive stage retains the package tarball and relevant build evidence for later inspection.

### Quality and security controls

The pipeline runs automated tests and an npm dependency audit. The latest successful run reported zero vulnerabilities through the configured audit command. This is useful evidence about the dependencies checked at that point in time, but it does not prove the application has no security weaknesses.

Publishing uses a Jenkins credential named `nexus-publisher`, accessed through credential binding rather than hardcoded credentials in the Jenkinsfile. The publishing stage creates a temporary npm configuration for authentication and removes it when the shell operation exits. This reduces the risk of leaving authentication configuration in the workspace. The team should still verify secret masking, account permissions, access restrictions, and credential rotation.

### What Happens When Something Goes Wrong

Five independent runs injected a failure into Lint, Build, Verify, Archive, and Publish. Each run ended with the expected failure status, and subsequent delivery stages were skipped where applicable. During the Verify test, the parallel security-audit branch completed and reported zero vulnerabilities, even though the test branch failed.

Post-build actions continued to execute after failures. They report the result, record JUnit results when available, and clean the workspace. A later run with `FAIL_STAGE=None` completed all five stages, including Publish, and finished with `SUCCESS`.

This behavior reduces the chance that a package will be released after a required quality gate fails. It also demonstrates recovery from the tested, deliberately injected failures. It does not establish that every possible infrastructure or service failure will recover in the same way.

### Business value

The pipeline makes package delivery more repeatable and creates evidence of the checks performed before publication. Automated gates can catch defects earlier, reduce manual release effort, and make delivery more traceable. Nexus provides a central repository for versioned artifacts, supporting consistent distribution and better-informed rollback decisions.

### Remaining risks and recommendations

The team should complete the following actions before treating the pipeline as a mature release control:

- Confirm that at least two distinct package versions are published and visible in Nexus.
- Verify that the Nexus publishing account has only the permissions it needs.
- Inspect repository history and build logs for accidental secret exposure.
- Review dependency-audit findings regularly and define remediation deadlines.
- Monitor pipeline duration, failure rates, and publication errors.
- Retain sufficient release evidence to trace packages back to source commits.

### Scope and conclusion

The evidence demonstrates a successful pipeline run and the expected behavior of five configured failure injections. It does not prove resilience to every outage, eliminate all security risks, or replace production monitoring and access-control reviews.

**Recommendation:** Accept this as a working CI foundation, subject to completion of the remaining submission evidence, verification of a second distinct Nexus package version, and review through a pull request from `feature/week5-ci-pipeline` into `develop`.
