import {
    LayoutGrid,
    Road,
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
} from "lucide-react";
import type {
    ActivityItem,
    CategoryItem,
    ChartMonth,
    CivicReport,
    NavItem,
    PostItem,
    StatItem,
    WardData,
    SearchSuggestion
} from "@/types";

// ── Navigation ──────────────────────────────────────────────
export const navItems: NavItem[] = [
    { name: "Home", href: "/" },
    { name: "Issues Map", href: "/issues" },
    { name: "Reports", href: "/reports" },
    { name: "Statistics", href: "/statistics" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
];

// ── Category Filter ─────────────────────────────────────────
export const categories: CategoryItem[] = [
    { id: "all", label: "All", icon: LayoutGrid, iconColor: "text-primary" },
    { id: "roads", label: "Roads", icon: Road, iconColor: "text-foreground" },
    { id: "water", label: "Water & Sewer", icon: Droplets, iconColor: "text-primary" },
    { id: "stormwater", label: "Stormwater & Flooding", icon: CloudRain, iconColor: "text-primary" },
    { id: "parks", label: "Parks & Recreation", icon: Trees, iconColor: "text-tag-green-text" },
    { id: "waste", label: "Waste & Recycling", icon: Trash2, iconColor: "text-tag-green-text" },
    { id: "streetlights", label: "Streetlights & Signals", icon: Lightbulb, iconColor: "text-foreground" },
    { id: "buildings", label: "Buildings & Facilities", icon: Building2, iconColor: "text-foreground" },
    { id: "transit", label: "Transit & Mobility", icon: Bus, iconColor: "text-primary" },
    { id: "environment", label: "Environment", icon: TreePine, iconColor: "text-tag-green-text" },
    { id: "community", label: "Community & Safety", icon: Users, iconColor: "text-primary" },
    { id: "other", label: "Other", icon: MoreHorizontal, isOther: true },
];

// ── Recent Posts ────────────────────────────────────────────
export const tabs: string[] = ["Latest", "Most Commented", "Nearby", "Map View"];

export const posts: PostItem[] = [
    {
        id: "1",
        code: "#2024-001245",
        date: "Oct 26, 2026",
        tag: "Roads",
        tagBg: "bg-tag-blue-bg",
        tagText: "text-tag-blue-text",
        location: "Finch Ave E, Scarborough",
        title: "Large pothole causing traffic issues",
        desc: "This pothole has been getting bigger and is causing vehicle damage.",
        comments: 12,
        likes: 8,
        views: 245,
        image: "/road_surface .jpeg",
        video: "https://lorem.video/1280x720_h264_20s_30fps",
        isVideo: true,
        duration: "0:32",
        category: "Latest",
    },
    {
        id: "2",
        code: "#2024-001244",
        date: "Oct 26, 2026",
        tag: "Stormwater & Flooding",
        tagBg: "bg-tag-blue-bg",
        tagText: "text-tag-blue-text",
        location: "Morningside Ave, Scarborough",
        title: "Flooding during heavy rain",
        desc: "Water is not draining properly on this street after rain.",
        comments: 7,
        likes: 5,
        views: 180,
        image: "/residential_street.jpeg",
        category: "Most Commented",
    },
    {
        id: "3",
        code: "#2024-001243",
        date: "Oct 25, 2026",
        tag: "Sidewalks",
        tagBg: "bg-tag-green-bg",
        tagText: "text-tag-green-text",
        location: "Sheppard Ave W, North York",
        title: "Broken sidewalk near bus stop",
        desc: "The sidewalk is cracked and unsafe for pedestrians.",
        comments: 3,
        likes: 6,
        views: 95,
        image: "/uneven_concrete.jpeg",
        category: "Nearby",
    },
    {
        id: "4",
        code: "#2024-001242",
        date: "Oct 24, 2026",
        tag: "Streetlights & Signals",
        tagBg: "bg-tag-amber-bg",
        tagText: "text-tag-amber-text",
        location: "Markham Rd, Scarborough",
        title: "Streetlight not working",
        desc: "This streetlight has been out for over a week.",
        comments: 4,
        likes: 3,
        views: 120,
        image: "/street_light.jpeg",
        category: "Map View",
    },
];

// ── Recent Activity ────────────────────────────────────────
export const activities: ActivityItem[] = [
    {
        id: "1",
        title: "New post on Roads",
        code: "#2024-001245",
        time: "5 min ago",
        icon: Road,
        iconBg: "bg-tag-blue-bg",
        iconColor: "text-tag-blue-text",
    },
    {
        id: "2",
        title: "New comment on Flooding",
        code: "#2024-001238",
        time: "18 min ago",
        icon: Building2,
        iconBg: "bg-tag-blue-bg",
        iconColor: "text-tag-blue-text",
    },
    {
        id: "3",
        title: "New post on Parks",
        code: "#2024-001240",
        time: "1 hour ago",
        icon: Trees,
        iconBg: "bg-tag-green-bg",
        iconColor: "text-tag-green-text",
    },
    {
        id: "4",
        title: "New comment on Streetlights",
        code: "#2024-001230",
        time: "2 hours ago",
        icon: Lightbulb,
        iconBg: "bg-tag-amber-bg",
        iconColor: "text-tag-amber-text",
    },
    {
        id: "5",
        title: "New post on Water & Sewer",
        code: "#2024-001239",
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
        answer:
            "Simply click on the 'Report an Issue' button, upload a photo or video of the problem, drop the location pin on the interactive map, add a brief description, and submit. The report will automatically route to the relevant authority.",
    },
    {
        question: "How long does it take for an reported issue to be resolved?",
        answer:
            "Initial review and acknowledgement usually happen within 24 to 48 hours. The actual repair timeframe depends on the issue category and priority, but you can track live status updates on your dashboard.",
    },
    {
        question: "Can other citizens support or upvote my report?",
        answer:
            "Yes! Neighboring residents can upvote reported issues to highlight urgency. Reports with high community upvotes get prioritized by municipal field inspection teams.",
    },
    {
        question: "Is my personal identity publicly visible when I post a report?",
        answer:
            "You can choose to keep your profile anonymous when submitting reports. Your location and issue details will be public, but your personal contact details remain private and secure.",
    },
    {
        question: "What types of issues can I report here?",
        answer:
            "You can report potholes, broken streetlights, illegal waste dumping, blocked drainage lines, damaged water pipes, traffic sign issues, and other public infrastructure problems.",
    },
];

// ── Report Issue Page ──────────────────────────────────────
export const REPORT_CATEGORIES = [
    "Roads & Potholes",
    "Street Lighting",
    "Waste Management & Garbage",
    "Drainage & Waterlogging",
    "Water Supply & Leakage",
    "Parks & Public Spaces",
    "Traffic Signs & Signals",
    "Others",
];

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

// ── Reports Page ───────────────────────────────────────────
export const initialReports: CivicReport[] = [
    {
        id: "1",
        trackingId: "OCV-982410",
        title: "Major Pothole Hazard on Main Bypass Road",
        category: "Roads & Potholes",
        ward: "Ward 03 (Sector 4 Bypass)",
        location: "Near Sector 4 Bus Station",
        status: "In Progress",
        priority: "High",
        date: "2026-09-28",
        description:
            "Large deep pothole causing severe traffic slowdowns and potential accidents during rainy hours. Immediate resurfacing required.",
        upvotes: 142,
        commentsCount: 18,
        department: "Public Works Department",
        image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=600&auto=format&fit=crop",
        assignedOfficer: "Eng. Kamrul Hasan",
        updatedAt: "2 hours ago",
    },
    {
        id: "2",
        trackingId: "OCV-982398",
        title: "Broken LED Street Lights in Station Area",
        category: "Street Lighting",
        ward: "Ward 02 (Station Road)",
        location: "Opposite to Railway Ticket Counter",
        status: "Resolved",
        priority: "Medium",
        date: "2026-09-25",
        description:
            "Entire row of streetlights flickering and dark at night, posing safety concerns for night commuters.",
        upvotes: 89,
        commentsCount: 6,
        department: "Electrical Safety Cell",
        image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=600&auto=format&fit=crop",
        assignedOfficer: "Sub-Inspector Rafiqul T.",
        updatedAt: "1 day ago",
    },
    {
        id: "3",
        trackingId: "OCV-982350",
        title: "Overflowing Waste Bin near Public Park",
        category: "Waste Management",
        ward: "Ward 01 (Central Hub)",
        location: "Park Gate No. 2",
        status: "Pending",
        priority: "Critical",
        date: "2026-09-30",
        description:
            "Garbage container unemptied for 4 days. Waste spreading across sidewalk creating unhygienic environment.",
        upvotes: 215,
        commentsCount: 24,
        department: "Sanitation & Waste Management",
        image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop",
        assignedOfficer: "Unassigned",
        updatedAt: "3 hours ago",
    },
    {
        id: "4",
        trackingId: "OCV-982210",
        title: "Blocked Storm Drainage Outlet causing Waterlogging",
        category: "Drainage & Water",
        ward: "Ward 04 (Commercial Zone)",
        location: "Market Alley 5",
        status: "Resolved",
        priority: "High",
        date: "2026-09-20",
        description:
            "Clogged main storm drain causing severe standing water after light rainfall. Impeding shopkeeper operations.",
        upvotes: 178,
        commentsCount: 12,
        department: "Water & Sewerage Board",
        image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=600&auto=format&fit=crop",
        assignedOfficer: "Superintendent M. Rahim",
        updatedAt: "4 days ago",
    },
    {
        id: "5",
        trackingId: "OCV-982115",
        title: "Damaged Public Park Bench and Fencing",
        category: "Parks & Open Spaces",
        ward: "Ward 05 (South Suburbs)",
        location: "Community Green Park",
        status: "Pending",
        priority: "Low",
        date: "2026-09-29",
        description:
            "Vandalized wooden seating benches and bent security wire along pedestrian walk path.",
        upvotes: 45,
        commentsCount: 3,
        department: "Parks & Urban Forestry",
        image: "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=600&auto=format&fit=crop",
        assignedOfficer: "Unassigned",
        updatedAt: "1 day ago",
    },
];

export const reportCategories = [
    "All",
    "Roads & Potholes",
    "Street Lighting",
    "Waste Management",
    "Drainage & Water",
    "Parks & Open Spaces",
];

export const reportStatuses = ["All", "Pending", "In Progress", "Resolved", "Rejected"];

export const reportWards = [
    "All",
    "Ward 01 (Central Hub)",
    "Ward 02 (Station Road)",
    "Ward 03 (Sector 4 Bypass)",
    "Ward 04 (Commercial Zone)",
    "Ward 05 (South Suburbs)",
];

export const monthlyTrendData = [
    { month: "Jan", reported: 1100, resolved: 980 },
    { month: "Feb", reported: 1320, resolved: 1150 },
    { month: "Mar", reported: 1250, resolved: 1100 },
    { month: "Apr", reported: 1400, resolved: 1310 },
    { month: "May", reported: 1650, resolved: 1520 },
    { month: "Jun", reported: 1800, resolved: 1680 },
    { month: "Jul", reported: 1550, resolved: 1420 },
    { month: "Aug", reported: 1720, resolved: 1590 },
    { month: "Sep", reported: 1910, resolved: 1750 },
];

export const categoryChartData = [
    { name: "Roads & Potholes", value: 6478, color: "#3B82F6" },
    { name: "Street Lighting", value: 4310, color: "#F59E0B" },
    { name: "Waste Management", value: 2770, color: "#10B981" },
    { name: "Drainage & Water", value: 1232, color: "#06B6D4" },
    { name: "Parks & Spaces", value: 630, color: "#8B5CF6" },
];

export const departmentSLA = [
    { dept: "Public Works Department", solved: 4820, target: 5000, rate: 96.4 },
    { dept: "Electrical Safety Cell", solved: 3890, target: 4100, rate: 94.8 },
    { dept: "Sanitation & Drainage", solved: 2650, target: 3000, rate: 88.3 },
    { dept: "Water & Sewerage Board", solved: 1120, target: 1350, rate: 82.9 },
];

export const initialWardData: WardData[] = [
    { id: "W1", ward: "Ward 01 (Central Hub)", total: 3420, resolved: 3120, pending: 300, avgTimeHours: 28, slaRate: 91.2 },
    { id: "W2", ward: "Ward 02 (Station Road)", total: 4150, resolved: 3680, pending: 470, avgTimeHours: 36, slaRate: 88.6 },
    { id: "W3", ward: "Ward 03 (Sector 4 Bypass)", total: 2890, resolved: 2410, pending: 480, avgTimeHours: 52, slaRate: 83.3 },
    { id: "W4", ward: "Ward 04 (Commercial Zone)", total: 3110, resolved: 2820, pending: 290, avgTimeHours: 32, slaRate: 90.6 },
    { id: "W5", ward: "Ward 05 (South Suburbs)", total: 1850, resolved: 1550, pending: 300, avgTimeHours: 44, slaRate: 83.7 },
];

export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "12px",
};

