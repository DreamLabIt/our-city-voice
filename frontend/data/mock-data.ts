import {
    LayoutGrid,
    Road,
    Footprints,
    Droplets,
    CloudRain,
    Trees,
    Trash2,
    Lightbulb,
    Building2,
    Bus,
    TreePine,
    Users,
    MoreHorizontal,
    MessageSquare,
    MessageCircle,
    Calendar,
    CheckCircle2,
    SearchCheck,
    Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
    ActivityItem,
    CategoryItem,
    ChartMonth,
    NavItem,
    StatItem,
    SearchSuggestion,
    StepItem,
    LocationItem,
} from "@/types";
import type {
    Category,
    Priority,
    Report,
    ReportCommentThread,
    ReportMedia,
    ReportStatus,
    TimelineEntry,
} from "@/types/report";

// ── Navigation ──────────────────────────────────────────────
export const navItems: NavItem[] = [
    { name: "Home", href: "/" },
    { name: "Issues Map", href: "/issues-map" },
    { name: "Reports", href: "/reports" },
    { name: "Statistics", href: "/statistics" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
];

// ── Category Filter ─────────────────────────────────────────
export const categories: CategoryItem[] = [
    { id: "roads", name: "Roads", icon: Road, iconColor: "text-foreground" },
    { id: "sidewalks", name: "Sidewalks", icon: Footprints, iconColor: "text-foreground" },
    { id: "water", name: "Water & Sewer", icon: Droplets, iconColor: "text-primary" },
    { id: "stormwater", name: "Stormwater & Flooding", icon: CloudRain, iconColor: "text-primary" },
    { id: "parks", name: "Parks & Recreation", icon: Trees, iconColor: "text-tag-green-text" },
    { id: "waste", name: "Waste & Recycling", icon: Trash2, iconColor: "text-tag-green-text" },
    {
        id: "streetlights",
        name: "Streetlights & Signals",
        icon: Lightbulb,
        iconColor: "text-foreground",
    },
    {
        id: "buildings",
        name: "Buildings & Facilities",
        icon: Building2,
        iconColor: "text-foreground",
    },
    { id: "transit", name: "Transit & Mobility", icon: Bus, iconColor: "text-primary" },
    { id: "environment", name: "Environment", icon: TreePine, iconColor: "text-tag-green-text" },
    { id: "community", name: "Community & Safety", icon: Users, iconColor: "text-primary" },
    { id: "other", name: "Other", icon: MoreHorizontal, isOther: true },
];

// ── Feed fixtures to schema-faithful Report rows ───────────
// The raw arrays below are the richer feed data (tag colours, feed tabs,
// status timelines, commenter labels). What the app and the seed actually see
// are the exports at the bottom of each section: plain `Report` / comment
// objects, exactly the shape the API ships, so a component cannot drift from
// the contract. Times are converted to ISO strings, and sizes to BigInt-as-
// string, just as the backend serializer would.
function toIso(value: string): string {
    const cleaned = value.replace("·", " ").replace(/\s+/g, " ").trim();
    const parsed = new Date(cleaned);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

// Relative timestamps ("4 hours ago") become concrete ISO instants anchored at
// a fixed point, so the fixtures stay date-shaped and do not drift on import.
const COMMENT_ANCHOR = new Date("2026-10-26T12:00:00.000Z").getTime();

function toIsoFromRelative(value: string): string {
    const match = /^(\d+)\s+(second|minute|hour|day|week)s?\s+ago$/.exec(value.trim());
    if (!match) return toIso(value);

    const amount = Number(match[1]);
    const unit = match[2];
    const msPerUnit =
        unit === "second"
            ? 1_000
            : unit === "minute"
              ? 60_000
              : unit === "hour"
                ? 3_600_000
                : unit === "day"
                  ? 86_400_000
                  : 604_800_000;

    return new Date(COMMENT_ANCHOR - amount * msPerUnit).toISOString();
}

function iconName(icon: LucideIcon | undefined): string {
    return icon?.displayName ?? "CircleHelp";
}

// Category label -> the category object the API would ship, so a fixture's tag
// or category string maps onto the same reduced Category row.
const CATEGORY_BY_LABEL = new Map(
    categories
        .filter((category) => category.id !== "all")
        .map((category) => [
            category.name,
            {
                id: category.id,
                name: category.name,
                slug: category.id,
                icon: iconName(category.icon),
            },
        ]),
);

function categoryFor(label: string): Category {
    return (
        CATEGORY_BY_LABEL.get(label) ?? {
            id: "other",
            name: label,
            slug: "other",
            icon: "CircleHelp",
        }
    );
}

function toReportMedia(
    postId: string,
    item: (typeof feedPosts)[number]["media"][number],
): ReportMedia {
    return {
        id: `${postId}-m${item.sortOrder}`,
        type: item.type as ReportMedia["type"],
        storageKey: item.storageKey,
        thumbnailKey: item.thumbnailKey,
        mimeType: item.mimeType,
        sizeBytes: String(item.sizeBytes),
        durationSecs: item.durationSecs,
        sortOrder: item.sortOrder,
        // Fixtures hold display-ready paths (root-relative or absolute), same
        // as what the backend's mediaUrl() would resolve a stored key to.
        url: item.storageKey,
        thumbnailUrl: item.thumbnailKey,
    };
}

// ── Recent Posts ────────────────────────────────────────────
export const tabs: string[] = ["Latest", "Most Commented", "Nearby", "Map View"];

// ── Feed fixtures (raw) ────────────────────────────────────
// Rich feed rows, not the API shape. The exports at the end of this section
// are what the app and the seed consume.
const feedPosts = [
    {
        id: "1",
        trackingCode: "OCV-2024-001245",
        date: "Oct 26, 2026",
        tag: "Roads",
        tagBg: "bg-tag-blue-bg",
        tagText: "text-tag-blue-text",
        location: "Finch Ave E, Scarborough",
        title: "Large pothole causing traffic issues",
        desc: "This pothole has been getting bigger and is causing vehicle damage.",
        commentCount: 7,
        likeCount: 8,
        viewCount: 245,
        media: [
            {
                type: "image",
                storageKey: "/road_surface .jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 824320,
                durationSecs: null,
                sortOrder: 0,
            },
            {
                type: "video",
                storageKey: "https://lorem.video/1280x720_h264_20s_30fps",
                thumbnailKey: "/road_surface .jpeg",
                mimeType: "video/mp4",
                sizeBytes: 4290880,
                durationSecs: 32,
                sortOrder: 1,
            },
            {
                type: "image",
                storageKey: "/residential_street.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 648452,
                durationSecs: null,
                sortOrder: 2,
            },
            {
                type: "image",
                storageKey: "/uneven_concrete.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 712033,
                durationSecs: null,
                sortOrder: 3,
            },
        ],
        feed: "Latest",
        status: "in_progress",
        priority: "high",
        ward: { name: "Ward 22 (Scarborough Agincourt)", code: "ward-22" },
        department: "Transportation Services",
        assignedOfficer: "Eng. Daniel Okafor",
        author: "Amina R.",
        reporterInitials: "AR",
        isAnonymous: false,
        street: "4120 Finch Ave E",
        city: "Toronto",
        address: "4120 Finch Ave E, near Birchmount Rd",
        postalCode: "M1S 4V5",
        latitude: 43.802595,
        longitude: -79.291592,
        updatedAt: "2 hours ago",
        details: [
            "A pothole on the eastbound curb lane of Finch Ave E has widened to roughly 70 cm across and about 15 cm deep. It sits directly in the path of traffic merging toward Birchmount Rd, so drivers swerve into the next lane to avoid it.",
            "Two neighbours have already reported rim and suspension damage after hitting it at night, when standing water hides how deep it is. The patch applied in the spring washed out after the first heavy rain.",
            "Requesting a permanent resurfacing of the section rather than another cold patch, plus temporary cones until the crew can be scheduled.",
        ],
        statusHistory: [
            {
                id: "u1-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Issue received with photo and video evidence and queued for triage.",
                actor: "Amina R.",
                createdAt: "Oct 26, 2026 · 08:14",
            },
            {
                id: "u1-2",
                fromStatus: "pending",
                toStatus: "pending",
                title: "Verified by field inspector",
                note: "Location and severity confirmed on site. Logged as a road hazard and routed to Transportation Services.",
                actor: "Insp. Laila Haque",
                createdAt: "Oct 26, 2026 · 13:40",
            },
            {
                id: "u1-3",
                fromStatus: "pending",
                toStatus: "in_progress",
                title: "Repair crew scheduled",
                note: "Cones placed around the hazard. Hot-mix resurfacing booked for the next dry weather window.",
                actor: "Eng. Daniel Okafor",
                createdAt: "Oct 26, 2026 · 16:05",
            },
        ],
    },
    {
        id: "2",
        trackingCode: "OCV-2024-001244",
        date: "Oct 26, 2026",
        tag: "Stormwater & Flooding",
        tagBg: "bg-tag-blue-bg",
        tagText: "text-tag-blue-text",
        location: "Morningside Ave, Scarborough",
        title: "Flooding during heavy rain",
        desc: "Water is not draining properly on this street after rain.",
        commentCount: 5,
        likeCount: 5,
        viewCount: 180,
        media: [
            {
                type: "image",
                storageKey: "/residential_street.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 648452,
                durationSecs: null,
                sortOrder: 0,
            },
            {
                type: "image",
                storageKey: "/isue.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 590118,
                durationSecs: null,
                sortOrder: 1,
            },
        ],
        feed: "Most Commented",
        status: "pending",
        priority: "critical",
        ward: { name: "Ward 24 (Scarborough Guildwood)", code: "ward-24" },
        department: "Water & Sewerage Board",
        assignedOfficer: "Unassigned",
        author: "Marcus D.",
        reporterInitials: "MD",
        isAnonymous: false,
        street: "880 Morningside Ave",
        city: "Toronto",
        address: "880 Morningside Ave, between Coronation Dr and Beechgrove",
        postalCode: "M1E 3E6",
        latitude: 43.771568,
        longitude: -79.187286,
        updatedAt: "6 hours ago",
        details: [
            "After any rainfall over about 20 minutes, water pools from the driveway at 880 Morningside Ave all the way across both lanes. The pool reaches the middle of a car tire and takes close to three hours to drain once the rain stops.",
            "The catch basin at the corner looks completely blocked — leaves and silt sit level with the grate, and no water moves through it even when the street is flooded.",
            "Pedestrians have to walk on the road to get around the water because the sidewalk dips lower than the curb here. This is the fourth time this season.",
        ],
        statusHistory: [
            {
                id: "u2-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Flooding reported with photos taken during the Oct 25 rainfall.",
                actor: "Marcus D.",
                createdAt: "Oct 26, 2026 · 07:02",
            },
            {
                id: "u2-2",
                fromStatus: "pending",
                toStatus: "pending",
                title: "Awaiting inspection",
                note: "Flagged as critical because of standing water on an active roadway. Catch basin inspection requested.",
                actor: "Intake Desk",
                createdAt: "Oct 26, 2026 · 09:30",
            },
        ],
    },
    {
        id: "3",
        trackingCode: "OCV-2024-001243",
        date: "Oct 25, 2026",
        tag: "Sidewalks",
        tagBg: "bg-tag-green-bg",
        tagText: "text-tag-green-text",
        location: "Sheppard Ave W, North York",
        title: "Broken sidewalk near bus stop",
        desc: "The sidewalk is cracked and unsafe for pedestrians.",
        commentCount: 4,
        likeCount: 6,
        viewCount: 95,
        media: [
            {
                type: "image",
                storageKey: "/uneven_concrete.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 712033,
                durationSecs: null,
                sortOrder: 0,
            },
            {
                type: "image",
                storageKey: "/residential_street.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 648452,
                durationSecs: null,
                sortOrder: 1,
            },
        ],
        feed: "Nearby",
        status: "resolved",
        priority: "medium",
        ward: { name: "Ward 07 (Humber River Black Creek)", code: "ward-07" },
        department: "Public Works Department",
        assignedOfficer: "Supt. Priya Menon",
        author: "Grace T.",
        reporterInitials: "GT",
        isAnonymous: false,
        street: "2301 Sheppard Ave W",
        city: "Toronto",
        address: "2301 Sheppard Ave W, at the westbound bus stop",
        postalCode: "M9M 2Z7",
        latitude: 43.735022,
        longitude: -79.532226,
        updatedAt: "1 day ago",
        details: [
            "Three concrete slabs beside the westbound bus stop have lifted and cracked, leaving a step of about 4 cm between them right where passengers board.",
            "Two regular riders at this stop use walkers, and one caught a wheel on the raised edge last week. The gap also traps water that freezes overnight.",
            "The slabs were ground down and relaid, and the surface is now level with the boarding pad.",
        ],
        statusHistory: [
            {
                id: "u3-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Trip hazard reported next to a transit boarding area.",
                actor: "Grace T.",
                createdAt: "Oct 25, 2026 · 10:20",
            },
            {
                id: "u3-2",
                fromStatus: "pending",
                toStatus: "in_progress",
                title: "Work order issued",
                note: "Concrete crew assigned; temporary asphalt wedge installed the same afternoon.",
                actor: "Supt. Priya Menon",
                createdAt: "Oct 25, 2026 · 15:45",
            },
            {
                id: "u3-3",
                fromStatus: "in_progress",
                toStatus: "resolved",
                title: "Repair completed",
                note: "Slabs replaced and the walkway levelled to the boarding pad. Photo proof added to the file.",
                actor: "Public Works Department",
                createdAt: "Oct 26, 2026 · 11:10",
            },
        ],
    },
    {
        id: "4",
        trackingCode: "OCV-2024-001242",
        date: "Oct 24, 2026",
        tag: "Streetlights & Signals",
        tagBg: "bg-tag-amber-bg",
        tagText: "text-tag-amber-text",
        location: "Markham Rd, Scarborough",
        title: "Streetlight not working",
        desc: "This streetlight has been out for over a week.",
        commentCount: 3,
        likeCount: 3,
        viewCount: 120,
        media: [
            {
                type: "image",
                storageKey: "/street_light.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 687210,
                durationSecs: null,
                sortOrder: 0,
            },
        ],
        feed: "Map View",
        status: "in_progress",
        priority: "medium",
        ward: { name: "Ward 24 (Scarborough Guildwood)", code: "ward-24" },
        department: "Electrical Safety Cell",
        assignedOfficer: "Tech. Omar Siddiqui",
        author: "Nadia K.",
        reporterInitials: "NK",
        isAnonymous: false,
        street: "1455 Markham Rd",
        city: "Toronto",
        address: "1455 Markham Rd, opposite the pharmacy entrance",
        postalCode: "M1H 2A2",
        latitude: 43.758294,
        longitude: -79.224743,
        updatedAt: "9 hours ago",
        details: [
            "The pole-mounted light outside 1455 Markham Rd has been dark for nine nights. The two poles on either side work, so the gap leaves the crosswalk and the pharmacy entrance in shadow.",
            "The stretch is busy after 7pm with people walking to the bus loop, and several have said they now cross at the next intersection instead.",
            "The pole number on the plate is MK-4471 if that helps the crew locate it.",
        ],
        statusHistory: [
            {
                id: "u4-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Outage reported for pole MK-4471.",
                actor: "Nadia K.",
                createdAt: "Oct 24, 2026 · 20:35",
            },
            {
                id: "u4-2",
                fromStatus: "pending",
                toStatus: "in_progress",
                title: "Diagnosed as ballast failure",
                note: "Crew tested the circuit and confirmed a failed ballast. Replacement part ordered.",
                actor: "Tech. Omar Siddiqui",
                createdAt: "Oct 25, 2026 · 14:18",
            },
        ],
    },
    {
        id: "5",
        trackingCode: "OCV-2024-001241",
        date: "Oct 23, 2026",
        tag: "Waste & Recycling",
        tagBg: "bg-tag-green-bg",
        tagText: "text-tag-green-text",
        location: "Kingston Rd, Scarborough",
        title: "Recycling bins uncollected for two weeks",
        desc: "Blue bins have been left full on the curb since the last two pickup days.",
        commentCount: 3,
        likeCount: 11,
        viewCount: 310,
        media: [
            {
                type: "image",
                storageKey: "/isue.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 590118,
                durationSecs: null,
                sortOrder: 0,
            },
            {
                type: "image",
                storageKey: "/residential_street.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 648452,
                durationSecs: null,
                sortOrder: 1,
            },
        ],
        feed: "Most Commented",
        status: "in_progress",
        priority: "medium",
        ward: { name: "Ward 20 (Scarborough Southwest)", code: "ward-20" },
        department: "Sanitation & Waste Management",
        assignedOfficer: "Coord. Beatrice Lam",
        author: "Samuel O.",
        reporterInitials: "SO",
        isAnonymous: false,
        street: "3150 Kingston Rd",
        city: "Toronto",
        address: "3150 Kingston Rd, east side of the block",
        postalCode: "M1M 3N8",
        latitude: 43.72881,
        longitude: -79.22892,
        updatedAt: "1 day ago",
        details: [
            "Blue bins for the whole east side of the block have been skipped on the last two collection days. Residents left them out both Tuesdays and the truck passed without stopping.",
            "Overflow is now stacked beside the bins in bags, and wind has scattered cardboard and plastic along the sidewalk and into the ravine path at the end of the street.",
            "Garbage and organics are still being collected normally on the same route, so it appears to be the recycling run specifically.",
        ],
        statusHistory: [
            {
                id: "u5-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Missed recycling collection reported for a full block.",
                actor: "Samuel O.",
                createdAt: "Oct 23, 2026 · 09:05",
            },
            {
                id: "u5-2",
                fromStatus: "pending",
                toStatus: "in_progress",
                title: "Route audit opened",
                note: "Collection logs pulled for the Tuesday run. A catch-up truck is being scheduled for this block.",
                actor: "Coord. Beatrice Lam",
                createdAt: "Oct 24, 2026 · 12:40",
            },
        ],
    },
    {
        id: "6",
        trackingCode: "OCV-2024-001240",
        date: "Oct 22, 2026",
        tag: "Parks & Recreation",
        tagBg: "bg-tag-green-bg",
        tagText: "text-tag-green-text",
        location: "Thomson Memorial Park, Scarborough",
        title: "Damaged playground swing set",
        desc: "A swing chain has snapped and the seat is hanging loose at the north playground.",
        commentCount: 2,
        likeCount: 14,
        viewCount: 268,
        media: [
            {
                type: "image",
                storageKey: "/isue.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 590118,
                durationSecs: null,
                sortOrder: 0,
            },
            {
                type: "image",
                storageKey: "/residential_street.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 648452,
                durationSecs: null,
                sortOrder: 1,
            },
        ],
        feed: "Nearby",
        status: "resolved",
        priority: "high",
        ward: { name: "Ward 21 (Scarborough Centre)", code: "ward-21" },
        department: "Parks & Urban Forestry",
        assignedOfficer: "Ranger Ellis Moreau",
        author: "Priya S.",
        reporterInitials: "PS",
        isAnonymous: false,
        street: "1005 Brimley Rd",
        city: "Toronto",
        address: "1005 Brimley Rd, north playground area",
        postalCode: "M1P 3E9",
        latitude: 43.75696,
        longitude: -79.25591,
        updatedAt: "2 days ago",
        details: [
            "One of the four swings at the north playground has a snapped chain on the left side, so the seat hangs at an angle about a foot off the ground.",
            "Small children keep climbing onto it because nothing marks it as broken, and the loose chain end is at head height for a toddler.",
            "The swing was taken out of service the same day and a new chain and seat were fitted two days later.",
        ],
        statusHistory: [
            {
                id: "u6-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Broken swing reported with a photo of the snapped chain.",
                actor: "Priya S.",
                createdAt: "Oct 22, 2026 · 16:50",
            },
            {
                id: "u6-2",
                fromStatus: "pending",
                toStatus: "in_progress",
                title: "Equipment taken out of service",
                note: "Swing removed and the frame taped off pending replacement parts.",
                actor: "Ranger Ellis Moreau",
                createdAt: "Oct 22, 2026 · 19:15",
            },
            {
                id: "u6-3",
                fromStatus: "in_progress",
                toStatus: "resolved",
                title: "Swing replaced",
                note: "New chain and seat installed, and the full set was inspected for wear.",
                actor: "Parks & Urban Forestry",
                createdAt: "Oct 24, 2026 · 10:30",
            },
        ],
    },
    {
        id: "7",
        trackingCode: "OCV-2024-001239",
        date: "Oct 21, 2026",
        tag: "Water & Sewer",
        tagBg: "bg-tag-blue-bg",
        tagText: "text-tag-blue-text",
        location: "Ellesmere Rd, Scarborough",
        title: "Water main leak flooding the curb lane",
        desc: "Clean water has been running from under the pavement for three days straight.",
        commentCount: 5,
        likeCount: 19,
        viewCount: 402,
        media: [
            {
                type: "image",
                storageKey: "/road_surface .jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 824320,
                durationSecs: null,
                sortOrder: 0,
            },
            {
                type: "image",
                storageKey: "/residential_street.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 648452,
                durationSecs: null,
                sortOrder: 1,
            },
        ],
        feed: "Latest",
        status: "in_progress",
        priority: "critical",
        ward: { name: "Ward 25 (Scarborough Rouge Park)", code: "ward-25" },
        department: "Water & Sewerage Board",
        assignedOfficer: "Eng. Hannah Whitfield",
        author: "Tomas V.",
        reporterInitials: "TV",
        isAnonymous: false,
        street: "2740 Ellesmere Rd",
        city: "Toronto",
        address: "2740 Ellesmere Rd, west of Neilson Rd",
        postalCode: "M1C 1T1",
        latitude: 43.791643,
        longitude: -79.167027,
        updatedAt: "4 hours ago",
        details: [
            "Clear water has been running continuously from a crack in the curb lane for three days, even with no rain. The flow is steady enough to keep a channel of water along the gutter for most of the block.",
            "The asphalt around the crack is beginning to sink, and there is a soft spot roughly a metre wide that moves under a car tire.",
            "Two houses on this stretch reported lower water pressure starting the same morning the leak appeared.",
        ],
        statusHistory: [
            {
                id: "u7-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Continuous water flow reported with a note about reduced pressure nearby.",
                actor: "Tomas V.",
                createdAt: "Oct 21, 2026 · 06:48",
            },
            {
                id: "u7-2",
                fromStatus: "pending",
                toStatus: "in_progress",
                title: "Leak confirmed and lane closed",
                note: "Acoustic survey located a break on the 150 mm main. Curb lane closed and excavation permit filed.",
                actor: "Eng. Hannah Whitfield",
                createdAt: "Oct 21, 2026 · 15:22",
            },
            {
                id: "u7-3",
                fromStatus: "in_progress",
                toStatus: "in_progress",
                title: "Repair crew mobilised",
                note: "Excavation underway. A short shutoff is planned for the block during the repair.",
                actor: "Water & Sewerage Board",
                createdAt: "Oct 26, 2026 · 08:00",
            },
        ],
    },
    {
        id: "8",
        trackingCode: "OCV-2024-001238",
        date: "Oct 20, 2026",
        tag: "Transit & Mobility",
        tagBg: "bg-tag-amber-bg",
        tagText: "text-tag-amber-text",
        location: "Eglinton Ave E, Scarborough",
        title: "Broken bus shelter glass",
        desc: "The glass panel on the west-facing side of the shelter is shattered.",
        commentCount: 3,
        likeCount: 4,
        viewCount: 156,
        media: [
            {
                type: "image",
                storageKey: "/isue.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 590118,
                durationSecs: null,
                sortOrder: 0,
            },
            {
                type: "image",
                storageKey: "/street_light.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 687210,
                durationSecs: null,
                sortOrder: 1,
            },
            {
                type: "image",
                storageKey: "/uneven_concrete.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 712033,
                durationSecs: null,
                sortOrder: 2,
            },
        ],
        feed: "Map View",
        status: "resolved",
        priority: "low",
        ward: { name: "Ward 21 (Scarborough Centre)", code: "ward-21" },
        department: "Transit & Mobility Office",
        assignedOfficer: "Coord. Felix Nunez",
        author: "Wei L.",
        reporterInitials: "WL",
        isAnonymous: false,
        street: "1780 Eglinton Ave E",
        city: "Toronto",
        address: "1780 Eglinton Ave E, eastbound shelter",
        postalCode: "M1L 2T3",
        latitude: 43.725467,
        longitude: -79.305108,
        updatedAt: "5 days ago",
        details: [
            "The rear panel of the eastbound shelter is shattered, with most of the glass still held in the frame and a spread of fragments across the concrete pad and the grass behind it.",
            "With the panel gone the bench offers no protection from wind or rain, and riders have been standing out at the curb instead of using the shelter.",
            "The pad was swept and a replacement panel was fitted the following week.",
        ],
        statusHistory: [
            {
                id: "u8-1",
                fromStatus: null,
                toStatus: "pending",
                title: "Report submitted",
                note: "Shattered shelter panel reported; loose shards were near the bench.",
                actor: "Wei L.",
                createdAt: "Oct 20, 2026 · 07:30",
            },
            {
                id: "u8-2",
                fromStatus: "pending",
                toStatus: "in_progress",
                title: "Glass cleared from the site",
                note: "Hazard sweep completed and the panel measured for a replacement order.",
                actor: "Coord. Felix Nunez",
                createdAt: "Oct 20, 2026 · 13:05",
            },
            {
                id: "u8-3",
                fromStatus: "in_progress",
                toStatus: "resolved",
                title: "Panel replaced",
                note: "New tempered glass fitted and the shelter inspected for safety.",
                actor: "Transit & Mobility Office",
                createdAt: "Oct 21, 2026 · 09:45",
            },
        ],
    },
];

type FeedPost = (typeof feedPosts)[number];

function feedPostToReport(post: FeedPost): Report {
    const firstResolved = [...post.statusHistory]
        .reverse()
        .find((entry) => entry.toStatus === "resolved");
    const lastChanged = post.statusHistory.at(-1)?.createdAt ?? post.date;

    return {
        id: post.id,
        trackingCode: post.trackingCode,
        title: post.title,
        description: [post.desc, ...post.details].join("\n\n"),
        status: post.status as ReportStatus,
        priority: post.priority as Priority,
        isAnonymous: post.isAnonymous,
        category: categoryFor(post.tag),
        ward: { id: post.ward.code, name: post.ward.name, code: post.ward.code },
        department: { id: "", name: post.department },
        author: { id: "", name: post.author, avatarUrl: null },
        assignedOfficer:
            post.assignedOfficer && post.assignedOfficer !== "Unassigned"
                ? { id: "", name: post.assignedOfficer }
                : null,
        street: post.street,
        city: post.city,
        address: post.address,
        postalCode: post.postalCode,
        latitude: post.latitude,
        longitude: post.longitude,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        likedByMe: false,
        media: post.media.map((item) => toReportMedia(post.id, item)),
        // The resolvedAt column is whatever the status timeline reached.
        resolvedAt: firstResolved ? toIso(firstResolved.createdAt) : null,
        createdAt: toIso(post.date),
        updatedAt: toIso(lastChanged),
    };
}

/** The landing page's feed of reports, in the API's `Report` shape. */
export const posts: Report[] = feedPosts.map(feedPostToReport);

// The curated status history, keyed for the seed: post_status_history seeds
// from these rather than from something synthesised at seed time.
export const postTimelines: { postId: string; entries: TimelineEntry[] }[] = feedPosts.map(
    (post) => ({
        postId: post.id,
        entries: post.statusHistory.map((entry) => ({
            id: entry.id,
            fromStatus: entry.fromStatus as ReportStatus | null,
            toStatus: entry.toStatus as ReportStatus,
            title: entry.title,
            note: entry.note,
            actor: entry.actor ? { id: "", name: entry.actor } : null,
            createdAt: toIso(entry.createdAt),
        })),
    }),
);

// ── Issue Comments (raw) ───────────────────────────────────
const feedComments = [
    {
        id: "c1",
        postId: "1",
        author: "Derek Mensah",
        initials: "DM",
        role: "Resident",
        createdAt: "4 hours ago",
        message:
            "Hit this on Saturday night and bent a rim. There is no warning at all once it rains and the hole fills up. Thanks for filing it with the video, that shows the depth much better than a photo.",
        likeCount: 14,
        replies: [
            {
                id: "c1-r1",
                postId: "1",
                author: "Amina R.",
                initials: "AR",
                role: "Resident",
                createdAt: "3 hours ago",
                message:
                    "Sorry to hear that. Keep the repair invoice — the claims desk asked me for mine when I reported the damage last month.",
                likeCount: 5,
            },
        ],
    },
    {
        id: "c2",
        postId: "1",
        author: "Eng. Daniel Okafor",
        initials: "DO",
        role: "Municipal Officer",
        createdAt: "2 hours ago",
        message:
            "Transportation Services has this one. Cones are up as of this afternoon and the section is booked for hot-mix resurfacing in the next dry window rather than another cold patch. I will post here once the crew is on site.",
        likeCount: 31,
        isOfficial: true,
    },
    {
        id: "c3",
        postId: "1",
        author: "Shelly Vance",
        initials: "SV",
        role: "Local Business",
        createdAt: "6 hours ago",
        message:
            "Our delivery vans use this lane every morning. Could the crew also look at the smaller cracks about ten metres east? They are heading the same way this one did.",
        likeCount: 9,
        replies: [
            {
                id: "c3-r1",
                postId: "1",
                author: "Insp. Laila Haque",
                initials: "LH",
                role: "Field Inspector",
                createdAt: "5 hours ago",
                message:
                    "Noted during the site visit. The whole stretch between the driveway and the bus pad is in the same work order, so those cracks are covered.",
                likeCount: 12,
                isOfficial: true,
            },
        ],
    },
    {
        id: "c4",
        postId: "1",
        author: "Owen Brar",
        initials: "OB",
        role: "Resident",
        createdAt: "8 hours ago",
        message:
            "Cyclists are swerving into the live lane to get around it, which feels more dangerous than the hole itself. Glad this is moving.",
        likeCount: 7,
    },
    {
        id: "c5",
        postId: "1",
        author: "Councillor Mira Ahmed",
        initials: "MA",
        role: "Ward Councillor",
        createdAt: "1 hour ago",
        message:
            "My office is tracking this alongside two similar reports on Finch. If the resurfacing slips past this week, email us and we will push for an interim barrier.",
        likeCount: 22,
        isOfficial: true,
    },
    {
        id: "c6",
        postId: "2",
        author: "Helena Cruz",
        initials: "HC",
        role: "Resident",
        createdAt: "5 hours ago",
        message:
            "Same every storm. I measured it on Sunday and the water sat about 15 cm deep at the low point, right where people step off the sidewalk.",
        likeCount: 18,
        replies: [
            {
                id: "c6-r1",
                postId: "2",
                author: "Marcus D.",
                initials: "MD",
                role: "Resident",
                createdAt: "4 hours ago",
                message:
                    "That matches what I saw. If you have photos from Sunday, adding them here would help — the more dates on file, the harder it is to call this a one-off.",
                likeCount: 6,
            },
        ],
    },
    {
        id: "c7",
        postId: "2",
        author: "Raj Patel",
        initials: "RP",
        role: "Local Business",
        createdAt: "7 hours ago",
        message:
            "Customers cannot reach our entrance for a couple of hours after every heavy rain. We have swept the grate ourselves twice, but it clogs again almost immediately.",
        likeCount: 11,
    },
    {
        id: "c8",
        postId: "2",
        author: "Intake Desk",
        initials: "ID",
        role: "Municipal Officer",
        createdAt: "6 hours ago",
        message:
            "Logged as critical because of standing water on an active roadway. A catch basin inspection has been requested; the crew will confirm whether the blockage is at the grate or further down the lateral.",
        likeCount: 15,
        isOfficial: true,
    },
    {
        id: "c9",
        postId: "2",
        author: "Nina Sorensen",
        initials: "NS",
        role: "Resident",
        createdAt: "2 hours ago",
        message:
            "Worth checking the basin across the street too. It drains fine, which makes me think the problem is specific to the one on this corner.",
        likeCount: 4,
    },
    {
        id: "c10",
        postId: "3",
        author: "Albert Fung",
        initials: "AF",
        role: "Resident",
        createdAt: "1 day ago",
        message:
            "I catch the 84 here every morning and the lifted slab was easy to miss in the dark. The new surface is level now — much better for anyone boarding with a walker.",
        likeCount: 13,
        replies: [
            {
                id: "c10-r1",
                postId: "3",
                author: "Supt. Priya Menon",
                initials: "PM",
                role: "Municipal Officer",
                createdAt: "22 hours ago",
                message:
                    "Thanks for confirming. The slabs were relaid level with the boarding pad and photo proof is attached to the file. Flag it here if any settling shows up over the winter.",
                likeCount: 10,
                isOfficial: true,
            },
        ],
    },
    {
        id: "c11",
        postId: "3",
        author: "Grace T.",
        initials: "GT",
        role: "Resident",
        createdAt: "1 day ago",
        message:
            "Quick turnaround on this one — reported Saturday morning and the temporary wedge was in by the afternoon. Thank you to the crew.",
        likeCount: 20,
    },
    {
        id: "c12",
        postId: "3",
        author: "Lydia Novak",
        initials: "LN",
        role: "Resident",
        createdAt: "20 hours ago",
        message:
            "Could the same crew look at the stretch two stops east? The cracking pattern there looks like the early stage of this.",
        likeCount: 5,
    },
    {
        id: "c13",
        postId: "4",
        author: "Jordan Ellis",
        initials: "JE",
        role: "Resident",
        createdAt: "12 hours ago",
        message:
            "Walk past here most evenings and the gap between the two working poles is very dark. I have started crossing at the next intersection instead.",
        likeCount: 8,
    },
    {
        id: "c14",
        postId: "4",
        author: "Tech. Omar Siddiqui",
        initials: "OS",
        role: "Field Inspector",
        createdAt: "9 hours ago",
        message:
            "Circuit tested at pole MK-4471 and the ballast has failed. The replacement part is ordered; once it arrives the swap takes under an hour.",
        likeCount: 17,
        isOfficial: true,
    },
    {
        id: "c15",
        postId: "4",
        author: "Fatima Noor",
        initials: "FN",
        role: "Local Business",
        createdAt: "11 hours ago",
        message:
            "Our pharmacy closes at nine and staff have asked to be walked to their cars because of this. Appreciate the pole number being in the report.",
        likeCount: 12,
    },
    {
        id: "c16",
        postId: "5",
        author: "Beatrice Lam",
        initials: "BL",
        role: "Municipal Officer",
        createdAt: "1 day ago",
        message:
            "Collection logs for the Tuesday run are being audited. A catch-up truck is being scheduled for this block, and the overflow bags will be taken at the same time.",
        likeCount: 21,
        isOfficial: true,
    },
    {
        id: "c17",
        postId: "5",
        author: "Henry Okonjo",
        initials: "HO",
        role: "Resident",
        createdAt: "2 days ago",
        message:
            "Garbage and organics were both picked up on schedule, so it is only the recycling run skipping us. Third time this year on this block.",
        likeCount: 9,
        replies: [
            {
                id: "c17-r1",
                postId: "5",
                author: "Samuel O.",
                initials: "SO",
                role: "Resident",
                createdAt: "2 days ago",
                message:
                    "Same on my side. I have been photographing the bins each collection morning so there is a record of the dates.",
                likeCount: 6,
            },
        ],
    },
    {
        id: "c18",
        postId: "6",
        author: "Priya S.",
        initials: "PS",
        role: "Resident",
        createdAt: "2 days ago",
        message:
            "The new chain and seat are in and the rest of the set was checked at the same time. Two days from report to repair on a playground is a good result.",
        likeCount: 24,
    },
    {
        id: "c19",
        postId: "6",
        author: "Ranger Ellis Moreau",
        initials: "EM",
        role: "Municipal Officer",
        createdAt: "2 days ago",
        message:
            "Swing is back in service. If anything on this structure starts to rattle or sag, report it right away rather than waiting — chain wear tends to show up gradually.",
        likeCount: 16,
        isOfficial: true,
    },
    {
        id: "c20",
        postId: "7",
        author: "Tomas V.",
        initials: "TV",
        role: "Resident",
        createdAt: "5 hours ago",
        message:
            "Flow has not stopped since Tuesday and the soft spot in the asphalt is now wide enough that you can feel it through the steering wheel.",
        likeCount: 26,
        replies: [
            {
                id: "c20-r1",
                postId: "7",
                author: "Eng. Hannah Whitfield",
                initials: "HW",
                role: "Municipal Officer",
                createdAt: "4 hours ago",
                message:
                    "The acoustic survey put the break on the 150 mm main under that soft spot, which is why the surface is sinking. Excavation is underway and there will be a short shutoff for the block during the repair.",
                likeCount: 29,
                isOfficial: true,
            },
        ],
    },
    {
        id: "c21",
        postId: "7",
        author: "Margaret Ibe",
        initials: "MI",
        role: "Resident",
        createdAt: "8 hours ago",
        message:
            "Our pressure dropped the same morning the water appeared at the curb, so the two are almost certainly the same break.",
        likeCount: 13,
    },
    {
        id: "c22",
        postId: "7",
        author: "Victor Lau",
        initials: "VL",
        role: "Local Business",
        createdAt: "7 hours ago",
        message:
            "Please post the shutoff window here when it is set. We run a cafe on this block and need an hour of notice to fill containers.",
        likeCount: 18,
    },
    {
        id: "c23",
        postId: "7",
        author: "Councillor Mira Ahmed",
        initials: "MA",
        role: "Ward Councillor",
        createdAt: "3 hours ago",
        message:
            "Shutoff notices will be dropped at every address on the block and posted on this thread the day before. Businesses needing a longer window can contact my office.",
        likeCount: 20,
        isOfficial: true,
    },
    {
        id: "c24",
        postId: "8",
        author: "Wei L.",
        initials: "WL",
        role: "Resident",
        createdAt: "5 days ago",
        message:
            "Panel is replaced and the pad was swept clean. Riders are using the shelter again instead of standing out at the curb.",
        likeCount: 11,
    },
    {
        id: "c25",
        postId: "8",
        author: "Coord. Felix Nunez",
        initials: "FN",
        role: "Municipal Officer",
        createdAt: "5 days ago",
        message:
            "Tempered glass is in and the shelter is back in service. Reports of broken glass at transit stops are cleared the same day even when the panel takes longer to arrive.",
        likeCount: 14,
        isOfficial: true,
    },
];

type FeedComment = (typeof feedComments)[number];

function feedCommentToThread(comment: FeedComment): ReportCommentThread {
    // The raw fixtures label a commenter's relationship to a report; the
    // schema records whether they belong to a department. isOfficial becomes
    // departmentId, which is what the frontend's "Official" badge reads.
    const isOfficial = comment.isOfficial === true;

    return {
        id: comment.id,
        postId: comment.postId,
        message: comment.message,
        likeCount: comment.likeCount,
        likedByMe: false,
        author: {
            id: "",
            name: comment.author,
            avatarUrl: null,
            // The DB has just `user` and `super_admin`. A commenter who belongs
            // to a department is still a `user`; the "Official" badge reads
            // departmentId, not role.
            role: "user",
            departmentId: isOfficial ? "1" : null,
        },
        createdAt: toIsoFromRelative(comment.createdAt),
        updatedAt: toIsoFromRelative(comment.createdAt),
        replies: (comment.replies ?? []).map(feedCommentToThread),
    };
}

export const postComments: ReportCommentThread[] = feedComments.map(feedCommentToThread);

// ── Recent Activity ────────────────────────────────────────
export const activities: ActivityItem[] = [
    {
        id: "1",
        title: "New post on Roads",
        code: "OCV-2024-001245",
        time: "5 min ago",
        icon: Road,
        iconBg: "bg-tag-blue-bg",
        iconColor: "text-tag-blue-text",
    },
    {
        id: "2",
        title: "New comment on Flooding",
        code: "OCV-2024-001238",
        time: "18 min ago",
        icon: Building2,
        iconBg: "bg-tag-blue-bg",
        iconColor: "text-tag-blue-text",
    },
    {
        id: "3",
        title: "New post on Parks",
        code: "OCV-2024-001240",
        time: "1 hour ago",
        icon: Trees,
        iconBg: "bg-tag-green-bg",
        iconColor: "text-tag-green-text",
    },
    {
        id: "4",
        title: "New comment on Streetlights",
        code: "OCV-2024-001230",
        time: "2 hours ago",
        icon: Lightbulb,
        iconBg: "bg-tag-amber-bg",
        iconColor: "text-tag-amber-text",
    },
    {
        id: "5",
        title: "New post on Water & Sewer",
        code: "OCV-2024-001239",
        time: "3 hours ago",
        icon: Droplets,
        iconBg: "bg-tag-blue-bg",
        iconColor: "text-tag-blue-text",
    },
];

// ── Community Activity ─────────────────────────────────────
export const stats: StatItem[] = [
    {
        title: "Total Posts",
        sub: "This Year",
        value: "1,248",
        icon: MessageSquare,
        cardBg: "bg-tag-blue-bg/40",
        circleBg: "bg-tag-blue-bg",
        iconColor: "text-primary",
        valueColor: "text-[#1e3a8a]",
    },
    {
        title: "Comments",
        sub: "This Year",
        value: "3,892",
        icon: MessageCircle,
        cardBg: "bg-tag-green-bg/40",
        circleBg: "bg-tag-green-bg",
        iconColor: "text-tag-green-text",
        valueColor: "text-[#064e3b]",
    },
    {
        title: "Active Users",
        sub: "This Year",
        value: "410",
        icon: Users,
        cardBg: "bg-tag-amber-bg/40",
        circleBg: "bg-tag-amber-bg",
        iconColor: "text-tag-amber-text",
        valueColor: "text-tag-amber-text",
    },
    {
        title: "Posts This Month",
        sub: "vs. Last Month",
        badge: "↑ 12%",
        value: "105",
        icon: Calendar,
        cardBg: "bg-purple-50/60",
        circleBg: "bg-purple-100",
        iconColor: "text-purple-600",
        valueColor: "text-purple-900",
    },
];

export const chartMonths: ChartMonth[] = [
    { month: "Jan", val: 38 },
    { month: "Feb", val: 52 },
    { month: "Mar", val: 65 },
    { month: "Apr", val: 72 },
    { month: "May", val: 88 },
    { month: "Jun", val: 60 },
    { month: "Jul", val: 102 },
    { month: "Aug", val: 125 },
    { month: "Sep", val: 152 },
    { month: "Oct", val: 168 },
    { month: "Nov", val: 138 },
    { month: "Dec", val: 116 },
];

export const yTicks: number[] = [200, 150, 100, 50, 0];

// ── About Page FAQs ────────────────────────────────────────
export const faqs = [
    {
        question: "How do I report an infrastructure issue on this platform?",
        answer: "Simply click on the 'Report an Issue' button, upload a photo or video of the problem, drop the location pin on the interactive map, add a brief description, and submit. The report will automatically route to the relevant authority.",
    },
    {
        question: "How long does it take for an reported issue to be resolved?",
        answer: "Initial review and acknowledgement usually happen within 24 to 48 hours. The actual repair timeframe depends on the issue category and priority, but you can track live status updates on your dashboard.",
    },
    {
        question: "Can other citizens support or upvote my report?",
        answer: "Yes! Neighboring residents can upvote reported issues to highlight urgency. Reports with high community upvotes get prioritized by municipal field inspection teams.",
    },
    {
        question: "Is my personal identity publicly visible when I post a report?",
        answer: "You can choose to keep your profile anonymous when submitting reports. Your location and issue details will be public, but your personal contact details remain private and secure.",
    },
    {
        question: "What types of issues can I report here?",
        answer: "You can report potholes, broken streetlights, illegal waste dumping, blocked drainage lines, damaged water pipes, traffic sign issues, and other public infrastructure problems.",
    },
];

// ── Report Issue Page ──────────────────────────────────────
export const MINI_FAQS = [
    {
        q: "How are submitted issues verified?",
        a: "Our field team reviews location accuracy and cross-checks photo evidence within 12-24 hours.",
    },
    {
        q: "How long does repair usually take?",
        a: "High priority hazards are addressed within 24–48 hours, while general repairs take 3–5 working days.",
    },
    {
        q: "How will I know when it's resolved?",
        a: "You will receive an automated email notification with photo proof once the field inspector updates the status.",
    },
];

// ── Reports Page (raw) ─────────────────────────────────────
const feedReports = [
    {
        id: "r1",
        trackingCode: "OCV-982410",
        title: "Major pothole hazard at the Kennedy Station bus loop",
        category: "Roads",
        ward: { name: "Ward 20 (Scarborough Southwest)", code: "ward-20" },
        location: "Transway Cres, Scarborough",
        street: "Transway Cres",
        city: "Toronto",
        address: "Transway Cres, at the Kennedy Station bus loop entrance",
        postalCode: "M1K 3N7",
        latitude: 43.732498,
        longitude: -79.263701,
        status: "in_progress",
        priority: "high",
        date: "2026-09-28",
        description:
            "Large deep pothole causing severe traffic slowdowns and potential accidents during rainy hours. Immediate resurfacing required.",
        likeCount: 18,
        commentCount: 0,
        viewCount: 412,
        isAnonymous: false,
        department: "Transportation Services",
        media: [
            {
                type: "image",
                storageKey:
                    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 1046100,
                durationSecs: null,
                sortOrder: 0,
            },
        ],
        assignedOfficer: "Eng. Kamrul Hasan",
        updatedAt: "2 hours ago",
    },
    {
        id: "r2",
        trackingCode: "OCV-982398",
        title: "Broken LED street lights along Danforth Ave",
        category: "Streetlights & Signals",
        ward: { name: "Ward 19 (Beaches East York)", code: "ward-19" },
        location: "Danforth Ave, East York",
        street: "1904 Danforth Ave",
        city: "Toronto",
        address: "1904 Danforth Ave, between Woodbine Ave and Cedarvale Ave",
        postalCode: "M4C 1J4",
        latitude: 43.685027,
        longitude: -79.316616,
        status: "resolved",
        priority: "medium",
        date: "2026-09-25",
        description:
            "Entire row of streetlights flickering and dark at night, posing safety concerns for night commuters.",
        likeCount: 14,
        commentCount: 0,
        viewCount: 268,
        isAnonymous: false,
        department: "Electrical Safety Cell",
        media: [
            {
                type: "image",
                storageKey:
                    "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=600&auto=format&fit=crop",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 982400,
                durationSecs: null,
                sortOrder: 0,
            },
        ],
        assignedOfficer: "Sub-Inspector Rafiqul T.",
        updatedAt: "1 day ago",
    },
    {
        id: "r3",
        trackingCode: "OCV-982350",
        title: "Overflowing waste bins at the Cedarbrook Park gate",
        category: "Waste & Recycling",
        ward: { name: "Ward 24 (Scarborough Guildwood)", code: "ward-24" },
        location: "Cedarbrook Park, Scarborough",
        street: null,
        city: "Toronto",
        address: "Cedarbrook Park, east gate off Markham Rd",
        postalCode: "M1J 3A7",
        latitude: 43.753952,
        longitude: -79.225741,
        status: "pending",
        priority: "critical",
        date: "2026-09-30",
        description:
            "Garbage container unemptied for 4 days. Waste spreading across sidewalk creating unhygienic environment.",
        likeCount: 21,
        commentCount: 0,
        viewCount: 735,
        isAnonymous: false,
        department: "Sanitation & Waste Management",
        media: [
            {
                type: "image",
                storageKey:
                    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 1215300,
                durationSecs: null,
                sortOrder: 0,
            },
        ],
        assignedOfficer: "Unassigned",
        updatedAt: "3 hours ago",
    },
    {
        id: "r4",
        trackingCode: "OCV-982210",
        title: "Blocked storm drain flooding the Agincourt Mall service lane",
        category: "Stormwater & Flooding",
        ward: { name: "Ward 22 (Scarborough Agincourt)", code: "ward-22" },
        location: "Sheppard Ave E, Scarborough",
        street: "3850 Sheppard Ave E",
        city: "Toronto",
        address: "3850 Sheppard Ave E, service lane behind the loading bays",
        postalCode: "M1T 3L4",
        latitude: 43.783924,
        longitude: -79.292929,
        status: "resolved",
        priority: "high",
        date: "2026-09-20",
        description:
            "Clogged main storm drain causing severe standing water after light rainfall. Impeding shopkeeper operations.",
        likeCount: 17,
        commentCount: 0,
        viewCount: 390,
        isAnonymous: false,
        department: "Water & Sewerage Board",
        media: [
            {
                type: "image",
                storageKey: "/residential_street.jpeg",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 648452,
                durationSecs: null,
                sortOrder: 0,
            },
        ],
        assignedOfficer: "Superintendent M. Rahim",
        updatedAt: "4 days ago",
    },
    {
        id: "r5",
        trackingCode: "OCV-982115",
        title: "Damaged benches and bent fencing at Milliken Park",
        category: "Parks & Recreation",
        ward: { name: "Ward 23 (Scarborough North)", code: "ward-23" },
        location: "Milliken Park, Scarborough",
        street: "5555 Steeles Ave E",
        city: "Toronto",
        address: "5555 Steeles Ave E, walkway south of the pond",
        postalCode: "M1V 4P1",
        latitude: 43.83152,
        longitude: -79.27116,
        status: "pending",
        priority: "low",
        date: "2026-09-29",
        description:
            "Vandalized wooden seating benches and bent security wire along pedestrian walk path.",
        likeCount: 9,
        commentCount: 0,
        viewCount: 156,
        isAnonymous: false,
        department: "Parks & Urban Forestry",
        media: [
            {
                type: "image",
                storageKey:
                    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=600&auto=format&fit=crop",
                thumbnailKey: null,
                mimeType: "image/jpeg",
                sizeBytes: 1130840,
                durationSecs: null,
                sortOrder: 0,
            },
        ],
        assignedOfficer: "Unassigned",
        updatedAt: "1 day ago",
    },
];

type FeedReport = (typeof feedReports)[number];

function feedReportToReport(report: FeedReport): Report {
    return {
        id: report.id,
        trackingCode: report.trackingCode,
        title: report.title,
        description: report.description,
        status: report.status as ReportStatus,
        priority: report.priority as Priority,
        isAnonymous: report.isAnonymous ?? false,
        category: categoryFor(report.category),
        ward: { id: report.ward.code, name: report.ward.name, code: report.ward.code },
        department: { id: "", name: report.department },
        author: null,
        assignedOfficer:
            report.assignedOfficer && report.assignedOfficer !== "Unassigned"
                ? { id: "", name: report.assignedOfficer }
                : null,
        street: report.street,
        city: report.city,
        address: report.address,
        postalCode: report.postalCode,
        latitude: report.latitude,
        longitude: report.longitude,
        viewCount: report.viewCount,
        likeCount: report.likeCount,
        commentCount: report.commentCount,
        likedByMe: false,
        media: report.media.map((item) => toReportMedia(report.id, item)),
        // This fixture set carries no status timeline, so it has nothing to
        // derive a resolvedAt from.
        resolvedAt: null,
        createdAt: toIso(report.date),
        updatedAt: toIsoFromRelative(report.updatedAt),
    };
}

export const initialReports: Report[] = feedReports.map(feedReportToReport);

// The filter lists below mirror the categories, statuses and wards tables.
// They are derived from (or kept in step with) the fixture sets above so that
// no filter value can exist that no row uses.
export const reportCategories = categories
    .filter((cat) => cat.id !== "all")
    .map((cat) => ({ slug: cat.id, name: cat.name }));

export const reportStatuses = ["pending", "in_progress", "resolved", "rejected"];

export const reportWards = [
    { code: "ward-07", name: "Ward 07 (Humber River Black Creek)" },
    { code: "ward-16", name: "Ward 16 (Don Valley East)" },
    { code: "ward-19", name: "Ward 19 (Beaches East York)" },
    { code: "ward-20", name: "Ward 20 (Scarborough Southwest)" },
    { code: "ward-21", name: "Ward 21 (Scarborough Centre)" },
    { code: "ward-22", name: "Ward 22 (Scarborough Agincourt)" },
    { code: "ward-23", name: "Ward 23 (Scarborough North)" },
    { code: "ward-24", name: "Ward 24 (Scarborough Guildwood)" },
    { code: "ward-25", name: "Ward 25 (Scarborough Rouge Park)" },
];
export const mockSuggestions: SearchSuggestion[] = [
    {
        id: "1",
        title: "Major pothole hazard at the Kennedy Station bus loop",
        category: "Roads",
        location: "Ward 20",
        type: "report",
    },
    {
        id: "2",
        title: "Broken LED street lights along Danforth Ave",
        category: "Streetlights & Signals",
        location: "Ward 19",
        type: "report",
    },
    {
        id: "3",
        title: "Overflowing waste bins at the Cedarbrook Park gate",
        category: "Waste & Recycling",
        location: "Ward 24",
        type: "report",
    },
    {
        id: "4",
        title: "Flooding during heavy rain",
        category: "Stormwater & Flooding",
        location: "Ward 24",
        type: "post",
    },
    {
        id: "5",
        title: "Annual Clean City Volunteers Meetup",
        category: "Community & Safety",
        location: "Scarborough Civic Centre",
        type: "announcement",
    },
    {
        id: "6",
        title: "New Recycling Program Launch",
        category: "Waste & Recycling",
        location: "Ward 20",
        type: "announcement",
    },
    {
        id: "7",
        title: "Community Safety Awareness Campaign",
        category: "Community & Safety",
        location: "Ward 21",
        type: "post",
    },
    {
        id: "8",
        title: "Stormwater Drainage Maintenance Schedule",
        category: "Stormwater & Flooding",
        location: "Ward 22",
        type: "post",
    },
    {
        id: "9",
        title: "Public Park Renovation Updates",
        category: "Parks & Recreation",
        location: "Ward 23",
        type: "announcement",
    },
    {
        id: "10",
        title: "Streetlight not working",
        category: "Streetlights & Signals",
        location: "Ward 24",
        type: "report",
    },
];

export const topLocations: LocationItem[] = [
    {
        id: "1",
        name: "Ward 20",
        subTitle: "Scarborough Southwest",
        reportsCount: 24,
        image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=800&auto=format&fit=crop",
        slug: "ward-20",
    },
    {
        id: "2",
        name: "Ward 21",
        subTitle: "Scarborough Centre",
        reportsCount: 18,
        image: "/residential_street.jpeg",
        slug: "ward-21",
    },
    {
        id: "3",
        name: "Ward 22",
        subTitle: "Scarborough Agincourt",
        reportsCount: 12,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
        slug: "ward-22",
    },
    {
        id: "4",
        name: "Ward 24",
        subTitle: "Scarborough Guildwood",
        reportsCount: 9,
        image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop",
        slug: "ward-24",
    },
];

export const steps: StepItem[] = [
    {
        step: "01",
        title: "Report an Issue",
        description:
            "Take a picture or video of the issue (pothole, broken light, waste), select location & post it directly.",
        icon: Camera,
        badgeText: "Quick Snap & Post",
    },
    {
        step: "02",
        title: "Track & Verify Progress",
        description:
            "Citizens upvote the issue while municipal admins and officials review, assign, and update status in real-time.",
        icon: SearchCheck,
        badgeText: "Real-time Tracking",
    },
    {
        step: "03",
        title: "Resolved Together",
        description:
            "Once fixed, authority uploads completion proof. The community marks it solved and celebrates a better city.",
        icon: CheckCircle2,
        badgeText: "City Improved",
    },
];
