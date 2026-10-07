"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, User, Phone, Mail, MapPin } from "lucide-react";
import type { UserProfileData } from "@/types";

interface ProfileFormProps {
    user: UserProfileData;
    onUpdate?: (updatedData: Partial<UserProfileData>) => Promise<void>;
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log("Updated Data:", formData);
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="rounded-2xl border-border shadow-xs">
            <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-extrabold">Personal Details</CardTitle>
                <CardDescription className="text-xs">
                    Update your account information and public profile contact details.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="name"
                                className="text-xs font-bold flex items-center gap-1.5"
                            >
                                <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                className="rounded-xl text-xs h-10"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-xs font-bold flex items-center gap-1.5"
                            >
                                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="rounded-xl text-xs h-10 bg-muted/50 cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="phone"
                                className="text-xs font-bold flex items-center gap-1.5"
                            >
                                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+880 1XXXX-XXXXXX"
                                className="rounded-xl text-xs h-10"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="location"
                                className="text-xs font-bold flex items-center gap-1.5"
                            >
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Location /
                                City
                            </Label>
                            <Input
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City or Region"
                                className="rounded-xl text-xs h-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="bio" className="text-xs font-bold">
                            Bio
                        </Label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Write a brief description about yourself..."
                            className="rounded-xl text-xs min-h-22.5 resize-none"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl text-xs font-bold gap-2 px-5 h-9"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
