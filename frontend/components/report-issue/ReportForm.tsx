"use client";

import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    UploadCloud,
    Send,
    Loader2,
    Video,
    Film,
} from "lucide-react";
import { createReportIssue } from "@/app/actions/issues";
import type { ReportIssueFormData, UploadedMediaItem, ReportFormProps, FormValues } from "@/types/issues";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUploads } from "@/hooks/use-uploads";
import {
    GpsError,
    getCurrentCoordinates,
    isPhoneDevice,
    reverseGeocode,
} from "@/lib/device-location";
import { MediaSlot } from "./MediaSlot";
import IssueDetailsFields from "./IssueDetailsFields";
import LocationFields from "./LocationFields";

const MAX_IMAGE_FILES = 5;
const MAX_VIDEO_FILES = 2;

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
        [street, address, wardName, city, postalCode],
        [street, address, city],
        [address, city],
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

export default function ReportForm({ reportFilters, user }: ReportFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isVideoMode = searchParams.get("type") === "video";
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [isPhone, setIsPhone] = useState(false);
    const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);
    const geocodeRequestRef = useRef(0);
    const pendingGeocodeRef = useRef<Promise<boolean> | null>(null);

    useEffect(() => {
        setIsPhone(isPhoneDevice());
    }, []);

    const maxMediaFiles = isVideoMode
        ? MAX_VIDEO_FILES
        : MAX_IMAGE_FILES;

    const uploads = useUploads({
        kind: "report-media",
        multiple: true,
        maxFiles: maxMediaFiles,
    });

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
        setError,
        clearErrors,
        setFocus,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            title: "",
            description: "",
            category: "",
            ward: "",
            priority: "medium",
            isAnonymous: false,
            location: {
                address: "",
                city: "",
                street: "",
                postalCode: "",
                latitude: null,
                longitude: null,
            },
        },
    });

    const isAnonymous = watch("isAnonymous");
    const watchedLatitude = watch("location.latitude");
    const watchedLongitude = watch("location.longitude");
    const hasCoordinates =
        typeof watchedLatitude === "number" &&
        typeof watchedLongitude === "number" &&
        Number.isFinite(watchedLatitude) &&
        Number.isFinite(watchedLongitude);

    const fillLocationFromDevice = async (): Promise<boolean> => {
        setIsLocating(true);
        setLocationErrorMsg(null);

        try {
            const { latitude, longitude } = await getCurrentCoordinates();
            const place = await reverseGeocode(latitude, longitude);

            if (!place) {
                setLocationErrorMsg("Could not find the address for your current location. Please turn on GPS or enter manually.");
                setFocus("location.city");
                return false;
            }

            setValue("location.city", place.city);
            setValue("location.address", place.address);
            setValue("location.street", place.street);
            setValue("location.postalCode", place.postalCode);
            setValue("location.latitude", latitude);
            setValue("location.longitude", longitude);
            clearErrors(["location.city", "location.address"]);
            setLocationErrorMsg(null);

            return true;
        } catch (err) {
            console.error("Device location error:", err);
            setShowLocationModal(true);

            if (err instanceof GpsError) {
                setLocationErrorMsg("Location is turned off or permission denied. Please turn on GPS/Location and try again.");
            } else {
                setLocationErrorMsg("Could not find the address of your location. Please check your connection.");
            }

            return false;
        } finally {
            setIsLocating(false);
        }
    };

    const handleUploadBoxClick = async (e: MouseEvent<HTMLDivElement>) => {
        const phoneCheck = isPhoneDevice();
        if (phoneCheck) {
            const typedLocation = getValues("location");
            const hasCity = Boolean(typedLocation.city?.trim());
            const hasAddress = Boolean(typedLocation.address?.trim());

            if (!hasCity && !hasAddress) {
                await fillLocationFromDevice();
            }
        }
    };

    const handleFileChange = async (
        event: ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        if (event.target.files && event.target.files.length > 0) {
            uploads.addFiles(event.target.files);
            event.target.value = "";
        }
    };

    const getWardName = (wardValue: string): string => {
        const found = reportFilters.wards.find(
            (w) => (w.value || w.code) === wardValue,
        );
        return found?.name ?? "";
    };

    const clearCoordinates = () => {
        setValue("location.latitude", null);
        setValue("location.longitude", null);
    };

    const resolveAddressCoordinates = async (): Promise<boolean> => {
        const values = getValues();
        const address = values.location.address?.trim() ?? "";
        const city = values.location.city?.trim() ?? "";

        if (!address || !city) return false;

        const requestId = ++geocodeRequestRef.current;
        setIsGeocoding(true);

        try {
            const result = await geocodeAddress({
                address,
                city,
                street: values.location.street?.trim() || undefined,
                postalCode: values.location.postalCode?.trim() || undefined,
                wardName: getWardName(values.ward) || undefined,
            });

            if (requestId !== geocodeRequestRef.current) return false;

            if (!result) {
                clearCoordinates();
                setError("location.address", {
                    type: "manual",
                    message: ADDRESS_NOT_FOUND_MESSAGE,
                });
                return false;
            }

            setValue("location.latitude", result.latitude);
            setValue("location.longitude", result.longitude);
            clearErrors("location.address");
            return true;
        } catch (err) {
            console.error("Geocoding error:", err);

            if (requestId === geocodeRequestRef.current) {
                clearCoordinates();
                setError("location.address", {
                    type: "manual",
                    message: GEOCODER_UNREACHABLE_MESSAGE,
                });
            }
            return false;
        } finally {
            if (requestId === geocodeRequestRef.current) {
                setIsGeocoding(false);
            }
        }
    };

    const runAddressLookup = (): Promise<boolean> => {
        const promise = resolveAddressCoordinates();
        pendingGeocodeRef.current = promise;

        void promise.finally(() => {
            if (pendingGeocodeRef.current === promise) {
                pendingGeocodeRef.current = null;
            }
        });

        return promise;
    };

    const handleAddressChange = () => {
        geocodeRequestRef.current += 1;
        setIsGeocoding(false);
        clearErrors("location.address");
        clearCoordinates();
    };

    const invalidateAddressCoordinates = () => {
        geocodeRequestRef.current += 1;
        setIsGeocoding(false);
        clearCoordinates();
    };

    const handleLocationBlur = () => {
        if (pendingGeocodeRef.current) return;

        const lat = getValues("location.latitude");
        const lng = getValues("location.longitude");
        if (lat !== null && lng !== null) return;

        const address = getValues("location.address")?.trim();
        const city = getValues("location.city")?.trim();
        if (!address || !city) return;

        void runAddressLookup();
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        if (!user) {
            toast.error("Please log in to submit a report.");
            const currentPath = window.location.pathname + window.location.search;
            router.push(`/login?next=${encodeURIComponent(currentPath)}`);
            return;
        }
        if (pendingGeocodeRef.current) {
            await pendingGeocodeRef.current;
        }

        if (isPhone) {
            const typedLocation = getValues("location");
            const hasCity = Boolean(typedLocation.city?.trim());
            const hasAddress = Boolean(typedLocation.address?.trim());

            if (hasCity !== hasAddress) {
                setFocus(hasCity ? "location.address" : "location.city");
                toast.error("Fill in both City and Address", {
                    description:
                        "Or leave both empty to use your current location.",
                });
                return;
            }

            if (!hasCity && !hasAddress) {
                const filled = await fillLocationFromDevice();

                if (!filled) return;
            }
        }

        let finalLat = getValues("location.latitude");
        let finalLng = getValues("location.longitude");

        if (
            finalLat === null ||
            finalLng === null ||
            !Number.isFinite(finalLat) ||
            !Number.isFinite(finalLng)
        ) {
            const found = await runAddressLookup();

            if (!found) {
                setFocus("location.address");
                toast.error("Location not found", {
                    description: "Please correct the address and try again.",
                });
                return;
            }

            finalLat = getValues("location.latitude");
            finalLng = getValues("location.longitude");
        }

        if (
            finalLat === null ||
            finalLng === null ||
            !Number.isFinite(finalLat) ||
            !Number.isFinite(finalLng)
        ) {
            setError("location.address", {
                type: "manual",
                message: ADDRESS_NOT_FOUND_MESSAGE,
            });
            setFocus("location.address");
            return;
        }

        setUploadingMedia(true);

        try {
            const uploadedFiles = await uploads.upload();
            if (uploadedFiles === null) {
                toast.error("File upload failed", {
                    description:
                        "Your files could not be uploaded. Please check them and try again.",
                });
                return;
            }

            const uploadedMediaItems: UploadedMediaItem[] =
                uploadedFiles.map((file) => ({
                    url: file.url,
                    type: file.resourceType,
                    sizeBytes: file.bytes,
                    durationSecs:
                        file.resourceType === "video"
                            ? Math.round(file.durationSeconds ?? 0)
                            : null,
                    thumbnailUrl: null,
                }));

            const submittedLocation = getValues("location");

            const payload: ReportIssueFormData = {
                title: data.title.trim(),
                description: data.description.trim(),
                category: data.category,
                ward: data.ward,
                priority: data.priority,
                isAnonymous: data.isAnonymous,
                location: {
                    address: submittedLocation.address.trim(),
                    city: data.location?.city || submittedLocation.city.trim(),
                    street: submittedLocation.street?.trim() || null,
                    postalCode: submittedLocation.postalCode?.trim() || null,
                    latitude: finalLat,
                    longitude: finalLng,
                },
                media: uploadedMediaItems,
            };

            const result = await createReportIssue(payload);

            if (!result.success) {
                if (result.requiresAuth) {
                    toast.error("Please log in to submit a report.");
                    const currentPath = window.location.pathname + window.location.search;
                    router.push(`/login?next=${encodeURIComponent(currentPath)}`);
                    return;
                }

                const fieldError = result.fieldErrors
                    ? Object.values(result.fieldErrors)
                        .flat()
                        .filter(Boolean)
                        .join(" ")
                    : "";

                toast.error("Failed to submit report", {
                    description:
                        fieldError ||
                        result.error ||
                        "Please check the form inputs.",
                });

                return;
            }

            const trackingCode = result.data?.trackingCode;

            toast.success("Issue reported successfully!", {
                description: trackingCode
                    ? `Your report tracking code is ${trackingCode}`
                    : "Report submitted.",
            });

            reset();
            uploads.reset();

            router.push(
                trackingCode
                    ? `/issues/${trackingCode}`
                    : "/reports",
            );
        } catch (error: unknown) {
            toast.error("Unable to submit report", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Please check your network connection and try again.",
            });
        } finally {
            setUploadingMedia(false);
        }
    };

    const isBusy =
        isSubmitting ||
        uploadingMedia ||
        uploads.isUploading ||
        isGeocoding ||
        isLocating;

    return (
        <Card className="bg-card border border-border-custom rounded-2xl p-6 sm:p-8 md:p-10 shadow space-y-4">
            <CardContent className="p-0 space-y-6">
                <div className="space-y-2 border-b border-border-custom pb-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        Submit Infrastructure Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Please fill in accurate information to help
                        field inspectors review and resolve the issue
                        quickly.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-7"
                >
                    <IssueDetailsFields
                        register={register}
                        control={control}
                        errors={errors}
                        reportFilters={reportFilters}
                        invalidateAddressCoordinates={invalidateAddressCoordinates}
                    />

                    <LocationFields
                        register={register}
                        errors={errors}
                        isGeocoding={isGeocoding}
                        hasCoordinates={hasCoordinates}
                        invalidateAddressCoordinates={invalidateAddressCoordinates}
                        handleAddressChange={handleAddressChange}
                        handleLocationBlur={handleLocationBlur}
                        locationOptional={isPhone}
                    />

                    <div className="space-y-1.5">
                        <label
                            htmlFor="description"
                            className="text-xs font-bold text-foreground uppercase tracking-wide"
                        >
                            Detailed Description{" "}
                            <span className="text-primary">*</span>
                        </label>
                        <Textarea
                            id="description"
                            rows={4}
                            placeholder="Provide context about the problem..."
                            {...register("description", {
                                required: "Description is required.",
                                validate: (value) =>
                                    value.trim().length >= 16 ||
                                    "Description must be at least 16 characters.",
                                maxLength: {
                                    value: 5000,
                                    message: "Description cannot exceed 5000 characters.",
                                },
                            })}
                            className="bg-section rounded border-border-custom resize-none mt-2 h-27"
                        />
                        {errors.description && (
                            <p className="text-xs text-destructive mt-1">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                            {isVideoMode ? (
                                <Video className="w-4 h-4 text-primary" />
                            ) : (
                                <UploadCloud className="w-4 h-4 text-primary" />
                            )}
                            <span>
                                {isVideoMode
                                    ? `Attach Video Evidence (Up to ${MAX_VIDEO_FILES} Clips)`
                                    : `Attach Photos (Up to ${MAX_IMAGE_FILES})`}
                            </span>
                        </label>

                        {/* Added onClick wrapper handler to trigger location request on mobile user touch gesture */}
                        <div 
                            onClick={handleUploadBoxClick}
                            className="border-2 border-dashed border-border-custom rounded-xl p-6 text-center bg-section/50 mt-2 cursor-pointer"
                        >
                            <input
                                type="file"
                                id="media-upload"
                                multiple
                                accept={uploads.accept}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="media-upload"
                                className="cursor-pointer space-y-2 block"
                            >
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                    {isVideoMode ? (
                                        <Film className="w-6 h-6" />
                                    ) : (
                                        <UploadCloud className="w-6 h-6" />
                                    )}
                                </div>
                                <p className="text-sm font-semibold">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Maximum {maxMediaFiles} files allowed
                                </p>
                            </label>
                        </div>

                        {locationErrorMsg && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mt-2">
                                <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                                    <span>⚠️</span> {locationErrorMsg}
                                </p>
                            </div>
                        )}

                        {uploads.batchError && (
                            <p className="text-xs text-destructive">
                                {uploads.batchError}
                            </p>
                        )}

                        {uploads.slots.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
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
                    </div>

                    <div className="border-t border-border-custom pt-6 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isAnonymous"
                                checked={isAnonymous}
                                onCheckedChange={(checked) =>
                                    setValue("isAnonymous", !!checked)
                                }
                            />
                            <label
                                htmlFor="isAnonymous"
                                className="text-xs text-muted-foreground cursor-pointer font-medium"
                            >
                                Submit Anonymously
                            </label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isBusy}
                        className="w-full sm:w-auto px-8 py-6 bg-primary text-white font-semibold text-sm rounded-md flex items-center justify-center gap-2"
                    >
                        {isBusy ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>
                                    {uploads.isUploading
                                        ? `Uploading (${uploads.progress}%)...`
                                        : isLocating
                                            ? "Detecting location..."
                                            : isGeocoding
                                                ? "Checking address..."
                                                : "Submitting Report..."}
                                </span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Submit Issue</span>
                            </>
                        )}
                    </Button>
                </form>

                {showLocationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-card border border-border-custom rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl">
                            <h3 className="text-lg font-bold text-foreground">
                                Location Access Required
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Your device location is turned off or blocked. Please turn on GPS / Location services in your phone settings and allow permission to continue.
                            </p>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLocationModal(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowLocationModal(false);
                                        void fillLocationFromDevice();
                                    }}
                                    className="bg-primary text-white"
                                >
                                    Turned
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}