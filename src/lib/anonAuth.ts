import { supabase } from "@/integrations/supabase/client";

let ensurePromise: Promise<void> | null = null;

export function ensureAnonSession(): Promise<void> {
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error("Anonymous sign-in failed:", error);
    }
  })();
  return ensurePromise;
}
