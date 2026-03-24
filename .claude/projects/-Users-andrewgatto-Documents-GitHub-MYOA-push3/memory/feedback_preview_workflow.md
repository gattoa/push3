---
name: Preview mock data workflow
description: Don't revert mock data between iterations — wait until the feature is complete to avoid wasted server restarts
type: feedback
---

When iterating on a preview state (like the completion summary card), keep the mock data in the state being worked on until the feature is finalized. Don't revert between each tweak.

**Why:** Each revert requires a server restart (HMR websocket is unreliable), which wastes time and resources.

**How to apply:** Only revert mock data once the user has approved the final state of the feature being previewed.
