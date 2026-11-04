# KijaniKiosk Deployment Demonstration

## 1. Introduction

[Stage direction: Show the current application running on the Blue environment.]

**Spoken:** "KijaniKiosk is designed to keep payments available while updates are introduced. Today, I'll demonstrate how we release a new version and recover if something goes wrong."

## 2. Deploy the new version

[Stage direction: Show the Green environment running version 1.4.0 and confirm its health.]

**Spoken:** "We have prepared an updated version alongside the existing service. Before sending customers to it, we confirm that it is healthy."

## 3. Switch traffic

[Stage direction: Run the environment switch and show the application responding with version 1.4.0.]

**Spoken:** "We can now move customer traffic to the updated version without taking the entire service offline."

## 4. Introduce a controlled fault

[Stage direction: Stop the Green application and show the monitoring output.]

**Spoken:** "Now we'll simulate a service failure. The monitoring process detects that the updated version is no longer healthy."

## 5. Automatic rollback

[Stage direction: Show the rollback message, Blue environment state and application response.]

**Spoken:** "The system automatically returns traffic to the previous healthy version. Customers can continue using the service while the issue is investigated."

## 6. Business value

[Stage direction: Show the final health response and rollback evidence.]

**Spoken:** "This approach reduces deployment risk, shortens recovery time and gives the team a safer way to release improvements. It helps protect customer confidence and business continuity."
