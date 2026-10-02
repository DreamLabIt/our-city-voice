"use client";

import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
    MapPin,
    UploadCloud,
    X,
    Send,
    Loader2,
    FileText,
    Video,
    Film,
} from "lucide-react";
import { REPORT_CATEGORIES } from "@/data/mock-data";
import type { ReportIssueFormData } from "@/types";

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

export default function ReportForm() {
    const searchParams = useSearchParams();
    const mediaType = searchParams.get("type");

    const isVideoMode = mediaType === "video";

    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
    const [videoPreviews, setVideoPreviews] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ReportIssueFormData>({
        defaultValues: {
            title: "",
            category: "Roads & Potholes",
            priority: "Medium",
            location: "",
            description: "",
            reporterName: "",
            reporterEmail: "",
            reporterPhone: "",
            isAnonymous: false,
        },
    });

    const isAnonymous = watch("isAnonymous");

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);

            if (selectedImages.length + filesArray.length > 5) {
                toast.error("Maximum 5 images allowed");
                return;
            }

            const newImages = [...selectedImages, ...filesArray];
            setSelectedImages(newImages);

            const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number): void => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleVideoChange = (e: ChangeEvent<HTMLInputElement>): void => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);

            if (selectedVideos.length + filesArray.length > 2) {
                toast.error("Maximum 2 video clips allowed");
                return;
            }

            const newVideos = [...selectedVideos, ...filesArray];
            setSelectedVideos(newVideos);

            const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
            setVideoPreviews((prev) => [...prev, ...newPreviews]);
        }
    };

    const removeVideo = (index: number): void => {
        setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
        setVideoPreviews((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const onSubmit = async (data: ReportIssueFormData): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify(data));

            if (isVideoMode) {
                selectedVideos.forEach((file) => formData.append("videos", file));
            } else {
                selectedImages.forEach((file) => formData.append("images", file));
            }

            await new Promise((resolve) => setTimeout(resolve, 1800));

            toast.success("Issue Reported Successfully!", {
                description:
                    "Your report ID is #OCV-" +
                    Math.floor(100000 + Math.random() * 900000) +
                    ". You can track updates on your dashboard.",
            });

            reset();
            setSelectedImages([]);
            setImagePreviews([]);
            setSelectedVideos([]);
            setVideoPreviews([]);
        } catch (error) {
            toast.error("Failed to submit report", {
                description: "Please check your network connection and try again.",
            });
        }
    };

    return (
        <Card className="bg-card border border-border-custom rounded-2xl p-6 sm:p-8 md:p-10 shadow space-y-4">
            <CardContent className="p-0 space-y-6">
                <div className="space-y-2 border-b border-border-custom pb-4">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        Submit Infrastructure Details
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Please fill in accurate information to help field inspectors review and resolve the issue quickly.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                    <div className="space-y-1.5">
                        <label htmlFor="title" className="text-xs font-bold text-foreground uppercase tracking-wide">
                            Issue Title <span className="text-primary">*</span>
                        </label>
                        <Input
                            id="title"
                            type="text"
                            placeholder="Enter a concise title for the issue"
                            {...register("title", {
                                required: "Issue title is required",
                                minLength: { value: 6, message: "Title must be at least 6 characters" },
                            })}
                            className="bg-section border-border-custom rounded focus-visible:ring-2 focus-visible:ring-primary/50 mt-2"
                        />
                        {errors.title && (
                            <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="category" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                Category <span className="text-primary">*</span>
                            </label>
                            <Select
                                defaultValue="Roads & Potholes"
                                onValueChange={(val) => setValue("category", val ?? "Roads & Potholes")}
                            >
                                <SelectTrigger className="w-full rounded bg-section border-border-custom focus:ring-2 focus:ring-primary/50 mt-2">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REPORT_CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="priority" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                Urgency / Priority Level <span className="text-primary">*</span>
                            </label>
                            <Select
                                defaultValue="Medium"
                                onValueChange={(val) => setValue("priority", (val ?? "Medium") as any)}
                            >
                                <SelectTrigger className="w-full rounded bg-section border-border-custom focus:ring-2 focus:ring-primary/50 mt-2">
                                    <SelectValue placeholder="Select Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low (Minor aesthetic issues)</SelectItem>
                                    <SelectItem value="Medium">Medium (General repair needed)</SelectItem>
                                    <SelectItem value="High">High (Disrupts daily traffic/life)</SelectItem>
                                    <SelectItem value="Critical">Critical (Immediate public hazard)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="location" className="text-xs font-bold text-foreground uppercase tracking-wide">
                            Location Address or Pin Landmark <span className="text-primary">*</span>
                        </label>
                        <div className="relative mt-2">
                            <Input
                                id="location"
                                type="text"
                                placeholder="Near Station Road, Ward 4"
                                {...register("location", { required: "Location details are required" })}
                                className="pl-10 bg-section rounded border-border-custom focus-visible:ring-2 focus-visible:ring-primary/50"
                            />
                            <MapPin className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                        {errors.location && (
                            <p className="text-xs text-destructive mt-1">{errors.location.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="description" className="text-xs font-bold text-foreground uppercase tracking-wide">
                            Detailed Description <span className="text-primary">*</span>
                        </label>
                        <Textarea
                            id="description"
                            rows={4}
                            placeholder="Provide context about the problem, estimated size/damage, and how long it has been present..."
                            {...register("description", {
                                required: "Description is required",
                                minLength: { value: 15, message: "Description must be at least 15 characters" },
                            })}
                            className="bg-section rounded border-border-custom focus-visible:ring-2 focus-visible:ring-primary/50 resize-none mt-2 h-27"
                        />
                        {errors.description && (
                            <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        {isVideoMode ? (
                            <>
                                <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                                    <Video className="w-4 h-4 text-primary" />
                                    <span>Attach Video Evidence (Up to 2 Clips)</span>
                                </label>

                                <div className="border-2 border-dashed border-border-custom rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-section/50 mt-2">
                                    <input
                                        type="file"
                                        id="video-upload"
                                        multiple
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="video-upload" className="cursor-pointer space-y-2 block">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                            <Film className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                Click to upload video <span className="text-muted-foreground font-normal">or drag and drop</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">MP4, WEBM, MOV up to 50MB each</p>
                                        </div>
                                    </label>
                                </div>

                                {videoPreviews.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        {videoPreviews.map((src, index) => (
                                            <div key={index} className="relative w-full h-60 rounded-lg overflow-hidden border border-border-custom group">
                                                {/* <video src={src} className="w-full h-full object-cover" controls /> */}
                                                <video
                                                    src={src}
                                                    controls
                                                    playsInline
                                                    preload="auto"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        console.log("Video error:", e.currentTarget.error);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeVideo(index)}
                                                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive text-white rounded-full transition-colors cursor-pointer z-10"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Attach Photos (Up to 5)
                                </label>

                                <div className="border-2 border-dashed border-border-custom rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-section/50 mt-2">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer space-y-2 block">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                            <UploadCloud className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                Click to upload <span className="text-muted-foreground font-normal">or drag and drop</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 5MB each</p>
                                        </div>
                                    </label>
                                </div>

                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                                        {imagePreviews.map((src, index) => (
                                            <div key={index} className="relative w-full h-40 rounded-lg overflow-hidden border border-border-custom group">
                                                <Image
                                                    src={src}
                                                    alt={`Preview ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive text-white rounded-full transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="border-t border-border-custom pt-6 space-y-5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <span>Reporter Details</span>
                            </h3>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isAnonymous"
                                    checked={isAnonymous}
                                    onCheckedChange={(checked) => setValue("isAnonymous", !!checked)}
                                />
                                <label
                                    htmlFor="isAnonymous"
                                    className="text-xs text-muted-foreground cursor-pointer font-medium select-none"
                                >
                                    Submit Anonymously
                                </label>
                            </div>
                        </div>

                        {!isAnonymous && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-200">
                                <div className="space-y-1.5">
                                    <label htmlFor="reporterName" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Your Full Name
                                    </label>
                                    <Input
                                        id="reporterName"
                                        type="text"
                                        placeholder="Enter your name"
                                        {...register("reporterName")}
                                        className="bg-section rounded border-border-custom focus-visible:ring-2 focus-visible:ring-primary/50 mt-2"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="reporterEmail" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Email (For Resolution Updates) <span className="text-primary">*</span>
                                    </label>
                                    <Input
                                        id="reporterEmail"
                                        type="email"
                                        placeholder="example@gmail.com"
                                        {...register("reporterEmail", {
                                            required: !isAnonymous ? "Email is required for status notifications" : false,
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Invalid email address",
                                            },
                                        })}
                                        className="bg-section rounded border-border-custom focus-visible:ring-2 focus-visible:ring-primary/50 mt-2"
                                    />
                                    {errors.reporterEmail && (
                                        <p className="text-xs text-destructive mt-1">{errors.reporterEmail.message}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-6 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-70 "
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Submitting Report...</span>
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