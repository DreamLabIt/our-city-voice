"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Film, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { updateReport } from "@/app/actions/issues";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUploads } from "@/hooks/use-uploads";
import type {
    EditOption,
    EditState,
    ReportMediaInput,
    ReportPriority,
    UpdateReportInput,
} from "@/types/issues";
import type { Report, ReportMedia } from "@/types/report";
import { MediaSlot } from "@/components/report-issue/MediaSlot";

const MAX_MEDIA = 6;

const NOMINATIM_EMAIL = process.env.NEXT_PUBLIC_NOMINATIM_EMAIL;

const ADDRESS_NOT_FOUND_MESSAGE = "We couldn't find this address. Please enter a clearer address.";
const GEOCODER_UNREACHABLE_MESSAGE = "Could not reach the map service. Please check your connection and try again.";

type Coordinates = { latitude: number; longitude: number };

const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

const geocodeQuery = async (query: string): Promise<Coordinates | null> => {
    const params = new URLSearchParams({
        format: "json",
        q: query,
        limit: "1",
        countrycodes: "bd",
        "accept-language": "en",
    });

    if (NOMINATIM_EMAIL) {
        params.set("email", NOMINATIM_EMAIL);
    }

    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    );

    if (!res.ok) {
        throw new Error(`Nominatim responded with ${res.status}`);
    }

    const data: unknown = await res.json();

    if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return { latitude: lat, longitude: lon };
        }
    }

    return null;
};

const geocodeAddress = async (parts: {
    address: string;
    city: string;
    street?: string;
    postalCode?: string;
    wardName?: string;
}): Promise<Coordinates | null> => {
    const { address, city, street, postalCode, wardName } = parts;

    const attempts = [
        [street, address, wardName, city, postalCode, "Bangladesh"],
        [street, address, city, "Bangladesh"],
        [address, city, "Bangladesh"],
    ]
        .map((list) => list.filter(Boolean).join(", "))
        .filter(Boolean);

    const uniqueAttempts = [...new Set(attempts)];

    for (let i = 0; i < uniqueAttempts.length; i++) {
        const result = await geocodeQuery(uniqueAttempts[i]);
        if (result) return result;

        if (i < uniqueAttempts.length - 1) {
            await sleep(1100);
        }
    }

    return null;
};

interface EditIssueDialogProps {
    issue: Report;
    categories: EditOption[];
    wards: EditOption[];
    onClose: () => void;
}

function toEditState(issue: Report): EditState {
    return {
        title: issue.title ?? "",
        description: issue.description ?? "",
        category: issue.category?.slug ?? "",
        ward: issue.ward?.code ?? "",
        priority: issue.priority as ReportPriority,
        isAnonymous: Boolean(issue.isAnonymous),
        city: issue.city ?? "",
        address: issue.address ?? "",
        street: issue.street ?? "",
        postalCode: issue.postalCode ?? "",
    };
}

function buildDiff(original: EditState, current: EditState): UpdateReportInput {
    const diff: UpdateReportInput = {};

    if (current.title.trim() !== original.title) {
        diff.title = current.title.trim();
    }
    if (current.description.trim() !== original.description) {
        diff.description = current.description.trim();
    }
    if (current.category !== original.category) {
        diff.category = current.category;
    }
    if (current.ward !== original.ward) {
        diff.ward = current.ward;
    }
    if (current.priority !== original.priority) {
        diff.priority = current.priority;
    }
    if (current.isAnonymous !== original.isAnonymous) {
        diff.isAnonymous = current.isAnonymous;
    }

    const location: NonNullable<UpdateReportInput["location"]> = {};

    if (current.city.trim() !== original.city) {
        location.city = current.city.trim();
    }
    if (current.address.trim() !== original.address) {
        location.address = current.address.trim();
    }
    if (current.street.trim() !== original.street) {
        location.street = current.street.trim() || null;
    }
    if (current.postalCode.trim() !== original.postalCode) {
        location.postalCode = current.postalCode.trim() || null;
    }

    if (Object.keys(location).length > 0) {
        diff.location = location;
    }

    return diff;
}

