import ProfileHeader from "@/components/dashboard/profile/ProfileHeader";
import ProfileForm from "@/components/dashboard/profile/ProfileForm";
import DashboardLayout from "@/components/dashboard/(layout)/DashboardLayout";
import { getCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
    const user = await getCurrentUser();

    if (!user) {
        return null;
    }

    return (
        <DashboardLayout user={user} >
            <div className="space-y-6">
                <ProfileHeader user={user} />
                <ProfileForm user={user} />
            </div>
        </DashboardLayout>
    );
}