export const mockSuggestions: SearchSuggestion[] = [
    { id: "1", title: "Major Pothole Hazard on Main Bypass Road", category: "Roads & Potholes", location: "Ward 03", type: "report" },
    { id: "2", title: "Broken LED Street Lights in Station Area", category: "Street Lighting", location: "Ward 02", type: "report" },
    { id: "3", title: "Overflowing Waste Bin near Public Park", category: "Waste Management", location: "Ward 01", type: "report" },
    { id: "4", title: "Waterlogging issues during monsoon season", category: "Drainage", location: "Ward 04", type: "post" },
    { id: "5", title: "Annual Clean City Volunteers Meetup", category: "Community", location: "Central Hall", type: "announcement" },
    { id: "6", title: "New Recycling Program Launch", category: "Waste Management", location: "Ward 05", type: "announcement" },
    { id: "7", title: "Community Safety Awareness Campaign", category: "Community", location: "Ward 02", type: "post" },
    { id: "8", title: "Stormwater Drainage Maintenance Schedule", category: "Drainage", location: "Ward 03", type: "post" },
    { id: "9", title: "Public Park Renovation Updates", category: "Parks & Recreation", location: "Ward 01", type: "announcement" },
    { id: "10", title: "Traffic Signal Malfunction Reported", category: "Traffic & Signals", location: "Ward 04", type: "report" },
];