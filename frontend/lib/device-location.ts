const NOMINATIM_EMAIL = process.env.NEXT_PUBLIC_NOMINATIM_EMAIL;
const CITY_MAX_LENGTH = 80;
const ADDRESS_MAX_LENGTH = 240;
const STREET_MAX_LENGTH = 160;
const POSTAL_CODE_MAX_LENGTH = 16;

export interface DeviceCoordinates {
    latitude: number;
    longitude: number;
}

export interface ReverseGeocodeResult {
    city: string;
    address: string;
    street: string;
    postalCode: string;
}

export type GpsErrorReason =
    | "unsupported"
    | "denied"
    | "unavailable"
    | "timeout";

export class GpsError extends Error {
    readonly reason: GpsErrorReason;

    constructor(reason: GpsErrorReason) {
        super(reason);
        this.name = "GpsError";
        this.reason = reason;
    }
}

export function isPhoneDevice(): boolean {
    if (typeof navigator === "undefined") return false;

    const userAgentData = (
        navigator as Navigator & { userAgentData?: { mobile: boolean } }
    ).userAgentData;

    if (userAgentData?.mobile !== undefined) {
        return userAgentData.mobile;
    }

    const userAgent = navigator.userAgent;

    return /Android.*Mobile|iPhone|iPod|Windows Phone|Mobile/i.test(
        userAgent
    );
}


export function getCurrentCoordinates(): Promise<DeviceCoordinates> {
    return new Promise((resolve, reject) => {
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
            reject(new GpsError("unsupported"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    reject(new GpsError("denied"));
                } else if (error.code === error.TIMEOUT) {
                    reject(new GpsError("timeout"));
                } else {
                    reject(new GpsError("unavailable"));
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    });
}

export function getGpsErrorMessage(error: GpsError): string {
    switch (error.reason) {
        case "denied":
            return "Location permission was denied. Allow location access for this site in your browser settings, or fill in the City and Address.";
        case "timeout":
            return "Getting your location took too long. Please try again, or fill in the City and Address.";
        case "unsupported":
            return "Your browser does not support location. Please fill in the City and Address.";
        default:
            return "Your location is not available. Turn on GPS and try again, or fill in the City and Address.";
    }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

export async function reverseGeocode(
    latitude: number,
    longitude: number,
): Promise<ReverseGeocodeResult | null> {
    const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(latitude),
        lon: String(longitude),
        zoom: "18",
        addressdetails: "1",
        "accept-language": "en",
    });

    if (NOMINATIM_EMAIL) {
        params.set("email", NOMINATIM_EMAIL);
    }

    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    );

    if (!res.ok) {
        throw new Error(`Nominatim responded with ${res.status}`);
    }

    const root = asRecord(await res.json());

    if (!root || root.error) return null;

    const parts = asRecord(root.address) ?? {};

    const pick = (...keys: string[]): string => {
        for (const key of keys) {
            const value = parts[key];

            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }

        return "";
    };

    const city = pick(
        "city",
        "town",
        "village",
        "municipality",
        "city_district",
        "county",
        "state_district",
        "state",
    );
    const street = pick("road", "pedestrian", "footway", "path");
    const locality = pick(
        "neighbourhood",
        "suburb",
        "quarter",
        "hamlet",
        "residential",
    );
    const streetLine = [pick("house_number"), street].filter(Boolean).join(" ");
    const displayName =
        typeof root.display_name === "string" ? root.display_name : "";

    const address =
        [streetLine, locality].filter(Boolean).join(", ") || displayName;

    if (!city || !address) return null;

    return {
        city: city.slice(0, CITY_MAX_LENGTH),
        address: address.slice(0, ADDRESS_MAX_LENGTH),
        street: street.slice(0, STREET_MAX_LENGTH),
        postalCode: pick("postcode").slice(0, POSTAL_CODE_MAX_LENGTH),
    };
}

export type LocationPermissionState = "granted" | "prompt" | "denied" | "unknown";

export async function getLocationPermissionState(): Promise<LocationPermissionState> {
    try {
        if (typeof navigator === "undefined" || !navigator.permissions) {
            return "unknown";
        }

        const status = await navigator.permissions.query({
            name: "geolocation",
        });

        return status.state;
    } catch {
        return "unknown";
    }
}