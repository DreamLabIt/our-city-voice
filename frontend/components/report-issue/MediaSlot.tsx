import { Film, Play, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { UploadSlot } from "@/hooks/use-uploads";

function useObjectUrl(file: File | undefined) {
    const [preview, setPreview] = useState<{
        file: File;
        url: string;
    } | null>(null);

    useEffect(() => {
        if (!file) {
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) setPreview({ file, url: objectUrl });
        });
        return () => {
            cancelled = true;
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    return preview && preview.file === file ? preview.url : null;
}

export function MediaSlot({
    slot,
    isBusy,
    onRemove,
}: {
    slot: UploadSlot;
    isBusy: boolean;
    onRemove: (id: string) => void;
}) {
    const isVideo = slot.file?.type?.startsWith("video/");
    const src = useObjectUrl(slot.file);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            v.play();
        } else {
            v.pause();
        }
    };

    return (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border-custom bg-muted flex items-center justify-center">
            {src ? (
                isVideo ? (
                    <>
                        <video
                            ref={videoRef}
                            src={src}
                            className="w-full h-full object-cover cursor-pointer"
                            muted
                            playsInline
                            preload="auto"
                            onLoadedData={(e) => {
                                e.currentTarget.currentTime = 0.1;
                            }}
                            onPlay={() => setPlaying(true)}
                            onPause={() => setPlaying(false)}
                            onEnded={() => setPlaying(false)}
                            onClick={togglePlay}
                        />

                        {!playing && (
                            <button
                                type="button"
                                onClick={togglePlay}
                                aria-label={`Play ${slot.name}`}
                                className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-10"
                            >
                                <Play className="w-5 h-5 ml-0.5 fill-white" />
                            </button>
                        )}
                    </>
                ) : (
                    <Image
                        src={src}
                        alt={slot.name}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                )
            ) : (
                <div className="text-xs text-muted-foreground p-2 text-center truncate">
                    {slot.name}
                </div>
            )}

            {isVideo && !playing && (
                <Film className="absolute bottom-1 left-1 w-4 h-4 text-white drop-shadow pointer-events-none" />
            )}

            {slot.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold pointer-events-none z-20">
                    {slot.progress}%
                </div>
            )}

            {slot.status === "error" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs text-center p-2 pointer-events-none z-20">
                    Upload failed
                </div>
            )}

            <button
                type="button"
                onClick={() => onRemove(slot.id)}
                disabled={isBusy}
                aria-label={`Remove ${slot.name}`}
                className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-destructive text-white rounded-full transition-colors disabled:opacity-50 z-30"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}