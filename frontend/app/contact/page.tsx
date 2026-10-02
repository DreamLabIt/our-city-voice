"use client";

import React from "react";
import PageHeader from "@/components/common/PageHeader";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Send,
    HelpCircle,
    Loader2,
} from "lucide-react";
import type { ContactFormData } from "@/types";

export default function ContactPage(): React.ReactNode {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ContactFormData>({
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            category: "General Inquiry",
            subject: "",
            message: "",
        },
    });

    const onSubmit = async (data: ContactFormData): Promise<void> => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            toast.success("Message Sent Successfully!", {
                description: "Thank you for reaching out. We will get back to you shortly.",
            });

            reset();
        } catch (error) {
            toast.error("Failed to send message", {
                description: "Something went wrong. Please try again later.",
            });
        }
    };

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Contact Us"
                description={
                    <>
                        Have questions or feedback?
                        <br />
                        Get in touch with our team and we will get back to you as soon as possible.
                    </>
                }
                customBreadcrumbName="Contact Us"
                bgImage="/hero-bg.jpg"
            />

            <div className="max-w-[1940px] mx-auto px-8 md:px-10 py-12 md:py-16 space-y-16">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-card border border-border-custom rounded-xl p-6 flex items-start gap-4 hover:border-primary/50 transition-all duration-300 shadow-sm">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-base text-foreground">Our Location</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                City Hall Plaza, Scarborough, ON, Canada
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border-custom rounded-xl p-6 flex items-start gap-4 hover:border-primary/50 transition-all duration-300 shadow-sm">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-base text-foreground">Phone Number</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Toll Free: +1 (800) 123-4567
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Direct: +1 (416) 987-6543
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-border-custom rounded-xl p-6 flex items-start gap-4 hover:border-primary/50 transition-all duration-300 shadow-sm">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-base text-foreground">Email Address</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">support@ourcityvoice.org</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">media@ourcityvoice.org</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border-custom rounded-xl p-6 flex items-start gap-4 hover:border-primary/50 transition-all duration-300 shadow-sm">
                        <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-base text-foreground">Working Hours</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">Mon - Fri: 8:30 AM - 5:00 PM</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">Sat - Sun: Closed</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    <div className="lg:col-span-7 bg-card border border-border-custom rounded-2xl p-6 sm:p-8 md:p-10 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                How Can We Help You?
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Fill out the form below and our team will get back to you within 24 hours.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Full Name <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your name"
                                        {...register("name", { required: "Full name is required" })}
                                        className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Email Address <span className="text-primary">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="example@gmail.com"
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Invalid email address",
                                            },
                                        })}
                                        className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="phone" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Phone Number
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        {...register("phone")}
                                        className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="category" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        {...register("category")}
                                        className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                                    >
                                        <option value="General Inquiry">General Inquiry</option>
                                        <option value="Report Issue Support">Report Issue Support</option>
                                        <option value="Partnership & Media">Partnership & Media</option>
                                        <option value="Technical Bug">Technical Bug</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="subject" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Subject <span className="text-primary">*</span>
                                </label>
                                <input
                                    id="subject"
                                    type="text"
                                    placeholder="Brief summary of your message"
                                    {...register("subject", { required: "Subject is required" })}
                                    className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                                {errors.subject && (
                                    <p className="text-xs text-destructive mt-1">{errors.subject.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="message" className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Message <span className="text-primary">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    placeholder="Write your detailed message here..."
                                    {...register("message", {
                                        required: "Message cannot be empty",
                                        minLength: {
                                            value: 10,
                                            message: "Message must be at least 10 characters long",
                                        },
                                    })}
                                    className="w-full px-4 py-2.5 bg-section border border-border-custom rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                                />
                                {errors.message && (
                                    <p className="text-xs text-destructive mt-1">{errors.message.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Send Message</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-card border border-border-custom rounded-2xl overflow-hidden shadow-sm h-100 sm:h-123 relative">
                            <iframe
                                title="City Hall Location Map"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d92350.29431056581!2d-79.31464390546872!3d43.77307222384263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89d4d0f6229a32c3%3A0xb3e6a88b503ec910!2sScarborough%2C%20ON%2C%20Canada!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: "grayscale(0.2) opacity(0.9)" }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        <div className="bg-section border border-border-custom rounded-xl p-6 space-y-3">
                            <div className="flex items-center gap-2.5 text-primary font-bold text-sm">
                                <HelpCircle className="w-5 h-5 shrink-0" />
                                <span>Emergency Infrastructure Damage?</span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                For urgent hazards requiring immediate emergency response (e.g., exposed high-voltage cables, water main bursts), please call <strong>311</strong> directly or contact city emergency services.
                            </p>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}