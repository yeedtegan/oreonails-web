import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache (R2/KV) for now: every page here is rendered per request (cart, sign-in, studio).
export default defineCloudflareConfig({});
