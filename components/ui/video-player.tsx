import React from "react";

interface VideoPlayerProps {
  url?: string | null;
  title?: string;
  className?: string;
}

export function VideoPlayer({ url, title = "Video Embed", className = "" }: VideoPlayerProps) {
  if (!url) return null;

  // Transform YouTube / Vimeo URL into proper embed URL
  let embedUrl = url;
  if (url.includes("youtube.com/watch?v=")) {
    embedUrl = url.replace("watch?v=", "embed/");
  } else if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    embedUrl = `https://www.youtube.com/embed/${id}`;
  } else if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split("?")[0];
    embedUrl = `https://player.vimeo.com/video/${id}`;
  }

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-900 ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
