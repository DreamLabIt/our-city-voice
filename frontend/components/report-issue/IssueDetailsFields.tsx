"use client";

import {
    Controller,
    type Control,
    type FieldErrors,
    type UseFormRegister,
} from "react-hook-form";
import type { ReportFormProps, FormValues } from "@/types/issues";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type IssueDetailsFieldsProps = {
    register: UseFormRegister<FormValues>;
    control: Control<FormValues>;
    errors: FieldErrors<FormValues>;
    reportFilters: ReportFormProps["reportFilters"];
    invalidateAddressCoordinates: () => void;
};

export function IssueDetailsFields({
    register,
    control,
    errors,
    reportFilters,
    invalidateAddressCoordinates,
}: IssueDetailsFieldsProps) {
    return (
        <>
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
                        validate: (value) =>
                            value.trim().length >= 6 ||
                            "Title must be at least 6 characters.",
                        maxLength: {
                            value: 160,
                            message: "Title cannot exceed 160 characters.",
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
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    invalidateAddressCoordinates();
                                }}
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
        </>
    );
}

export default IssueDetailsFields;