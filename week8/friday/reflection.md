# Week 8 Reflection

## 1. Hardest CI/CD step to automate reliably

The hardest step was keeping the image version consistent across the build, registry and deployment stages. A successful build does not guarantee that the cluster can retrieve the same image. A tag can be mistyped, generated from the wrong commit, or point to an older image. Registry reachability and image-pull credentials add another failure point. The failure I feared most was a deployment reporting success while running an outdated application version. The practical safeguard is to generate the tag from the package version and short commit SHA, record the registry digest, verify a fresh pull, and check the running application's reported version after deployment.

## 2. Rewriting a plain-language Nia sentence technically

Plain language: "If the new release stops working, send users back to the last healthy release."

Technical rewrite: "When the active environment fails its configured health check, the monitor changes the traffic target to the previously validated environment and verifies that the health endpoint responds successfully."

The technical version gains precision: it identifies the trigger, the traffic change, the fallback target and the verification step. It is useful to an engineer implementing or troubleshooting the release process. What it loses is immediacy. A non-technical reader may understand the plain-language sentence faster because it focuses on the outcome rather than the mechanism. Both versions are useful for different audiences.

## 3. Values that should be externalized

Environment-specific values such as the listening port, runtime mode, replica count, resource requests and limits, probe timing, and image tag should be configurable rather than scattered through application and deployment definitions. Non-sensitive settings belong in a ConfigMap or an environment-specific configuration layer. Credentials, registry authentication data, payment-provider keys and database passwords belong in a Secret or a dedicated secret manager. Committing credentials exposes systems to unauthorized access; hardcoding environment-specific values makes promotion between development, test and production error-prone. The deployment should reference secrets by name without storing their contents in source control.
