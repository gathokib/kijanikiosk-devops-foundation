# Nia's Deployment Comparison: Week 7 and Week 8

## Overview

The two delivery approaches solve related but different operational problems. Week 7 focused on keeping a previously validated application environment available while a new release was introduced. Week 8 focused on packaging the application consistently and allowing an orchestrated environment to maintain the required number of running instances. Both approaches improve release confidence, but neither removes the need for testing, monitoring, secure configuration and clear recovery procedures.

## Comparison

| Concern | Week 7 | Week 8 |
|---|---|---|
| Deployment mechanism | Two application environments were maintained, with live traffic directed to the selected version. | A versioned production image was built and two application instances were managed as a desired deployment. |
| Rollback mechanism | Traffic was redirected to the previously healthy environment after the new environment failed its health check. | A prior image version can be selected and redeployed; replacing an instance is separate from reverting an application release. |
| Failure recovery | The monitor detected an unhealthy active environment and initiated a traffic switch. The recorded detection and rollback trigger was approximately 4 seconds from monitor start; fault-injection start was not timestamped. | The orchestrator replaced a deliberately deleted instance and restored readiness in 31 seconds, measured from deletion to replacement readiness. |
| Scaling | Capacity required another application environment and corresponding traffic configuration. | The desired number of application instances can be changed while the service continues selecting healthy instances. |

## Deployment mechanism

In Week 7, two versions of the application could run independently. One environment continued receiving requests while the other was prepared and checked. Once the new version was considered healthy, traffic could be directed to it. This approach reduced the need to replace the live version in place. It also kept the previous version available, which made returning to a known working release straightforward.

In Week 8, the application was packaged with its runtime into a versioned image. The production build used separate build and runtime stages, copied only the compiled application into the final stage, and ran under an unprivileged account. A health check was included so that the container runtime could evaluate application health. The orchestrated deployment requested two replicas, defined resource requests and limits, and included readiness and liveness checks. A service selected the application instances and exposed a stable access point.

## Rollback and failure recovery

The Week 7 recovery method changed where requests were sent. When the active environment failed its health check, the monitor initiated a switch to the previously healthy environment. The earlier comparison recorded approximately four seconds from the start of monitoring to detection and rollback triggering. The exact moment the fault was introduced was not recorded, so this figure should not be presented as a complete fault-to-recovery measurement.

Week 8 demonstrated instance self-healing rather than application-version rollback. One running instance was deliberately deleted. The orchestrator created a replacement, and the replacement became ready 31 seconds after the deletion timestamp. At the end of the test, both desired instances were ready. This shows that an instance failure can be recovered without manually starting a replacement. It does not prove that a faulty application release will be rolled back automatically. Selecting a previous application version remains a separate release decision.

## Image measurements and limitations

The earlier single-stage baseline was recorded at 242 MB of Docker disk usage. The multi-stage production image was recorded at 239 MB, a reduction of approximately 3 MB, or about 1.2 percent. The corresponding content-size measurements were 61.9 MB and 61.4 MB. These are different measurements and should not be compared as if they were interchangeable. The improvement is modest because the application has few dependencies and the build process produces a small compiled output.

The production image did not meet the requested under-100-MB Docker image-size target. The smaller content-size figure does not change that result. The playground build also reported an image size of 168 MB. The production image was pushed to the local registry and a fresh pull succeeded. However, the isolated playground could not reach the laptop's registry. For its deployment test, the image was rebuilt inside the playground and imported into the cluster's container runtime. The registry-based manifest was retained for the submission, but registry authentication and pulling that exact registry image from the playground were not verified.

The service test confirmed two endpoints, NodePort access, internal name resolution and a healthy application response. The self-healing test recorded a 31-second replacement time. These results provide useful evidence, while the image-size target and cross-environment registry access remain limitations.

## What should improve next

The next iteration should reduce the production image below the required size without weakening the runtime or removing necessary functionality. It should also make the registry reachable from the deployment environment, create and validate the required image-pull credentials, and deploy the exact pushed image rather than a locally imported copy. Configuration that changes by environment should be externalized, while credentials should be stored separately from source code. Finally, release rollback and instance self-healing should be tested as separate behaviours so that the team knows which failure each mechanism can recover from.
