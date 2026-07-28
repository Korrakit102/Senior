"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export default function CameraCaptureModal({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    let mounted = true;

    const startCamera = async () => {
      setError("");
      setCameraReady(false);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง กรุณาใช้อัปโหลดรูปแทน");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
          setCameraReady(true);
        }
      } catch {
        if (mounted) {
          setError("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสิทธิ์กล้องหรือใช้อัปโหลดรูปแทน");
        }
      }
    };

    void startCamera();

    return () => {
      mounted = false;
      window.removeEventListener("keydown", onKey);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open, onClose]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("กล้องยังไม่พร้อม กรุณาลองอีกครั้ง");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("ไม่สามารถถ่ายรูปได้ กรุณาลองอีกครั้ง");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("ไม่สามารถบันทึกรูปจากกล้องได้");
          return;
        }

        onCapture(
          new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" })
        );
        onClose();
      },
      "image/jpeg",
      0.9
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <div className="text-base font-semibold text-zinc-900">
                เปิดกล้อง
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                จัดภาพให้ชัดแล้วกดถ่ายรูป
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 px-4 pb-4">
            <div className="aspect-video overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950">
              {error ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white">
                  {error}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  onLoadedMetadata={() => setCameraReady(true)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={capture}
                disabled={Boolean(error) || !cameraReady}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                {cameraReady ? "ถ่ายรูป" : "กำลังเปิดกล้อง..."}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
