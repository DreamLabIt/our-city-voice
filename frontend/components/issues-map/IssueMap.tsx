"use client";

import { useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { pinBounds } from "@/lib/map";
import type { IssueMapPin } from "@/types";

export interface IssueMapProps {
    pins: IssueMapPin[];
    selectedPin: IssueMapPin | null;
    onSelectPin: (pin: IssueMapPin) => void;
}

export const markerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function MapViewport({
    pins,
    selectedPin,
}: {
    pins: IssueMapPin[];
    selectedPin: IssueMapPin | null;
}) {
    const map = useMap();

    useEffect(() => {
        const bounds = pinBounds(pins);
        if (!bounds) return;

        const options = { padding: [48, 48] as [number, number], animate: false };

        if (pins.length === 1) {
            map.setView([pins[0]!.lat, pins[0]!.lng], 15, { animate: false });
            return;
        }

        map.fitBounds(bounds, { ...options, maxZoom: 15 });
    }, [pins, map]);

    useEffect(() => {
        if (!selectedPin) return;
        map.flyTo([selectedPin.lat, selectedPin.lng], 15, { duration: 0.8 });
    }, [selectedPin, map]);

    return null;
}

export default function IssueMap({
    pins,
    selectedPin,
    onSelectPin,
}: IssueMapProps) {

    const initialCenter: [number, number] = pins[0]
        ? [pins[0].lat, pins[0].lng]
        : [43.653226, -79.383184];

    return (
        <MapContainer
            center={initialCenter}
            zoom={12}
            scrollWheelZoom={true}
            attributionControl={false}
            className="w-full h-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewport pins={pins} selectedPin={selectedPin} />

            {pins.map((pin) => (
                <Marker
                    key={pin.id}
                    position={[pin.lat, pin.lng]}
                    icon={markerIcon}
                    eventHandlers={{
                        click: () => onSelectPin(pin),
                    }}
                >
                    <Popup>
                        <div className="space-y-1 min-w-45">
                            <p className="font-semibold text-sm">{pin.title}</p>
                            <p className="text-xs text-gray-500">{pin.address}</p>
                            <p className="text-xs text-gray-500">
                                {pin.category} · {pin.status}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
