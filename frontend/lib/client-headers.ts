import { headers } from "next/headers";

/**
 * The browser's identity, forwarded to the API.
 *
 * Every API call is made by the Next.js server, so without this the API sees one
 * client: the frontend container. Two things break as a result, and the second
 * is not cosmetic.
 *
 *   refresh_tokens.user_agent and .ip_address exist so a person can be shown
 *   their own sessions and recognise one they do not know. Recording "node" and
 *   a container IP on every row makes the columns worthless.
 *
 *   the API rate limits failed sign-ins per IP. With every request arriving from
 *   the same address, ten wrong passwords anywhere would lock out everybody at
 *   once. Forwarding the real address is what makes the bucket per person.
 *
 * x-forwarded-for is passed through rather than appended to. The API runs with
 * `trust proxy` set to 1, meaning it trusts exactly one hop, and that hop is this
 * server. Adding an entry here would shift which address it reads.
 *
 * In development there is no proxy in front of Next, so the header is absent and
 * the API falls back to the socket address, which is this container. That is the
 * honest answer: in development, it really is the only client.
 */
export async function clientForwardHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const forward: Record<string, string> = {};

  const userAgent = incoming.get("user-agent");
  if (userAgent) forward["user-agent"] = userAgent;

  const forwardedFor = incoming.get("x-forwarded-for") ?? incoming.get("x-real-ip");
  if (forwardedFor) forward["x-forwarded-for"] = forwardedFor;

  return forward;
}
