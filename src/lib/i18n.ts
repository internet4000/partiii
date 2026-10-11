export type Locale = 'en' | 'de';

const messages = {
	en: {
		useMyLocation: 'Use my location', locating: 'Finding your location…', locationAccuracy: 'Device accuracy', showPlace: 'Show on map', changePlace: 'Change place', dragPlace: 'Selected place. Use arrow keys to move.', zoomIn: 'Zoom in', zoomOut: 'Zoom out', locationDenied: 'Location access was denied. Choose a point on the map or enter coordinates.', locationTimeout: 'Finding your location took too long. Try again or choose a point.', locationUnavailable: 'Your location could not be found. Choose a point or enter coordinates.', locationUnsupported: 'This browser cannot provide your location. Choose a point or enter coordinates.', locationInsecure: 'Location only works on HTTPS or localhost. Open the HTTPS site, or choose a point on the map.', loadMore: 'Load more', loadingMore: 'Loading more…', places: 'Places', confirmDelete: 'Delete this post?', publishing: 'Publishing…',
		newPost: 'Write', conversation: 'Conversation', navigation: 'Navigation', skip: 'Skip to content', latitude: 'Latitude', longitude: 'Longitude', notFound: 'This post is unavailable.',
		feed: 'Recent', map: 'Map', profile: 'Profile', prompt: 'What could be better?', write: 'Write a post…',
		post: 'Post', reply: 'Reply', replies: 'replies', connect: 'Log in', handle: 'Your Bluesky handle or domain',
		connecting: 'Connecting…', signOut: 'Sign out', connected: 'Connected as', newest: 'Newest first',
		noPosts: 'No posts yet.', noLocationPosts: 'No posts with a place yet.', noReplies: 'Start the conversation.',
		writeReply: 'Write a reply…', sendReply: 'Reply', profilePosts: 'Posts', place: 'Add a place',
		placeHelp: 'This exact point will be public when you publish the post.',
		removePlace: 'Remove place', choosePlace: 'Tap the map or drag the marker to choose a place.',
		cancel: 'Cancel', savePlace: 'Use this place', location: 'Place', openPost: 'Open conversation',
		copyLink: 'Copy link', copied: 'Copied', delete: 'Delete your post', report: 'Report this post',
		reportHelp: 'Report this post to your app or PDS moderator.', reported: 'Report guidance',
		language: 'Language', loading: 'Loading public posts…', loadError: 'Could not load public posts. Try again.',
		tryAgain: 'Try again', signInFirst: 'Connect an account to write.', signInError: 'Could not connect. Check the handle and try again.',
		postError: 'Could not publish this post. Try again.', replyError: 'Could not publish this reply. Try again.',
		deleteError: 'Could not delete this post.', deleted: 'Post deleted.', emptyReply: 'Write a reply first.',
		shareBluesky: 'Share to Bluesky', noProfilePosts: 'No posts on this profile yet.',
		external: 'Open profile', mapUnavailable: 'The map could not be loaded.', unknown: 'Unknown account',
		close: 'Close', back: 'Back', characterCount: 'characters', menu: 'Post actions', signInTitle: 'Write and reply',
		refresh: 'Refresh', privacy: 'Place is optional and only included when you choose it.'
	},
	de: {
		useMyLocation: 'Meinen Standort verwenden', locating: 'Standort wird ermittelt …', locationAccuracy: 'Gerätegenauigkeit', showPlace: 'Auf Karte zeigen', changePlace: 'Ort ändern', dragPlace: 'Ausgewählter Ort. Mit den Pfeiltasten verschieben.', zoomIn: 'Vergrößern', zoomOut: 'Verkleinern', locationDenied: 'Standortzugriff wurde abgelehnt. Wähle einen Punkt auf der Karte oder gib Koordinaten ein.', locationTimeout: 'Die Standortsuche dauerte zu lange. Versuche es erneut oder wähle einen Punkt.', locationUnavailable: 'Dein Standort konnte nicht ermittelt werden. Wähle einen Punkt oder gib Koordinaten ein.', locationUnsupported: 'Dieser Browser kann deinen Standort nicht ermitteln. Wähle einen Punkt oder gib Koordinaten ein.', locationInsecure: 'Standort funktioniert nur über HTTPS oder localhost. Öffne die HTTPS-Seite oder wähle einen Punkt auf der Karte.', loadMore: 'Mehr laden', loadingMore: 'Mehr wird geladen …', places: 'Orte', confirmDelete: 'Diesen Beitrag löschen?', publishing: 'Veröffentlicht …',
		newPost: 'Schreiben', conversation: 'Gespräch', navigation: 'Navigation', skip: 'Zum Inhalt', latitude: 'Breitengrad', longitude: 'Längengrad', notFound: 'Dieser Beitrag ist nicht verfügbar.',
		feed: 'Neu', map: 'Karte', profile: 'Profil', prompt: 'Was könnte besser sein?', write: 'Schreib einen Beitrag …',
		post: 'Veröffentlichen', reply: 'Antworten', replies: 'Antworten', connect: 'Anmelden', handle: 'Bluesky-Handle oder Domain',
		connecting: 'Verbinde …', signOut: 'Abmelden', connected: 'Verbunden als', newest: 'Neueste zuerst',
		noPosts: 'Noch keine Beiträge.', noLocationPosts: 'Noch keine Beiträge mit Ortsangabe.', noReplies: 'Beginne das Gespräch.',
		writeReply: 'Schreib eine Antwort …', sendReply: 'Antworten', profilePosts: 'Beiträge', place: 'Ort hinzufügen',
		placeHelp: 'Dieser genaue Punkt wird beim Veröffentlichen des Beitrags öffentlich.',
		removePlace: 'Ort entfernen', choosePlace: 'Tippe auf die Karte oder verschiebe die Markierung, um einen Ort auszuwählen.',
		cancel: 'Abbrechen', savePlace: 'Ort übernehmen', location: 'Ort', openPost: 'Gespräch öffnen',
		copyLink: 'Link kopieren', copied: 'Kopiert', delete: 'Eigenen Beitrag löschen', report: 'Beitrag melden',
		reportHelp: 'Melde diesen Beitrag beim Moderator deiner App oder deines PDS.', reported: 'Meldehinweis',
		language: 'Sprache', loading: 'Öffentliche Beiträge werden geladen …', loadError: 'Beiträge konnten nicht geladen werden. Versuch es erneut.',
		tryAgain: 'Erneut versuchen', signInFirst: 'Verbinde ein Konto, um zu schreiben.', signInError: 'Verbindung fehlgeschlagen. Prüfe den Handle und versuche es erneut.',
		postError: 'Beitrag konnte nicht veröffentlicht werden. Versuch es erneut.', replyError: 'Antwort konnte nicht veröffentlicht werden. Versuch es erneut.',
		deleteError: 'Beitrag konnte nicht gelöscht werden.', deleted: 'Beitrag gelöscht.', emptyReply: 'Schreib zuerst eine Antwort.',
		shareBluesky: 'Auf Bluesky teilen', noProfilePosts: 'Dieses Profil hat noch keine Beiträge.',
		external: 'Profil öffnen', mapUnavailable: 'Die Karte konnte nicht geladen werden.', unknown: 'Unbekanntes Konto',
		close: 'Schließen', back: 'Zurück', characterCount: 'Zeichen', menu: 'Beitragsaktionen', signInTitle: 'Schreiben und antworten',
		refresh: 'Aktualisieren', privacy: 'Der Ort ist freiwillig und wird nur mit deiner Auswahl gespeichert.'
	}
} as const;

export function t(locale: Locale) { return messages[locale]; }
