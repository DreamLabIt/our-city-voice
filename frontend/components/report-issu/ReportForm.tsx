
"use client";

import { useState, type ChangeEvent } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
    MapPin,
    UploadCloud,
    X,
    Send,
    Loader2,
    Video,
    Film,
} from "lucide-react";

import { createReportIssue } from "@/app/actions/issues";

import type { ReportIssueFormData, UploadedMediaItem } from "@/types/issues";


import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUploads } from "@/hooks/use-uploads";

interface ReportFormProps {
    reportFilters: {
        categories: Array<{ name: string; value: string }>;
        wards: Array<{ name: string; code?: string; value?: string }>;
    };
}

interface FormValues {
    title: string;
    description: string;
    category: string;
    ward: string;
    priority: "low" | "medium" | "high" | "critical";
    isAnonymous: boolean;
    location: {
        address: string;
        city: string;
        street: string;
        postalCode: string;
        latitude: number | null;
        longitude: number | null;
    };
}

const MAX_IMAGE_FILES = 5;
const MAX_VIDEO_FILES = 2;

export default function ReportForm({ reportFilters }: ReportFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isVideoMode = searchParams.get("type") === "video";

    const [uploadingMedia, setUploadingMedia] = useState(false);

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
                city: "Jamalpur",
                street: "",
                postalCode: "",
                latitude: null,
                longitude: null,
            },
        },
    });

    const isAnonymous = watch("isAnonymous");

    const handleFileChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        if (event.target.files) {
            uploads.addFiles(event.target.files);
            event.target.value = "";
        }
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
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
                            ? file.durationSeconds
                            : null,
                    thumbnailUrl: null,
                }));

            const payload: ReportIssueFormData = {
                title: data.title.trim(),
                description: data.description.trim(),
                category: data.category,
                ward: data.ward,
                priority: data.priority,
                isAnonymous: data.isAnonymous,
                location: {
                    address: data.location.address.trim(),
                    city: data.location.city.trim(),
                    street: data.location.street.trim() || null,
                    postalCode:
                        data.location.postalCode.trim() || null,
                    latitude: data.location.latitude,
                    longitude: data.location.longitude,
                },
                media: uploadedMediaItems,
            };


            const result = await createReportIssue(payload);

            if (!result.success) {
                if (result.requiresAuth) {
                    toast.error("Please log in to submit a report.");
                    router.push("/login?callbackUrl=/report-issue");
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
        isSubmitting || uploadingMedia || uploads.isUploading;

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
                    <div className="space-y-1.5">
                        <label
                            htmlFor="title"
                            className="text-xs font-bold text-foreground uppercase tracking-wide"
                        >
                            Issue Title{" "}
                            <span className="text-primary">*</span>
                        </label>

                        <Input
                            id="title"
                            placeholder="Enter a concise title for the issue"
                            {...register("title", {
                                required: "Issue title is required.",
                                minLength: {
                                    value: 6,
                                    message:
                                        "Title must be at least 6 characters.",
                                },
                                maxLength: {
                                    value: 160,
                                    message:
                                        "Title cannot exceed 160 characters.",
                                },
                            })}
                            className="bg-section border-border-custom rounded mt-2"
                        />

                        {errors.title && (
                            <p className="text-xs text-destructive mt-1">
                                {errors.title.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                                Category{" "}
                                <span className="text-primary">*</span>
                            </label>

                            <Controller
                                name="category"
                                control={control}
                                rules={{
                                    required:
                                        "Please select a category.",
                                }}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger className="w-full rounded bg-section border-border-custom mt-2">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reportFilters.categories.map(
                                                (category) => (
                                                    <SelectItem
                                                        key={category.value}
                                                        value={category.value}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            />

                            {errors.category && (
                                <p className="text-xs text-destructive mt-1">
                                    {errors.category.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                                Ward{" "}
                                <span className="text-primary">*</span>
                            </label>

                            <Controller
                                name="ward"
                                control={control}
                                rules={{
                                    required: "Please select a ward.",
                                }}
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <SelectTrigger className="w-full rounded bg-section border-border-custom mt-2">
                                            <SelectValue placeholder="Select Ward" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {reportFilters.wards.map(
                                                (ward) => {
                                                    const wardCode =
                                                        ward.value ||
                                                        ward.code;

                                                    if (!wardCode) {
                                                        return null;
                                                    }

                                                    return (
                                                        <SelectItem
                                                            key={wardCode}
                                                            value={wardCode}
                                                        >
                                                            {ward.name}
                                                        </SelectItem>
                                                    );
                                                },
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            />

                            {errors.ward && (
                                <p className="text-xs text-destructive mt-1">
                                    {errors.ward.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                            Urgency / Priority Level{" "}
                            <span className="text-primary">*</span>
                        </label>

                        <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="w-full rounded bg-section border-border-custom mt-2">
                                        <SelectValue placeholder="Select Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            Low (Minor aesthetic issues)
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            Medium (General repair needed)
                                        </SelectItem>
                                        <SelectItem value="high">
                                            High (Disrupts daily traffic/life)
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            Critical (Immediate public hazard)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="city"
                                className="text-xs font-bold text-foreground uppercase tracking-wide"
                            >
                                City{" "}
                                <span className="text-primary">*</span>
                            </label>

                            <Input
                                id="city"
                                placeholder="Enter city"
                                {...register("location.city", {
                                    required: "City is required.",
                                    maxLength: {
                                        value: 80,
                                        message:
                                            "City cannot exceed 80 characters.",
                                    },
                                })}
                                className="bg-section border-border-custom rounded mt-2"
                            />

                            {errors.location?.city && (
                                <p className="text-xs text-destructive mt-1">
                                    {errors.location.city.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="location"
                                className="text-xs font-bold text-foreground uppercase tracking-wide"
                            >
                                Location Address{" "}
                                <span className="text-primary">*</span>
                            </label>

                            <div className="relative mt-2">
                                <Input
                                    id="location"
                                    placeholder="Street address or nearby landmark"
                                    {...register("location.address", {
                                        required:
                                            "Location address is required.",
                                        maxLength: {
                                            value: 240,
                                            message:
                                                "Address cannot exceed 240 characters.",
                                        },
                                    })}
                                    className="pl-10 bg-section rounded border-border-custom"
                                />
                                <MapPin className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2" />
                            </div>

                            {errors.location?.address && (
                                <p className="text-xs text-destructive mt-1">
                                    {errors.location.address.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="street"
                                className="text-xs font-bold text-foreground uppercase tracking-wide"
                            >
                                Street (Optional)
                            </label>
                            <Input
                                id="street"
                                {...register("location.street", {
                                    maxLength: {
                                        value: 160,
                                        message:
                                            "Street cannot exceed 160 characters.",
                                    },
                                })}
                                className="bg-section border-border-custom rounded mt-2"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="postalCode"
                                className="text-xs font-bold text-foreground uppercase tracking-wide"
                            >
                                Postal Code (Optional)
                            </label>
                            <Input
                                id="postalCode"
                                {...register("location.postalCode", {
                                    maxLength: {
                                        value: 16,
                                        message:
                                            "Postal code cannot exceed 16 characters.",
                                    },
                                })}
                                className="bg-section border-border-custom rounded mt-2"
                            />
                        </div>
                    </div>

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
                                required:
                                    "Description is required.",
                                minLength: {
                                    value: 15,
                                    message:
                                        "Description must be at least 15 characters.",
                                },
                                maxLength: {
                                    value: 5000,
                                    message:
                                        "Description cannot exceed 5000 characters.",
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

                        <div className="border-2 border-dashed border-border-custom rounded-xl p-6 text-center bg-section/50 mt-2">
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

                        {uploads.batchError && (
                            <p className="text-xs text-destructive">
                                {uploads.batchError}
                            </p>
                        )}

                        {uploads.slots.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                {uploads.slots.map((slot) => (
                                    <div
                                        key={slot.id}
                                        className="relative w-full h-32 rounded-lg overflow-hidden border border-border-custom bg-muted"
                                    >
                                        {slot.previewUrl ? (
                                            <Image
                                                src={slot.previewUrl}
                                                alt={slot.name}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                                                {slot.name}
                                            </div>
                                        )}

                                        {slot.status === "uploading" && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                                {slot.progress}%
                                            </div>
                                        )}

                                        {slot.status === "error" && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs text-center p-2">
                                                Upload failed
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                uploads.remove(slot.id)
                                            }
                                            disabled={isBusy}
                                            aria-label={`Remove ${slot.name}`}
                                            className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive text-white rounded-full transition-colors disabled:opacity-50"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
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
            </CardContent>
        </Card>
    );
}
