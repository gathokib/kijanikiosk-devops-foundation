# Post-Incident Review: Investor Demo Deployment

## 1. Summary for Nia

During an investor demonstration, the deployment process directed traffic to the wrong application environment while staging was unavailable for 48 seconds. The service was restored, but the incident exposed weaknesses in environment selection, deployment safeguards and pre-demo verification.

## 2. Reconstructed timeline

*All times below are estimates reconstructed from the incident account, not verified timestamps.*

| Event | Reconstructed time |
|---|---|
| Deployment preparation began | T+0 |
| Pipeline selected the incorrect target environment | T+10s |
| Staging became unavailable | T+15s |
| Environment selection and routing were investigated | T+30s |
| Staging service was restored | T+63s |
| Service availability confirmed | T+63s |

Total reported staging interruption: 48 seconds.

## 3. Root cause analysis — Five Whys

1. **Why was the wrong environment targeted?** The deployment process selected an incorrect environment.
2. **Why could it select the incorrect environment?** Environment selection was not sufficiently protected by explicit validation.
3. **Why was validation insufficient?** The deployment workflow relied too heavily on configuration and operator assumptions.
4. **Why were those assumptions not caught?** There was no mandatory independent environment verification before traffic switching.
5. **Why was that safeguard absent?** The deployment process had evolved around successful execution rather than formally defined release controls.

**Structural root cause:** Inadequate deployment governance and automated environment validation.

## 4. Contributing factors

- Environment selection was not independently verified before deployment.
- Staging availability was not confirmed as a release prerequisite.
- The demonstration increased pressure to complete deployment quickly.
- Rollback and recovery procedures needed stronger pre-release validation.

## 5. What went well

- The interruption was limited to 48 seconds.
- The team investigated the routing issue and restored staging.
- The incident exposed specific improvements that can strengthen future deployments.

## 6. Corrective and preventive actions

| Action | Owner | Deadline |
|---|---|---|
| Add an explicit target-environment validation before every deployment | DevOps Engineer | Within 7 days |
| Add staging health checks as a deployment prerequisite | DevOps Engineer | Within 7 days |
| Require a pre-demo deployment and rollback rehearsal | Release Lead | Before the next investor demo |
| Document environment recovery and escalation procedures | Operations Lead | Within 14 days |

Review completion of these actions at the next deployment retrospective.
