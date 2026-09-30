"use client";

import React, { useState, ChangeEvent } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import {
    MapPin,
    UploadCloud,
    X,
    AlertCircle,
    Send,
    Loader2,
    FileText,
    CheckCircle2,
    Info,
    ShieldAlert,
    BarChart3,
    Clock,
    AlertTriangle,
    ChevronDown,
    Flame,
    PieChart,
    HelpCircle,
} from "lucide-react";

export interface ReportIssueFormData {
    title: string;
    category: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    location: string;
    description: string;
    reporterName?: string;
    reporterEmail: string;
    reporterPhone?: string;
    isAnonymous: boolean;
}

const CATEGORIES = [
    "Roads & Potholes",
    "Street Lighting",
    "Waste Management & Garbage",
    "Drainage & Waterlogging",
    "Water Supply & Leakage",
    "Parks & Public Spaces",
    "Traffic Signs & Signals",
    "Others",
];

const MINI_FAQS = [
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

export default function ReportIssuePage(): React.JSX.Element {
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const {
        register,
        handleSubmit,
        reset,
        watch,
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

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

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

    const onSubmit = async (data: ReportIssueFormData): Promise<void> => {
        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify(data));
            selectedImages.forEach((file) => formData.append("images", file));

            await new Promise((resolve) => setTimeout(resolve, 1800));

            toast.success("Issue Reported Successfully!", {
                description: "Your report ID is #OCV-" + Math.floor(100000 + Math.random() * 900000) + ". You can track updates on your dashboard.",
            });

            reset();
            setSelectedImages([]);
            setImagePreviews([]);
        } catch (error) {
            toast.error("Failed to submit report", {
                description: "Please check your network connection and try again.",
            });
        }
    };

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Report an Issue"
                description="Notice damaged public infrastructure in your neighborhood? Submit a report with photo evidence and location details to alert municipal authorities."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Report Issue"
            />

            <div className="max-w-[1940px] mx-auto px-4 sm:px-8 md:px-10 py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    <div className="lg:col-span-7 xl:col-span-8 bg-card border border-border-custom rounded-2xl p-6 sm:p-8 md:p-10 shadow space-y-4">
                        <div className="space-y-2 border-b border-border-custom pb-4">
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                Submit Infrastructure Details
                            </h2>
                            <p className="text-sm text-muted">
                                Please fill in accurate information to help field inspectors review and resolve the issue quickly.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">

                            <div className="space-y-1.5">
                                <label htmlFor="title" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Issue Title <span className="text-primary">*</span>
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    placeholder="Deep pothole causing traffic jam on Main Street"
                                    {...register("title", {
                                        required: "Issue title is required",
                                        minLength: { value: 6, message: "Title must be at least 6 characters" },
                                    })}
                                    className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mt-2"
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
                                    <select
                                        id="category"
                                        {...register("category", { required: "Please select a category" })}
                                        className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer mt-2"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="priority" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Urgency / Priority Level <span className="text-primary">*</span>
                                    </label>
                                    <select
                                        id="priority"
                                        {...register("priority")}
                                        className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer mt-2"
                                    >
                                        <option value="Low">Low (Minor aesthetic issues)</option>
                                        <option value="Medium">Medium (General repair needed)</option>
                                        <option value="High">High (Disrupts daily traffic/life)</option>
                                        <option value="Critical">Critical (Immediate public hazard)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="location" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Location Address or Pin Landmark <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="location"
                                        type="text"
                                        placeholder="Near Station Road, Ward 4"
                                        {...register("location", { required: "Location details are required" })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mt-2"
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
                                <textarea
                                    id="description"
                                    rows={4}
                                    placeholder="Provide context about the problem, estimated size/damage, and how long it has been present..."
                                    {...register("description", {
                                        required: "Description is required",
                                        minLength: { value: 15, message: "Description must be at least 15 characters" },
                                    })}
                                    className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none mt-2"
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
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
                                                Click to upload <span className="text-muted font-normal">or drag and drop</span>
                                            </p>
                                            <p className="text-xs text-muted mt-1">PNG, JPG, WEBP up to 5MB each</p>
                                        </div>
                                    </label>
                                </div>

                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                                        {imagePreviews.map((src, index) => (
                                            <div key={index} className="relative w-full h-20 rounded-lg overflow-hidden border border-border-custom group">
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
                            </div>

                            <div className="border-t border-border-custom pt-6 space-y-5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <span>Reporter Details</span>
                                    </h3>

                                    <label className="flex items-center gap-2 text-xs text-muted cursor-pointer font-medium select-none">
                                        <input
                                            type="checkbox"
                                            {...register("isAnonymous")}
                                            className="w-4 h-4 accent-primary rounded cursor-pointer"
                                        />
                                        <span>Submit Anonymously</span>
                                    </label>
                                </div>

                                {!isAnonymous && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-200">
                                        <div className="space-y-1.5">
                                            <label htmlFor="reporterName" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                                Your Full Name
                                            </label>
                                            <input
                                                id="reporterName"
                                                type="text"
                                                placeholder="Enter your name"
                                                {...register("reporterName")}
                                                className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mt-2"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label htmlFor="reporterEmail" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                                Email (For Resolution Updates) <span className="text-primary">*</span>
                                            </label>
                                            <input
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
                                                className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mt-2"
                                            />
                                            {errors.reporterEmail && (
                                                <p className="text-xs text-destructive mt-1">{errors.reporterEmail.message}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Submitting Report...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Submit Issue Report</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>


                    <div className="lg:col-span-5 xl:col-span-4 space-y-6">

                        <div className="bg-card border border-border-custom rounded-2xl p-6 space-y-4 shadow">
                            <div className="flex items-center justify-between border-b border-border-custom pb-3">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wide">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    <span>Platform Insights</span>
                                </h3>
                                <span className="text-[12px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                                    Live Updates
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-section border border-border-custom/80 p-3.5 rounded-xl space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Received</span>
                                    </div>
                                    <p className="text-xl font-extrabold text-foreground">15,420</p>
                                </div>

                                <div className="bg-section border border-border-custom/80 p-3.5 rounded-xl space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-muted">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Solved</span>
                                    </div>
                                    <p className="text-xl font-extrabold text-foreground">13,580</p>
                                </div>
                            </div>

                            <div className="bg-section border border-border-custom/80 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted">Success Resolution Rate</p>
                                    <p className="text-lg font-bold text-emerald-500">88.06%</p>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                                    88%
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border-custom rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border-custom pb-3 uppercase tracking-wide">
                                <PieChart className="w-4 h-4 text-primary" />
                                <span>Most Reported Issues</span>
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                        <span className="text-foreground">Roads & Potholes</span>
                                        <span className="text-primary">42%</span>
                                    </div>
                                    <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full w-[42%]" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                        <span className="text-foreground">Street Lighting</span>
                                        <span className="text-primary">28%</span>
                                    </div>
                                    <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/80 rounded-full w-[28%]" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1">
                                        <span className="text-foreground">Waste & Garbage</span>
                                        <span className="text-primary">18%</span>
                                    </div>
                                    <div className="w-full h-2 bg-section rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/60 rounded-full w-[18%]" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border-custom/60 space-y-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wide">
                                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                                    <span>High Activity Areas</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 text-xs">
                                    <span className="bg-section border border-border-custom text-muted px-2.5 py-1 rounded-md">
                                        Main Commercial Zone (Ward 3)
                                    </span>
                                    <span className="bg-section border border-border-custom text-muted px-2.5 py-1 rounded-md">
                                        Station Road Crossing
                                    </span>
                                    <span className="bg-section border border-border-custom text-muted px-2.5 py-1 rounded-md">
                                        Sector 4 Bypass
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border-custom rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border-custom pb-3 uppercase tracking-wide">
                                <HelpCircle className="w-4 h-4 text-primary" />
                                <span>How Issues Are Solved</span>
                            </h3>

                            <div className="space-y-2">
                                {MINI_FAQS.map((faq, idx) => {
                                    const isOpen = openFaqIndex === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className="bg-section border border-border-custom rounded-xl overflow-hidden transition-all"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleFaq(idx)}
                                                className="w-full p-3 text-left text-xs font-bold text-foreground flex items-center justify-between gap-2 hover:text-primary transition-colors"
                                            >
                                                <span>{faq.q}</span>
                                                <ChevronDown
                                                    className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : ""
                                                        }`}
                                                />
                                            </button>
                                            {isOpen && (
                                                <div className="px-3 pb-3 text-xs text-muted leading-relaxed border-t border-border-custom/40 pt-2">
                                                    {faq.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-section border border-border-custom rounded-2xl p-5 space-y-2">
                            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
                                <ShieldAlert className="w-4 h-4 text-primary" />
                                <span>Quick Reminder</span>
                            </div>
                            <p className="text-xs text-muted leading-relaxed">
                                Please provide accurate and complete information when submitting a report. This helps our team understand the issue clearly.
                            </p>

                            <p className="text-xs text-muted leading-relaxed">
                                Avoid submitting fake or duplicate reports. Accurate descriptions help field teams prioritize genuine public hazards faster.
                            </p>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    );
}