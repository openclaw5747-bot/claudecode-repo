// Lists your Buffer channels so you can copy the X channel's id into wrangler.toml.
// Usage: BUFFER_API_KEY=... npm run buffer:channels

import { gql } from "../src/buffer.js";

const env = { BUFFER_API_KEY: process.env.BUFFER_API_KEY };
if (!env.BUFFER_API_KEY) {
  console.error("Set BUFFER_API_KEY first (Buffer → Settings → API).");
  process.exit(1);
}

const { account } = await gql(env, `{ account { organizations { id name } } }`);
for (const org of account.organizations) {
  const { channels } = await gql(
    env,
    `query($id: OrganizationId!) { channels(input: { organizationId: $id }) { id service displayName name isQueuePaused } }`,
    { id: org.id },
  );
  console.log(`\n${org.name}`);
  for (const c of channels) {
    console.log(`  ${c.service.padEnd(10)} ${c.id}  ${c.displayName ?? c.name}${c.isQueuePaused ? "  (queue paused)" : ""}`);
  }
}
