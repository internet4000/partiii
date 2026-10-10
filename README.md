# Common ground prototype

An early SvelteKit prototype for simple conversations about what could be better. The interface supports a chronological feed, composing a short post, opening a thread, replying, a basic profile, and English/German labels.

## Run locally

```sh
npm install
npm run dev
```

Posts are saved in the current browser's local storage. Sample conversations are included so the interface can be explored immediately. They are examples, not live community content. This build has no account system, shared server, moderation queue, or AT Protocol connection; different people cannot see one another's posts yet.

## Next pilot milestone

The next meaningful pilot step is portable sign-in and writing public post/reply records to an open AT Protocol repository, plus a small documented chronological indexer so participants can see one another's conversations. Publish the record Lexicon and index/query rules alongside the source so alternative clients and forks can implement them. Add a report path before opening a public pilot. Keep profile/feed identity simple, and do not introduce ranking, reaction counts, or recommendation algorithms.

## License

This project is intended to be distributed under the GNU Affero General Public License, version 3 or later. See [LICENSE](LICENSE).
