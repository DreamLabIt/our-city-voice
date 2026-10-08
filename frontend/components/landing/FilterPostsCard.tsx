import { getReportFilters } from "@/app/actions/report";
import FilterPostsCardClient from "./FilterPostsCardClient";
import type { FilterOption } from "@/types/report";

export default async function FilterPostsCard() {
    let options: FilterOption = {
        categories: [],
        wards: [],
        status: [],
    };

    try {
        const data = await getReportFilters();
        options = {
            categories: data.categories || [],
            wards: data.wards || [],
            status:
                (data as unknown as { municipalities: { name: string }[] })
                    .municipalities || [],
        };
    } catch (error) {
        console.error("Failed to load filters on server:", error);
    }

    return <FilterPostsCardClient initialOptions={options} />;
}