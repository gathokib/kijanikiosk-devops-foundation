# Week 5 Reflection

## 1. A decision or tension between requirements

One tension I encountered was between isolating the build in a Docker agent and allowing that agent to reach the Nexus registry. Using localhost inside the agent would refer to the container itself rather than the Nexus service. I prioritised environment isolation without sacrificing delivery, so I connected the agent to the Docker network where Nexus was reachable by its service hostname. I verified the approach through a successful package publication. Another important lesson was that rerunning the same commit produces the same commit-derived package version. A successful rerun alone therefore does not demonstrate version uniqueness across different commits; a second distinct version must be published and verified.

## 2. Translating a board-level sentence into technical language

Board-level sentence: "A package is not published when an earlier required stage fails."

Technical version: "The declarative pipeline fails fast: an unsuccessful Lint, Build, Verify, or Archive stage prevents the Publish stage from executing."

The meaning is the same in both versions: a package must pass the required checks before publication. The board-level sentence focuses on the business safeguard and avoids implementation terminology. The technical version identifies the stages and explains the pipeline's control flow more precisely.

## 3. What would break first if the team grew from four developers to forty?

The first likely constraint would be the capacity of the single Jenkins VM and its Docker build environment. More developers could trigger more builds at once, competing for CPU, memory, disk space, and network capacity. Build queues and longer execution times could make feedback less useful. I would measure queue time, build duration, resource usage, and failure rates before scaling. I would then move builds to appropriately sized, isolated agents that can scale with demand, while keeping credentials scoped and artifacts stored centrally in Nexus. I would also review concurrency controls and ensure that simultaneous builds cannot overwrite shared workspaces or publish conflicting versions.
