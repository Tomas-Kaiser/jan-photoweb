"use server";

import { revalidatePath } from "next/cache";
import { setMarketingConsent } from "@/app/lib/email-preferences";

// No session here — the signed token in the form is the credential, checked
// again on every change.
export async function updateEmailPreferences(formData: FormData) {
  const saved = await setMarketingConsent(
    formData.get("token"),
    formData.get("subscribed") === "1",
  );

  if (saved) {
    revalidatePath("/[locale]/email-preferences", "page");
  }
}
