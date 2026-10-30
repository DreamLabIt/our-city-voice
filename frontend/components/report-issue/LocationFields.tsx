"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import type { FormValues } from "@/types/issues";
import { Input } from "@/components/ui/input";

type LocationFieldsProps = {
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
    isGeocoding: boolean;
    hasCoordinates: boolean;
    invalidateAddressCoordinates: () => void;
    handleAddressChange: () => void;
    handleLocationBlur: () => void;
    locationOptional?: boolean;
};

export function LocationFields({
    register,
    errors,
    isGeocoding,
    hasCoordinates,
    invalidateAddressCoordinates,
    handleAddressChange,
    handleLocationBlur,
    locationOptional = false,
}: LocationFieldsProps) {
    return (
        <div className="space-y-4 pt-2">
            <div className="space-y-1">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide block">
                    Location Information
                </span>

                {locationOptional && (
                    <p className="text-xs text-muted-foreground">
                        Leave City and Address empty to use your phone&apos;s
                        current location.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label
                        htmlFor="city"
                        className="text-xs font-bold text-foreground uppercase tracking-wide"
                    >
                        City{" "}
                        {!locationOptional && (
                            <span className="text-primary">*</span>
                        )}
                    </label>

                    <Input
                        id="city"
                        placeholder="Enter city"
                        {...register("location.city", {
                            required: locationOptional
                                ? false
                                : "City is required.",
                            maxLength: {
                                value: 80,
                                message:
                                    "City cannot exceed 80 characters.",
                            },
                            onChange: invalidateAddressCoordinates,
                            onBlur: handleLocationBlur,
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
                        {!locationOptional && (
                            <span className="text-primary">*</span>
                        )}
                    </label>

                    <div className="relative mt-2">
                        <Input
                            id="location"
                            placeholder="Street address or nearby landmark"
                            {...register("location.address", {
                                required: locationOptional
                                    ? false
                                    : "Location address is required.",
                                maxLength: {
                                    value: 240,
                                    message:
                                        "Address cannot exceed 240 characters.",
                                },
                                onChange: handleAddressChange,
                                onBlur: handleLocationBlur,
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

                    {isGeocoding && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Checking address on map...</span>
                        </p>
                    )}

                    {!isGeocoding &&
                        !errors.location?.address &&
                        hasCoordinates && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>
                                    Location found
                                </span>
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
                            onChange: invalidateAddressCoordinates,
                            onBlur: handleLocationBlur,
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
                            onChange: invalidateAddressCoordinates,
                            onBlur: handleLocationBlur,
                        })}
                        className="bg-section border-border-custom rounded mt-2"
                    />
                </div>
            </div>
        </div>
    );
}

export default LocationFields;