function validate(form: EditState): Record<string, string> {
    const errors: Record<string, string> = {};
    const title = form.title.trim();
    const description = form.description.trim();

    if (title.length < 6 || title.length > 160) {
        errors.title = "Title must be 6 to 160 characters.";
    }
    if (description.length < 15 || description.length > 5000) {
        errors.description = "Description must be 15 to 5000 characters.";
    }
    if (!form.category) errors.category = "Category is required.";
    if (!form.ward) errors.ward = "Ward is required.";
    if (!form.city.trim() || form.city.trim().length > 80) {
        errors.city = "City is required (max 80 characters).";
    }
    if (!form.address.trim() || form.address.trim().length > 240) {
        errors.address = "Address is required (max 240 characters).";
    }
    if (form.street.trim().length > 160) {
        errors.street = "Street must not exceed 160 characters.";
    }
    if (form.postalCode.trim().length > 16) {
        errors.postalCode = "Postal code must not exceed 16 characters.";
    }

    return errors;
}

function toMediaInput(media: ReportMedia): ReportMediaInput {
    return {
        url: media.url ?? media.storageKey,
        type: media.type as ReportMediaInput["type"],
        thumbnailUrl: media.thumbnailUrl ?? null,
        mimeType: media.mimeType,
        sizeBytes: Number(media.sizeBytes) || 0,
        durationSecs: media.durationSecs ?? null,
    };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            {children}
        </label>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-xs text-destructive">{message}</p>;
}

