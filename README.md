# partiii

A mobile-first conversation client for public AT Protocol records. People can write a short post, reply, view a chronological public feed, open a profile, and optionally attach a place related to the post. There are no likes, follower counts, repost counts, ranking, or engagement feed.

## Run locally

```sh
npm install
npm run dev
```

For local AT Protocol OAuth, use `http://127.0.0.1:5173`. Opening `localhost` redirects to `127.0.0.1` so the authorization request and callback share the same browser storage origin. A deployed site serves its OAuth client metadata at `/client-metadata.json` and uses the current request origin, so set the final Worker hostname before inviting people to connect accounts.

## Deploy to Cloudflare Workers

This project uses SvelteKit's Cloudflare adapter. The default **Deploy command** `npx wrangler deploy` works: `wrangler.jsonc` runs `npm run build` before deployment, generating `.svelte-kit/cloudflare/_worker.js`. A separate dashboard build command is optional; if it also runs `npm run build`, the build will run twice. Locally, `npm run deploy` uses the same configuration. `wrangler.jsonc` names the Worker `partiii`.

The custom build hook addresses the missing `_worker.js` error on a fresh checkout. It does not require a generated build directory to be committed.

## AT Protocol records

Posts and replies are public records in each author's own repository:

- `com.internet4000.partiii.post`
- `com.internet4000.partiii.reply`

The schemas are in [`lexicons/`](lexicons/), under the `internet4000.com` namespace. For interoperability, publish the Lexicons and delegate their `_lexicon` DNS records to a DID controlled by that domain. Earlier experimental `com.radio4000.partiii` records are not migrated or deleted automatically; this client now reads and writes the new collections.

OAuth metadata and authorization requests share the same collection-specific scopes from `src/lib/records.ts`: create and delete Partiii posts and replies. No access to Bluesky posts is requested. Reconnect after upgrading from the previous permissions. Login uses a full-page redirect, then returns to the route where you started. Callback and restore errors appear in the native login dialog.

Coordinates in records are integer millionths of a degree (ATProto does not support floating-point record values). The UI converts these to degrees, preserving six decimal places without snapping to a grid. Existing rounded points remain readable.

The app discovers repositories through the public Bluesky relay's collection listing, then reads public records from the PDS named by each DID document. It does not run an indexer or database, so relay coverage and paging can omit participants. A larger network needs an openly documented, replaceable indexer or multiple independent network views.

The map uses the keyless OpenTopoMap raster tiles already supported by R4, with OpenStreetMap/OpenTopoMap attribution. People can tap the map, drag or keyboard-move a marker, enter coordinates, or explicitly request their device location. Browser geolocation is only requested after clicking “Use my location”; its accuracy is shown, and permission denial and timeouts leave manual selection available. Confirming the picker adds the point to the draft; publishing makes it public.

## Interface and routes

- `/`: explore posts as a list, grid, or map; `q`, `view`, `post`, `lat`, and `lng` query parameters preserve shared state. A single view button sits beside search; clearing search preserves the current view.
- `/map`: full-viewport map; `lat` and `lng` query parameters focus a place.
- `/post/[did]/[rkey]`: a directly linkable conversation.
- `/profile/[did]`: a directly linkable profile, with a list/grid/map view picker to the left of its action menu. The menu offers a Bluesky profile link and native sharing or copying the profile link.
- `/about`: a short introduction to the project, available from the app menu, with a GitHub link from `package.json`'s `repository.url`.

Navigation uses SvelteKit routes and ordinary links; the app menu title links home. Login, new posts, replies, place selection, action menus, view selection, and map credits use native `<dialog>` elements opened with `showModal()`, including browser-managed focus, background inertness, and Escape dismissal. Dialogs leave space around the viewport edges. Posts and replies share a composer with a character count, Ctrl/⌘ + Enter submission, and drafts preserved when the dialog closes. The post composer's add/remove-place control sits beside submit. Reply dialogs show one prompt and leave the original post on the page; publishing errors keep the draft available for retry. Place selection opens a native dialog above the compose dialog; cancelling preserves the previous point and draft. It includes keyboard-accessible coordinates and marker movement.

Interface icons use Lucide's Svelte components, with text labels or accessible names on controls. Profile pictures come from the public `app.bsky.actor.profile` record and its avatar blob on the author's PDS; a missing profile or unavailable image leaves the author's posts accessible.

The padded content area of a post card links to its detail page; the author's profile and contextual menu remain separate controls. Cards show a place icon when they have coordinates and a linked reply count when replies exist; post details display the attached place on a map. Posts and thread replies share an action menu with a visit-post link and author-only deletion. Reply and map actions stay in the contextual menu, alongside a single link-sharing action: native sharing when supported, copying otherwise. Cancelling native sharing leaves the menu available. Every map groups device location with its zoom controls, and requests location only after a click. A credits button opens attribution links for OpenStreetMap/SRTM, OpenTopoMap and its CC-BY-SA license, and MapLibre.

The shared layout fills the viewport with a scrolling content area and bottom navigation. `src/style.css` imports the logical stylesheets in `src/styles/`: tokens, base elements, layout, posts, dialogs, maps, and MapLibre integration. Styles use custom-property tokens, without authored pixel units or `calc()`. The minimal MapLibre styles are maintained locally rather than importing its stylesheet. MapLibre itself still writes pixel-based canvas dimensions and marker transforms at runtime; these are renderer internals.

## Current limitations

- There is no app-owned report queue, labeler, or moderation service yet. Do not treat the app as a fully moderated public forum.
- Feed discovery is relay-backed and bounded; it is not representative of everyone on AT Protocol or of humanity.
- Profiles currently list the author's posts; reply records are shown in a thread when their authors are present in the discovered feed.
- Map tiles require a network connection and use OpenTopoMap/OpenStreetMap third-party services. No API key is required.

## License

GNU Affero General Public License, version 3 or later. See [LICENSE](LICENSE).
