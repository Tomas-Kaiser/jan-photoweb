import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getPathname, redirect } from "@/app/i18n/routing";
import { db } from "@/app/db";
import { proofGalleries } from "@/app/db/schema";
import { loadFinalsPageContent } from "@/app/lib/finals-page";
import FinalsGalleryClient from "@/app/[locale]/proof/[token]/FinalsGalleryClient";
import FinalsPreviewBar from "./FinalsPreviewBar";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ frame?: string | string[] }>;
};

// The client's finals page as it will look, for the photographer — before
// publishing and behind the registration gate, neither of which the
// client's own link shows. "?frame=1" is the copy shown inside the bar's
// phone-sized frame, without the bar.
export default async function FinalsPreviewPage({
  params,
  searchParams,
}: Props) {
  const { locale, id } = await params;
  const session = await auth();
  const isAdmin =
    !!session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) {
    return redirect({ href: "/", locale });
  }

  const [gallery] = await db
    .select()
    .from(proofGalleries)
    .where(eq(proofGalleries.id, id))
    .limit(1);

  if (!gallery) {
    notFound();
  }

  const content = await loadFinalsPageContent(gallery, locale);
  const inFrame = (await searchParams).frame === "1";
  const previewPath = getPathname({
    href: `/admin/proof-galleries/${id}/finals-preview`,
    locale,
  });

  return (
    <>
      <noscript>
        <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <FinalsGalleryClient
        token={gallery.token}
        {...content}
        linkVerification={null}
        preview
      />
      {inFrame ? null : (
        <FinalsPreviewBar
          galleryId={id}
          frameSrc={`${previewPath}?frame=1`}
        />
      )}
    </>
  );
}
