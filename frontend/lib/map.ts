import type { IssueMapPin, PostItem } from "@/types";

/**
 * Turns reports into Leaflet markers.
 *
 * Coordinates reach this function in two shapes. The fixtures hold numbers,
 * and the API will hand over strings, because Postgres DECIMAL(9,6)
 * serialises to a JSON string rather than a number. Leaflet accepts neither
 * a string nor a null, so the conversion and the null check live here instead
 * of at every marker.
 */
type Coordinate = number | string | null | undefined;

function toCoordinate(value: Coordinate): number | null {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Null when the report has no usable position. A report without coordinates
 * still belongs in the list and the feed, it just cannot be drawn, and a
 * marker at a guessed position is worse than no marker at all.
 *
 * The range check catches a transposed pair and the 0,0 that an unset column
 * turns into once something coerces null to a number. The database has the
 * same check, so this is the second line of defence rather than the only one.
 */
export function toMapPin(post: PostItem): IssueMapPin | null {
    const lat = toCoordinate(post.latitude);
    const lng = toCoordinate(post.longitude);

    if (lat === null || lng === null) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    if (lat === 0 && lng === 0) return null;

    return {
        id: post.id,
        code: post.code,
        title: post.title,
        category: post.tag,
        address: post.address,
        ward: post.ward,
        status: post.status,
        updatedAt: post.updatedAt,
        lat,
        lng,
    };
}

export function toMapPins(posts: PostItem[]): IssueMapPin[] {
    return posts.map(toMapPin).filter((pin): pin is IssueMapPin => pin !== null);
}

/** South-west and north-east corners, for map.fitBounds. */
export function pinBounds(pins: IssueMapPin[]): [[number, number], [number, number]] | null {
    if (pins.length === 0) return null;

    const lats = pins.map((pin) => pin.lat);
    const lngs = pins.map((pin) => pin.lng);

    return [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
    ];
}
