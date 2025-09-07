'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, CameraOff, Check, ImageUp, RefreshCcw, X } from 'lucide-react';

export default function SelfieCapture({
                                          value,
                                          onChange,
                                          className,
                                          label = 'Selfie for KYC',
                                          hint = 'Use your front camera or upload a clear face photo (jpg/png).',
                                          required = false,
                                      }: {
    value?: File | null;
    onChange: (file: File | null) => void;
    className?: string;
    label?: string;
    hint?: string;
    required?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [capturing, setCapturing] = useState(false);
    const [shotUrl, setShotUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ---------- helpers ----------
    const waitForVideoRef = () =>
        new Promise<HTMLVideoElement>((resolve, reject) => {
            let tries = 0;
            const tick = () => {
                const v = videoRef.current;
                if (v) return resolve(v);
                if (tries++ > 60) return reject(new Error('Video element not mounted'));
                requestAnimationFrame(tick);
            };
            tick();
        });

    const waitForLoadedMetadata = (video: HTMLVideoElement) =>
        new Promise<void>((resolve) => {
            if (video.readyState >= 1) return resolve();
            const on = () => {
                video.removeEventListener('loadedmetadata', on);
                resolve();
            };
            video.addEventListener('loadedmetadata', on, { once: true });
        });

    const stopCamera = useCallback(() => {
        try {
            streamRef.current?.getTracks().forEach((t) => t.stop());
        } catch {}
        streamRef.current = null;
        setCapturing(false);
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    // External file → preview
    useEffect(() => {
        if (!value) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(value);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [value]);

    // ---------- camera logic ----------
    const startCamera = async () => {
        setError(null);

        // Must be HTTPS or localhost
        if (
            typeof window !== 'undefined' &&
            window.isSecureContext !== true &&
            location.hostname !== 'localhost' &&
            location.hostname !== '127.0.0.1'
        ) {
            setError('Camera requires HTTPS (or localhost).');
            return;
        }

        // Stop any previous session
        stopCamera();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: { ideal: 'user' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            streamRef.current = stream;

            setShotUrl(null);
            setCapturing(true); // show video

            // Ensure the <video> exists before using it
            const video = await waitForVideoRef();

            // Assign stream (with fallback for older browsers)
            try {
                (video as any).srcObject = stream;
            } catch {
                video.src = URL.createObjectURL(stream as any);
            }

            await waitForLoadedMetadata(video);

            try {
                await video.play();
            } catch {
                // Some browsers still require a user tap on the video to start playback
            }
        } catch (e) {
            console.error(e);
            setError('Could not access camera. You can still upload a photo below.');
            stopCamera();
        }
    };

    const takeShot = async () => {
        const video = videoRef.current;
        if (!video) return;

        if (!video.videoWidth || !video.videoHeight) {
            await waitForLoadedMetadata(video);
            if (!video.videoWidth || !video.videoHeight) return;
        }

        // Build a square canvas from the centre of the frame
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const size = Math.min(vw, vh);
        const sx = (vw - size) / 2;
        const sy = (vh - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Un-mirror (we mirror the video for UX)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setShotUrl(dataUrl);
    };

    const acceptShot = async () => {
        if (!shotUrl) return;
        const blob = await (await fetch(shotUrl)).blob();
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        onChange(file);
        stopCamera();
    };

    const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        onChange(file);
    };

    const clear = () => {
        onChange(null);
        setShotUrl(null);
    };

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="font-medium">
                        {label}
                        {required ? ' *' : ''}
                    </div>
                    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
                </div>
                {previewUrl ? (
                    <Button variant="outline" size="sm" onClick={clear} className="rounded-xl">
                        <X className="mr-2 h-4 w-4" /> Remove
                    </Button>
                ) : null}
            </div>

            {/* Visual container */}
            <div className="relative overflow-hidden rounded-2xl border bg-muted">
                {/* Always mount the video so ref is stable; hide when not capturing */}
                <div className={capturing ? 'block' : 'hidden'}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ transform: 'scaleX(-1)' }}
                        className="w-full aspect-square object-cover bg-black"
                    />
                    {/* Face guide */}
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <div className="h-[70%] aspect-square rounded-full border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                    </div>
                </div>

                {/* File preview if provided */}
                {!capturing && previewUrl && (
                    <img src={previewUrl} alt="Selfie preview" className="w-full aspect-square object-cover" />
                )}

                {/* Captured shot (from camera) */}
                {!previewUrl && shotUrl && !capturing && (
                    <img src={shotUrl} alt="Captured selfie" className="w-full aspect-square object-cover" />
                )}
            </div>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                {!capturing ? (
                    <>
                        <Button onClick={startCamera} className="rounded-xl">
                            <Camera className="mr-2 h-4 w-4" /> Use camera
                        </Button>

                        <label className="inline-flex">
                            <input
                                type="file"
                                accept="image/*"
                                capture="user"
                                onChange={onFilePick}
                                className="hidden"
                            />
                            <Button variant="outline" type="button" className="rounded-xl">
                                <ImageUp className="mr-2 h-4 w-4" /> Upload photo
                            </Button>
                        </label>
                    </>
                ) : (
                    <>
                        {!shotUrl ? (
                            <>
                                <Button onClick={takeShot} className="rounded-xl">
                                    <Check className="mr-2 h-4 w-4" /> Capture
                                </Button>
                                <Button onClick={stopCamera} variant="outline" className="rounded-xl">
                                    <CameraOff className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={acceptShot} className="rounded-xl">
                                    <Check className="mr-2 h-4 w-4" /> Use this photo
                                </Button>
                                <Button onClick={() => setShotUrl(null)} variant="outline" className="rounded-xl">
                                    <RefreshCcw className="mr-2 h-4 w-4" /> Retake
                                </Button>
                                <Button onClick={stopCamera} variant="ghost" className="rounded-xl">
                                    <CameraOff className="mr-2 h-4 w-4" /> Done
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
