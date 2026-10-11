export type DeviceLocation = { latitude: number; longitude: number; accuracy: number };
type LocationFailure = 'locationUnsupported' | 'locationInsecure' | 'locationDenied' | 'locationTimeout' | 'locationUnavailable';

export class LocationError extends Error {
	constructor(readonly reason: LocationFailure) { super(reason); }
}

function requestLocation(options: PositionOptions): Promise<DeviceLocation> {
	return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
		({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
		(error) => reject(new LocationError(error.code === 1 ? 'locationDenied' : error.code === 3 ? 'locationTimeout' : 'locationUnavailable')),
		options
	));
}

export async function getCurrentLocation(): Promise<DeviceLocation> {
	if (!globalThis.isSecureContext) throw new LocationError('locationInsecure');
	if (!globalThis.navigator?.geolocation) throw new LocationError('locationUnsupported');
	try {
		return await requestLocation({ enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 });
	} catch (error) {
		if (locationErrorKey(error) === 'locationDenied') throw error;
		return requestLocation({ enableHighAccuracy: false, maximumAge: 300_000, timeout: 20_000 });
	}
}

export function locationErrorKey(error: unknown): LocationFailure {
	return error instanceof LocationError ? error.reason : 'locationUnavailable';
}
