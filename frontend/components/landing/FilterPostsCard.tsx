import FilterPostsCardClient from "./FilterPostsCardClient";
import type { FilterPostsCardProps } from "@/types/report";

export default function FilterPostsCard({ options }: FilterPostsCardProps) {
    return <FilterPostsCardClient initialOptions={options} />;
}