import { requestHost } from "~/lib/domains";
import { domainProof } from "~/server/domains";

/**
 * Proves a domain reaches this deployment. Admin → Domains fetches it on the
 * domain being verified and checks the signature (checkDomain).
 */
export function GET(request: Request) {
  const nonce = new URL(request.url).searchParams.get("nonce");
  if (!nonce || nonce.length > 100) {
    return Response.json({ error: "Missing nonce" }, { status: 400 });
  }
  return Response.json(
    { proof: domainProof(requestHost(request.headers), nonce) },
    { headers: { "cache-control": "no-store" } },
  );
}
