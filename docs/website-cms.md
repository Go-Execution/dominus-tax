# Dominus Website Studio

Open `/cms` on the existing domain and use the existing temporary administrator password. The studio has website editing controls only. The CRM has its own `/crm` route. Both currently use the same temporary administrator session; this release does not introduce a separate CMS-only authentication role.

## Editing and publishing

- Select a section or click text in the preview. Update headings, paragraphs, button labels, contact information and footer copy.
- Shared links update all occurrences of a destination, including Calendly and Jotform links.
- Images accepts public HTTPS URLs or JPG/PNG/WebP uploads up to 3 MB. Uploaded website images are public; never upload client documents here.
- Brand colors controls the gold accent, base background and primary text.
- Search & SEO edits the browser title and description. The static source metadata remains in the HTML; published overrides are applied in the browser.
- Page sections allows rearranging and hiding the six existing homepage sections. It is not an unrestricted page builder and does not create new pages or arbitrary layouts.
- Save draft keeps edits private. Publish changes updates public content. Restore last published loads that version into the editor; save or publish to commit it.

## Storage and deployment

The existing Supabase service connection creates private `dominus-website` storage on the first authenticated editor load. Draft and published JSON documents are separate. Only the published document is returned by the public endpoint. Uploads use public `dominus-website-media` storage. There are no browser storage write privileges or new frontend secrets. Editing is intended for one website owner at a time; saves replace that document.

`website/amanda-homepage.html` retains the supplied standalone homepage. The build script adds stable editing hooks without replacing its CSS or embedded photography. Vite continues to build the existing CRM into `portal.html`. No package dependencies were added. `api/website.ts` also serves the `/api/health` rewrite to preserve the existing function count.

The public site keeps the supplied content if published content cannot load. Draft preview uses same-origin postMessage and textContent, never editable HTML. Changing the source homepage requires reviewing generated field IDs against saved content before deploying, since IDs follow source order.

Old `/services`, `/about` and `/contact` paths redirect to `/#services`, `/#firm` and `/#book`. `/admin` and legacy `#admin` links lead to `/crm`; legacy `#cms` leads to `/cms`. Domain and DNS settings are unchanged.
