# KijaniKiosk Payments — SLI and SLO Policy

## 1. Service Level Indicators (SLIs)

| SLI | Data source | Calculation | Measurement window |
|---|---|---|---|
| Availability | HTTP health-check and request logs | Successful HTTP requests / Total valid requests × 100 | Rolling 5 minutes |
| Latency | Application request-duration logs | Percentage of requests completed within 500 ms | Rolling 5 minutes |
| Payment error rate | Payment application logs | Failed payment requests / Total payment requests × 100 | Rolling 5 minutes |

## 2. Service Level Objectives (SLOs)

These are proposed operational targets for the payments service over a rolling 30-day period.

| SLI | 30-day SLO |
|---|---|
| Availability | At least 99.9% |
| Latency | At least 95% of requests complete within 500 ms |
| Payment error rate | No more than 1% |

## 3. Automated rollback thresholds

The following short-window thresholds trigger investigation and automated rollback when the new environment is responsible.

| SLI | Short-window threshold | Relationship to SLO |
|---|---|---|
| Availability | Below 99% over 5 minutes | A significant deterioration from the 99.9% monthly objective |
| Latency | Less than 90% of requests complete within 500 ms over 5 minutes | A breach of the 95% monthly objective |
| Payment error rate | Above 5% over 5 minutes | Five times the maximum monthly error-rate objective |

The deployment monitor currently implements an active-environment health check and rollback. The additional SLI thresholds above are policy targets, not yet implemented automated triggers.

## 4. What we do not commit to

- **Third-party payment provider availability:** External providers operate outside the direct control of the KijaniKiosk team.
- **Customer network performance:** Internet connectivity and customer device conditions cannot be guaranteed by the payments service.
- **Business outcomes:** Successful transactions depend on factors beyond service availability, including payment authorization and customer account status.

## 5. Review

Review these objectives monthly and after significant incidents. Adjust thresholds using actual production measurements rather than assumptions.
