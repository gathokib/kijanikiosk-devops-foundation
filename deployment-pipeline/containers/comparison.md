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

Both the multi-stage production image and the single-stage baseline were built successfully using the same Node 22 Alpine base image and application. Docker reported the following measurements:

| Measurement | Multi-stage | Single-stage |
|---|---:|---:|
| Disk usage | 239 MB | 242 MB |
| Content size | 61.4 MB | 61.9 MB |

The multi-stage image was approximately 3 MB smaller in disk usage and 0.5 MB smaller in content size. This represents a modest improvement rather than a major reduction. The small difference is expected because this application has no declared external dependencies and its build process simply copies one JavaScript file into the distribution directory. Both images were built, and the single-stage baseline successfully returned a healthy response through its health endpoint. Docker's disk usage and content size are different measurements and should not be treated as interchangeable.

Kubernetes was tested in a remote Killercoda cluster using a ConfigMap-mounted copy of the application source and the public `node:22-alpine` image. The Deployment reached 2/2 available replicas, and both application Pods reported 1/1 Ready with zero restarts. A ClusterIP Service exposed port 3001 and forwarded traffic to container port 3000. Its endpoints included both application Pod IP addresses. An in-cluster Node.js HTTP request using the Service DNS name returned HTTP 200 and a healthy application response for version 1.0.0.

The Kubernetes test did not use the locally built production image or verify access to the project's local container registry. Pod replacement was not tested because the remote lab session expired before the planned deletion test. Consequently, Kubernetes replica readiness, Service endpoint discovery, internal DNS resolution and application connectivity were verified, but Pod replacement and self-healing recovery time remain unverified. These limitations are important when interpreting the results.

## What containers do not solve

Containers do not automatically provide reliable releases, secure infrastructure, application availability or correct business behaviour. An image can package a faulty application just as easily as a healthy one. Containers also do not independently decide when a release is safe, whether a payment provider is available, or whether a rollback is appropriate. Monitoring, testing, access control, secrets management and operational ownership are still necessary.

The Blue/Green exercise demonstrated the value of keeping a known healthy version available and verifying traffic after a switch. The container exercise demonstrated consistent packaging, a non-root runtime and health checking. These practices complement each other rather than replace each other.

## Next project

A future Kubernetes iteration should configure secure access to the production image registry, deploy the exact production image, and test replacement of a deleted Pod while recording recovery timestamps. It could also verify external access through NodePort and compare the behaviour of the production image with the ConfigMap-based lab deployment. Configuration values that differ between environments should be externalized, while sensitive values should be stored in Kubernetes Secrets or an appropriate secret-management system. The single-stage baseline has now been built and measured. A future iteration could explore a more dependency-heavy application to demonstrate a more substantial benefit from separating build and runtime stages.
