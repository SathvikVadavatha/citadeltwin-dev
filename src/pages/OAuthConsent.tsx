import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth/login?returnTo=" + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error: decisionError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decisionError) {
      setBusy(false);
      setError(decisionError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <img src={"/citadeltwin-logo.png"} alt="CitadelTwin" className="h-[48px] w-auto max-w-[11rem] object-contain" />
          </div>
          {error ? (
            <>
              <CardTitle>Authorization failed</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          ) : !details ? (
            <>
              <CardTitle>Loading…</CardTitle>
              <CardDescription>Checking this authorization request.</CardDescription>
            </>
          ) : (
            <>
              <CardTitle>Connect {details.client?.name ?? "an app"} to your account</CardTitle>
              <CardDescription>
                This lets {details.client?.name ?? "the client"} read and act on your CitadelTwin
                projects, blueprint uploads and compliance data as you.
              </CardDescription>
            </>
          )}
        </CardHeader>
        {details && !error && (
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>You can revoke this access at any time from your account settings.</span>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => decide(false)}
              >
                Deny
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
