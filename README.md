# partiii

A small, mobile-first conversation client for public AT Protocol records. People can write a short post, reply, view a chronological public feed, open a profile, and optionally attach an approximate place related to the post. There are no likes, follower counts, repost counts, ranking, or engagement feed.

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

Coordinates in records are integer millionths of a degree (ATProto does not support floating-point record values). The UI converts these to degrees and rounds selected points to a 0.25-degree grid.

The prototype discovers repositories through the public Bluesky relay's collection listing, then reads public records from the PDS named by each DID document. It does not run an indexer or database. This is suitable for a small pilot but is not a complete or guaranteed global index: relay coverage and paging can omit participants. A larger network needs an openly documented, replaceable indexer or multiple independent network views.

The map uses the keyless OpenTopoMap raster tiles already supported by R4, with OpenStreetMap/OpenTopoMap attribution. People explicitly choose a point for the issue, not themselves; coordinates are rounded to 0.25 degrees before writing. The map is optional and no browser geolocation is used.

## Interface and routes

- `/`: chronological feed.
- `/map`: full-viewport map; `lat` and `lng` query parameters focus an approximate place.
- `/post/[did]/[rkey]`: a directly linkable conversation.
- `/profile/[did]`: a directly linkable profile.

Navigation uses SvelteKit routes and ordinary links. Login and new posts use native `<dialog>` elements opened with `showModal()`, including browser-managed focus, background inertness, and Escape dismissal. Place selection stays inside the post dialog and includes keyboard-accessible coordinate inputs.

The shared layout fills the viewport with an automatically sized header and a remaining-space content row. Styles use custom-property tokens, without authored pixel units or `calc()`. The minimal MapLibre styles are maintained locally rather than importing its stylesheet. MapLibre itself still writes pixel-based canvas dimensions and marker transforms at runtime; these are renderer internals.

## Current pilot limitations

- There is no app-owned report queue, labeler, or moderation service yet. Do not treat the prototype as a fully moderated public forum.
- Feed discovery is relay-backed and bounded; it is not representative of everyone on AT Protocol or of humanity.
- Profiles currently list the author's posts; reply records are shown in a thread when their authors are present in the discovered feed.
- Map tiles require a network connection and use OpenTopoMap/OpenStreetMap third-party services. No API key is required.

## License

GNU Affero General Public License, version 3 or later. See [LICENSE](LICENSE).
