export type Locale = 'en' | 'de';

const messages = {
	en: {
		brand: 'Common ground', feed: 'Recent conversations', prompt: 'What’s something we could make better?',
		write: 'Write what could be better…', share: 'Share', reply: 'Reply', replies: 'replies',
		back: 'Back to conversations', profile: 'Your contributions', empty: 'No conversations yet. Start one.',
		language: 'Language', demo: 'A small, local prototype', report: 'Report', copy: 'Copy link',
		profileLink: 'Profile', feedLink: 'Conversations', send: 'Post reply', name: 'You',
		noReplies: 'Be the first to reply with context, a question, or an idea.', justNow: 'Just now',
		newest: 'Newest first', placeReply: 'Write a reply…', copied: 'Copied',
		principle: 'A place to think together.', principleText: 'Share what could be better. Listen, learn, and help where you can.',
		noLikes: 'No likes. No rankings. Just conversations, in the order they happened.',
		localOnly: 'This prototype saves posts only in this browser. Other people cannot see them yet.',
		reportUnavailable: 'Reporting is not connected in this local prototype.'
	},
	de: {
		brand: 'Gemeinsam besser', feed: 'Neue Gespräche', prompt: 'Was könnten wir besser machen?',
		write: 'Schreib, was besser sein könnte …', share: 'Veröffentlichen', reply: 'Antworten', replies: 'Antworten',
		back: 'Zurück zu den Gesprächen', profile: 'Deine Beiträge', empty: 'Noch keine Gespräche. Fang eins an.',
		language: 'Sprache', demo: 'Ein kleiner Prototyp auf diesem Gerät', report: 'Melden', copy: 'Link kopieren',
		profileLink: 'Profil', feedLink: 'Gespräche', send: 'Antwort senden', name: 'Du',
		noReplies: 'Antworte zuerst mit Kontext, einer Frage oder einer Idee.', justNow: 'Gerade eben',
		newest: 'Neueste zuerst', placeReply: 'Schreib eine Antwort …', copied: 'Kopiert',
		principle: 'Ein Ort zum gemeinsamen Nachdenken.', principleText: 'Teile, was besser sein könnte. Hör zu, lerne und hilf, wo du kannst.',
		noLikes: 'Keine Likes. Keine Ranglisten. Nur Gespräche in ihrer zeitlichen Reihenfolge.',
		localOnly: 'Beiträge werden nur in diesem Browser gespeichert. Andere können sie noch nicht sehen.',
		reportUnavailable: 'Meldungen sind im lokalen Prototyp nicht verbunden.'
	}
} as const;

export function t(locale: Locale) {
	return messages[locale];
}
