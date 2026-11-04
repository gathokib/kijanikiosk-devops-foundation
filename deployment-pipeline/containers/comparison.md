# KijaniKiosk Deployment Strategy Comparison

## Overview

This project explored two approaches to delivering application updates: Blue/Green deployment and container-based deployment with Kubernetes orchestration. Both approaches aim to improve reliability, reduce service interruptions and make application releases more predictable. However, they solve different parts of the deployment problem.

Blue/Green deployment focuses on controlling which application version receives live traffic. Containerization focuses on packaging an application and its runtime consistently. Kubernetes adds orchestration by managing application instances, health and recovery across a cluster.

## Comparison

| Concern | Blue/Green deployment | Container approach |
|---|---|---|
| Deployment mechanism | Maintains two application environments and switches traffic between them. | Packages the application into a repeatable image and deploys instances from that image. |
| Rollback mechanism | Changes traffic back to the previously healthy environment. | Re-deploys a previous image version or changes the deployment to use that version. |
| Failure recovery | A health monitor detects an unhealthy active environment and triggers a traffic switch. | Orchestration monitors application instances and replaces failed instances to maintain the desired replica count. |
| Scaling | Requires additional environments and traffic configuration to increase capacity. | Allows the desired number of application instances to be increased or decreased through orchestration. |

## Deployment mechanism

The Blue/Green approach used two separate application versions. Blue represented version 1.3.0 and Green represented version 1.4.0. Both versions could run independently, while the reverse proxy directed incoming requests to the selected environment. This allowed the new version to be checked before receiving live traffic. The main advantage is that the previous version remains available during the release.

The container approach packages the application and its required runtime into an image. This makes the application more portable and reduces differences between development and deployment environments. A multi-stage build separates the build environment from the production runtime, so unnecessary build tools are not included in the final application image. The production container also runs as a non-root user and includes a health check.

## Rollback and recovery

Blue/Green rollback was demonstrated by making the active Green application unavailable. The monitoring script detected the failed health check and switched traffic back to Blue. The reverse proxy then returned a healthy response from version 1.3.0. The recorded monitor timestamps show that failure detection and rollback triggering occurred within approximately four seconds of monitoring starting. This is not the full fault-to-recovery duration because the exact time the fault was introduced was not recorded.

The container approach uses a different recovery model. Kubernetes can maintain a desired number of application replicas and replace a failed Pod. This helps restore application capacity without requiring an operator to manually start another instance. However, replacing a failed Pod does not automatically guarantee that the application itself is functioning correctly or that a previous application version should be restored. Version rollback remains a separate deployment decision.

## Measured results and limitations

The production image was reported by Docker with a content size of 61.4 MB and disk usage of approximately 239 MB. These are different measurements and should not be treated as interchangeable. The content size is below 100 MB, but the unpacked disk usage is above that threshold. A single-stage baseline image was not measured, so an image-size reduction percentage cannot honestly be calculated.

Kubernetes self-healing time was also not measured because a cluster was not deployed and tested in this environment. The Deployment and Service configurations were created, but Pod readiness, replacement time, service endpoints and in-cluster DNS resolution remain unverified. These limitations are important when interpreting the results: configuration files demonstrate the intended design, not a successful cluster deployment.

## What containers do not solve

Containers do not automatically provide reliable releases, secure infrastructure, application availability or correct business behaviour. An image can package a faulty application just as easily as a healthy one. Containers also do not independently decide when a release is safe, whether a payment provider is available, or whether a rollback is appropriate. Monitoring, testing, access control, secrets management and operational ownership are still necessary.

The Blue/Green exercise demonstrated the value of keeping a known healthy version available and verifying traffic after a switch. The container exercise demonstrated consistent packaging, a non-root runtime and health checking. These practices complement each other rather than replace each other.

## Next project

The next Kubernetes orchestration project should deploy the application to a functioning cluster, configure registry access securely, verify that both replicas become ready, and test replacement of a deleted Pod while recording actual timestamps. It should also verify NodePort access, service discovery and application health. Configuration values that differ between environments should be externalized, while sensitive values should be stored in Kubernetes Secrets or an appropriate secret-management system. Finally, a future iteration should measure a single-stage baseline against the production image using the same measurement method.
