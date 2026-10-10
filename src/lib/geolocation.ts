export type DeviceLocation = { latitude: number; longitude: number; accuracy: number };
type LocationFailure = 'locationUnsupported' | 'locationDenied' | 'locationTimeout' | 'locationUnavailable';

export class LocationError extends Error {
	constructor(readonly reason: LocationFailure) { super(reason); }
}

export function getCurrentLocation(): Promise<DeviceLocation> {
	if (!globalThis.navigator?.geolocation) return Promise.reject(new LocationError('locationUnsupported'));
	return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
		({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
		(error) => reject(new LocationError(error.code === 1 ? 'locationDenied' : error.code === 3 ? 'locationTimeout' : 'locationUnavailable')),
		{ enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
	));
}

export function locationErrorKey(error: unknown): LocationFailure {
	return error instanceof LocationError ? error.reason : 'locationUnavailable';
}
