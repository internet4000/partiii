import type { Place } from './atproto';

// ATProto coordinates are stored as integer millionths of a degree.
export function precisePlace(latitude: number, longitude: number): Place {
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90) {
		throw new RangeError('Invalid coordinates');
	}
	const wrapped = longitude >= -180 && longitude <= 180 ? longitude : ((longitude + 180) % 360 + 360) % 360 - 180;
	return { latitude: Math.round(latitude * 1_000_000) / 1_000_000, longitude: Math.round(wrapped * 1_000_000) / 1_000_000 };
}
