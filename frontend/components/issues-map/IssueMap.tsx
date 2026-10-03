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

import type { Issue } from "@/types";

export interface IssueMapProps {
    issues: Issue[];
    selectedIssue: Issue | null;
    onSelectIssue: (issue: Issue) => void;
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

function MapController({
    selectedIssue,
}: {
    selectedIssue: Issue | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (!selectedIssue) return;

        map.flyTo(
            [selectedIssue.lat, selectedIssue.lng],
            15,
            {
                duration: 0.8,
            }
        );
    }, [selectedIssue, map]);

    return null;
}

export default function IssueMap({
    issues,
    selectedIssue,
    onSelectIssue,
}: IssueMapProps) {
    const defaultCenter: [number, number] = [
        24.9172,
        89.9482,
    ];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={14}
            scrollWheelZoom={true}
            className="w-full h-full"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController selectedIssue={selectedIssue} />

            {issues.map((issue) => (
                <Marker
                    key={issue.id}
                    position={[issue.lat, issue.lng]}
                    icon={markerIcon}
                    eventHandlers={{
                        click: () => onSelectIssue(issue),
                    }}
                >
                    <Popup>
                        <div className="space-y-1 min-w-[180px]">
                            <p className="font-semibold text-sm">
                                {issue.title}
                            </p>

                            <p className="text-xs text-gray-500">
                                {issue.location}
                            </p>

                            <p className="text-xs text-gray-500">
                                {issue.category}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}