function ExistingMediaTile({
    media,
    disabled,
    onRemove,
}: {
    media: ReportMedia;
    disabled: boolean;
    onRemove: () => void;
}) {
    const src = media.url ?? media.storageKey;
    const isVideo = media.type === "video";

    return (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border-custom bg-muted">
            {isVideo ? (
                <video
                    src={`${src}#t=0.1`}
                    className="pointer-events-none h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                />
            ) : (
                <img
                    src={src}
                    alt="Attachment"
                    className="h-full w-full object-cover"
                />
            )}

            {isVideo && (
                <Film className="pointer-events-none absolute bottom-1 left-1 h-4 w-4 text-white drop-shadow" />
            )}

            <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                aria-label="Remove attachment"
                className="absolute right-1 top-1 z-10 rounded-full bg-black/70 p-1 text-white transition-colors hover:bg-destructive disabled:opacity-50"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

export default function EditIssueDialog({
    issue,
    categories,
    wards,
    onClose,
}: EditIssueDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const original = toEditState(issue);
    const [form, setForm] = useState<EditState>(() => toEditState(issue));
    const [keptMedia, setKeptMedia] = useState<ReportMedia[]>(
        issue.media ?? [],
    );

    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState<string | undefined>(
        undefined,
    );
    const geocodeRequestRef = useRef(0);
    const pendingGeocodeRef = useRef<Promise<Coordinates | null> | null>(null);

    const uploads = useUploads({
        kind: "report-media",
        multiple: true,
        maxFiles: MAX_MEDIA,
    });

    const isBusy = isPending || uploads.isUploading || isGeocoding;

    const diff = buildDiff(original, form);
    const errors = validate(form);
    const isValid = Object.keys(errors).length === 0 && !geocodeError;

    const locationChanged = Boolean(diff.location);

    const mediaChanged =
        keptMedia.length !== (issue.media?.length ?? 0) ||
        uploads.slots.length > 0;

    const hasChanges = Object.keys(diff).length > 0 || mediaChanged;
    const totalMedia = keptMedia.length + uploads.slots.length;

    const setField = <K extends keyof EditState>(
        key: K,
        value: EditState[K],
    ): void => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const getWardName = (wardValue: string): string => {
        const found = wards.find((w) => w.value === wardValue);
        return found?.name ?? "";
    };

    const invalidateCoordinates = (): void => {
        geocodeRequestRef.current += 1;
        setIsGeocoding(false);
        setCoords(null);
        setGeocodeError(undefined);
    };

    const setLocationField = <K extends keyof EditState>(
        key: K,
        value: EditState[K],
    ): void => {
        setField(key, value);
        invalidateCoordinates();
    };

    const resolveCoordinates = async (
        values: EditState,
    ): Promise<Coordinates | null> => {
        const address = values.address.trim();
        const city = values.city.trim();

        if (!address || !city) return null;

        const requestId = ++geocodeRequestRef.current;
        setIsGeocoding(true);

        try {
            const result = await geocodeAddress({
                address,
                city,
                street: values.street.trim() || undefined,
                postalCode: values.postalCode.trim() || undefined,
                wardName: getWardName(values.ward) || undefined,
            });

            if (requestId !== geocodeRequestRef.current) return null;

            if (!result) {
                setCoords(null);
                setGeocodeError(ADDRESS_NOT_FOUND_MESSAGE);
                return null;
            }

            setCoords(result);
            setGeocodeError(undefined);
            return result;
        } catch (err) {
            console.error("Geocoding error:", err);

            if (requestId === geocodeRequestRef.current) {
                setCoords(null);
                setGeocodeError(GEOCODER_UNREACHABLE_MESSAGE);
            }
            return null;
        } finally {
            if (requestId === geocodeRequestRef.current) {
                setIsGeocoding(false);
            }
        }
    };

    const runAddressLookup = (
        values: EditState,
    ): Promise<Coordinates | null> => {
        const promise = resolveCoordinates(values);
        pendingGeocodeRef.current = promise;

        void promise.finally(() => {
            if (pendingGeocodeRef.current === promise) {
                pendingGeocodeRef.current = null;
            }
        });

        return promise;
    };

    const handleLocationBlur = (): void => {
        if (!locationChanged) return;
        if (coords) return;
        if (pendingGeocodeRef.current) return;
        if (!form.address.trim() || !form.city.trim()) return;

        void runAddressLookup(form);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const files = event.target.files;

        if (files && files.length > 0) {
            if (totalMedia + files.length > MAX_MEDIA) {
                toast.error(`You can attach up to ${MAX_MEDIA} files.`);
            } else {
                uploads.addFiles(files);
            }
        }

        event.target.value = "";
    };

    const handleSave = (): void => {
        if (!hasChanges || !isValid) return;

        startTransition(async () => {
            const payload: UpdateReportInput = { ...diff };

            if (diff.location) {
                const pendingResult = pendingGeocodeRef.current
                    ? await pendingGeocodeRef.current
                    : null;

                let resolved = pendingResult ?? coords;

                if (!resolved) {
                    resolved = await runAddressLookup(form);
                }

                if (!resolved) {
                    toast.error("Location not found", {
                        description:
                            "Please correct the address and try again.",
                    });
                    return;
                }

                payload.location = {
                    ...diff.location,
                    latitude: resolved.latitude,
                    longitude: resolved.longitude,
                };
            }

            if (mediaChanged) {
                const uploaded =
                    uploads.slots.length > 0 ? await uploads.upload() : [];

                if (uploaded === null) {
                    toast.error("File upload failed", {
                        description:
                            "Your files could not be uploaded. Please check them and try again.",
                    });
                    return;
                }

                const newItems: ReportMediaInput[] = uploaded.map((file) => ({
                    url: file.url,
                    type: file.resourceType,
                    sizeBytes: file.bytes,
                    durationSecs:
                        file.resourceType === "video"
                            ? Math.round(file.durationSeconds ?? 0)
                            : null,
                    thumbnailUrl: null,
                }));

                payload.media = [...keptMedia.map(toMediaInput), ...newItems];
            }

            const result = await updateReport(issue.trackingCode, payload);

            if (!result.success) {
                if (result.requiresAuth) {
                    toast.error("Please log in again.");
                    router.push("/login?next=/dashboard/issues");
                    return;
                }

                const detail = result.fieldErrors
                    ? Object.values(result.fieldErrors).flat().join(" ")
                    : "";

                toast.error("Failed to update report", {
                    description: detail || result.error,
                });
                return;
            }

            toast.success("Report updated.");
            onClose();
            router.refresh();
        });
    };

    const inputId = `edit-media-${issue.id}`;

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !isBusy) onClose();
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl p-4 no-scrollbar">
                <DialogHeader>
                    <DialogTitle>Edit report</DialogTitle>
                    <DialogDescription>
                        Only the fields you change are saved.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <FieldLabel>Title</FieldLabel>
                        <Input
                            value={form.title}
                            onChange={(e) => setField("title", e.target.value)}
                        />
                        <FieldError message={errors.title} />
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Description</FieldLabel>
                        <Textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) =>
                                setField("description", e.target.value)
                            }
                        />
                        <FieldError message={errors.description} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <FieldLabel>Category</FieldLabel>
                            <Select
                                value={form.category}
                                onValueChange={(v) =>
                                    setField("category", v ?? "")
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.category} />
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Ward</FieldLabel>
                            <Select
                                value={form.ward}
                                onValueChange={(v) => {
                                    setField("ward", v ?? "");
                                    if (locationChanged) invalidateCoordinates();
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select ward" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wards.map((w) => (
                                        <SelectItem key={w.value} value={w.value}>
                                            {w.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.ward} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <FieldLabel>Priority</FieldLabel>
                        <Select
                            value={form.priority}
                            onValueChange={(v) =>
                                setField("priority", v as ReportPriority)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <FieldLabel>City</FieldLabel>
                            <Input
                                value={form.city}
                                onChange={(e) =>
                                    setLocationField("city", e.target.value)
                                }
                                onBlur={handleLocationBlur}
                            />
                            <FieldError message={errors.city} />
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Address</FieldLabel>
                            <Input
                                value={form.address}
                                onChange={(e) =>
                                    setLocationField("address", e.target.value)
                                }
                                onBlur={handleLocationBlur}
                            />
                            <FieldError
                                message={errors.address ?? geocodeError}
                            />

                            {isGeocoding && (
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Checking address on map...</span>
                                </p>
                            )}

                            {!isGeocoding &&
                                !errors.address &&
                                !geocodeError &&
                                locationChanged &&
                                coords && (
                                    <p className="flex items-center gap-1.5 text-xs text-green-600">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Location found</span>
                                    </p>
                                )}
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Street (Optional)</FieldLabel>
                            <Input
                                value={form.street}
                                onChange={(e) =>
                                    setLocationField("street", e.target.value)
                                }
                                onBlur={handleLocationBlur}
                            />
                            <FieldError message={errors.street} />
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Postal Code (Optional)</FieldLabel>
                            <Input
                                value={form.postalCode}
                                onChange={(e) =>
                                    setLocationField("postalCode", e.target.value)
                                }
                                onBlur={handleLocationBlur}
                            />
                            <FieldError message={errors.postalCode} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <FieldLabel>Photos &amp; Videos</FieldLabel>
                            <span className="text-xs text-muted-foreground">
                                {totalMedia}/{MAX_MEDIA}
                            </span>
                        </div>

                        {(keptMedia.length > 0 || uploads.slots.length > 0) && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {keptMedia.map((media) => (
                                    <ExistingMediaTile
                                        key={media.id}
                                        media={media}
                                        disabled={isBusy}
                                        onRemove={() =>
                                            setKeptMedia((prev) =>
                                                prev.filter(
                                                    (item) =>
                                                        item.id !== media.id,
                                                ),
                                            )
                                        }
                                    />
                                ))}

                                {uploads.slots.map((slot) => (
                                    <MediaSlot
                                        key={slot.id}
                                        slot={slot}
                                        isBusy={isBusy}
                                        onRemove={uploads.remove}
                                    />
                                ))}
                            </div>
                        )}

                        {totalMedia < MAX_MEDIA && (
                            <>
                                <input
                                    type="file"
                                    id={inputId}
                                    multiple
                                    accept={uploads.accept}
                                    onChange={handleFileChange}
                                    disabled={isBusy}
                                    className="hidden"
                                />
                                <label
                                    htmlFor={inputId}
                                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-custom bg-section/50 p-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <UploadCloud className="h-4 w-4 text-primary" />
                                    Add photos or videos
                                </label>
                            </>
                        )}

                        {uploads.batchError && (
                            <p className="text-xs text-destructive">
                                {uploads.batchError}
                            </p>
                        )}

                        {mediaChanged && (
                            <p className="text-xs text-muted-foreground">
                                Attachments will be replaced with the set shown
                                above.
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id={`anonymous-${issue.id}`}
                            checked={form.isAnonymous}
                            onCheckedChange={(checked) =>
                                setField("isAnonymous", !!checked)
                            }
                        />
                        <label
                            htmlFor={`anonymous-${issue.id}`}
                            className="cursor-pointer text-xs font-medium text-muted-foreground"
                        >
                            Submit Anonymously
                        </label>
                    </div>
                </div>

                <DialogFooter className="border-t-border">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isBusy}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isBusy || !hasChanges || !isValid}
                    >
                        {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploads.isUploading
                            ? `Uploading (${uploads.progress}%)...`
                            : isGeocoding
                                ? "Checking address..."
                                : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}