import type { Metadata } from "next";
import ProfileHeader from "@/components/dashboard/profile/ProfileHeader";
import ProfileForm from "@/components/dashboard/profile/ProfileForm";
import DashboardLayout from "@/components/dashboard/(layout)/DashboardLayout";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Your Profile | Our City Voice",
    description:
        "View and update your Our City Voice account profile.",
};

export default async function ProfilePage() {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "super_admin";

    if (!user) {
        redirect("/login");
    }

    return (
        <DashboardLayout user={user} isAdmin={isAdmin}>
            <div className="space-y-6">
                <ProfileHeader user={user} />
                <ProfileForm user={user} />
            </div>
        </DashboardLayout>
    );
}