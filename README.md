# partiii

A small, mobile-first conversation client for public AT Protocol records. People can write a short post, reply, view a chronological public feed, open a profile, and optionally attach an approximate place related to the post. There are no likes, follower counts, repost counts, ranking, or engagement feed.

## Run locally

```sh
npm install
npm run dev
```

For local AT Protocol OAuth, use `http://localhost` or `http://127.0.0.1`; the browser client uses AT Protocol loopback OAuth there. A deployed site serves its OAuth client metadata at `/client-metadata.json` and uses the current request origin, so set the final Worker hostname before inviting people to connect accounts.

## Deploy to Cloudflare Workers

This project uses SvelteKit's Cloudflare adapter. Build with `npm run build`, then deploy the generated Worker with `npx wrangler deploy`. Cloudflare's Git integration should run the build before the deploy step; configure the build command as `npm run build` if it does not already do so. `wrangler.jsonc` names the Worker `partiii`.

## AT Protocol records

Posts and replies are public records in each author's own repository:

- `com.radio4000.partiii.post`
- `com.radio4000.partiii.reply`

The schemas are in [`lexicons/`](lexicons/). Before independent clients can reliably discover and validate them, publish these Lexicons and delegate their `_lexicon` DNS records to a DID controlled by the `radio4000.com` domain. Until that is configured, records may still be written to PDS repositories, but broad interoperability and schema validation are not assured.

The prototype discovers repositories through the public Bluesky relay's collection listing, then reads public records from the PDS named by each DID document. It does not run an indexer or database. This is suitable for a small pilot but is not a complete or guaranteed global index: relay coverage and paging can omit participants. A larger network needs an openly documented, replaceable indexer or multiple independent network views.

The map uses OpenStreetMap data rendered through CARTO tiles. People explicitly choose a point for the issue, not themselves; coordinates are rounded to 0.25 degrees before writing. The map is optional and no browser geolocation is used.

## Current pilot limitations

- There is no app-owned report queue, labeler, or moderation service yet. Do not treat the prototype as a fully moderated public forum.
- Feed discovery is relay-backed and bounded; it is not representative of everyone on AT Protocol or of humanity.
- Profiles currently list the author's posts; reply records are shown in a thread when their authors are present in the discovered feed.
- Map tiles require a network connection and use CARTO/OpenStreetMap third-party services.

## License

GNU Affero General Public License, version 3 or later. See [LICENSE](LICENSE).
