import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/app/db";
import { clients, galleryClients, proofGalleries } from "@/app/db/schema";
import { groupContacts, type Contact } from "@/app/lib/admin-contacts";

// Every client with the galleries they're linked to, newest client first,
// for the admin contacts screen and its CSV export.
export async function loadContacts(): Promise<Contact[]> {
  const rows = await db
    .select({
      client: {
        id: clients.id,
        name: clients.name,
        email: clients.email,
        locale: clients.locale,
        marketingConsentAt: clients.marketingConsentAt,
      },
      gallery: {
        id: proofGalleries.id,
        clientName: proofGalleries.clientName,
        eventType: proofGalleries.eventType,
        role: galleryClients.role,
      },
    })
    .from(clients)
    .leftJoin(galleryClients, eq(galleryClients.clientId, clients.id))
    .leftJoin(proofGalleries, eq(proofGalleries.id, galleryClients.galleryId))
    .orderBy(desc(clients.createdAt), asc(galleryClients.createdAt));

  return groupContacts(
    rows.map(({ client, gallery }) => ({
      client,
      // Drizzle nulls the whole nested object when the left join misses,
      // but types each field as nullable, so a matched row's are asserted.
      gallery:
        gallery?.id && gallery.role
          ? {
              id: gallery.id,
              clientName: gallery.clientName!,
              eventType: gallery.eventType,
              role: gallery.role,
            }
          : null,
    })),
  );
}
