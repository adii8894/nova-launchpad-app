import React, { useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

function ViewerGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  if (tracks.length === 0) {
    return (
      <div className="aspect-video bg-black/40 rounded-xl flex items-center justify-center text-neutral-500 text-sm">
        Waiting for the stream to start...
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      {tracks.map((trackRef) => (
        <VideoTrack key={trackRef.publication.trackSid} trackRef={trackRef} className="rounded-xl w-full" />
      ))}
    </div>
  );
}

export default function LiveStream({ mint, identity }: { mint: string; identity: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [role, setRole] = useState<"broadcaster" | "viewer" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function join(asRole: "broadcaster" | "viewer") {
    setError(null);
    try {
      const res = await fetch(
        `/api/livekit/token?room=live-${mint}&identity=${encodeURIComponent(identity)}&canPublish=${asRole === "broadcaster"}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get token");
      setToken(data.token);
      setUrl(data.url);
      setRole(asRole);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (!role) {
    return (
      <div className="glass rounded-2xl p-4">
        <h3 className="display font-semibold mb-2">🔴 Live</h3>
        <p className="text-sm text-neutral-400 mb-3">Go live from your camera, or watch if someone else is.</p>
        <div className="flex gap-2">
          <button onClick={() => join("broadcaster")} className="gradient-btn text-white text-sm font-medium px-4 py-2 rounded-xl">
            Go live
          </button>
          <button onClick={() => join("viewer")} className="glass text-sm px-4 py-2 rounded-xl hover:border-white/25">
            Watch
          </button>
        </div>
        {error && <p className="text-xs text-sell mt-2">{error}</p>}
      </div>
    );
  }

  if (!token || !url) {
    return <div className="glass rounded-2xl p-4 text-sm text-neutral-400">Connecting...</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={url}
      connect={true}
      audio={role === "broadcaster"}
      video={role === "broadcaster"}
      onDisconnected={() => setRole(null)}
    >
      <div className="glass rounded-2xl p-4">
        <h3 className="display font-semibold mb-3">
          🔴 Live {role === "broadcaster" ? "— you're broadcasting" : "— watching"}
        </h3>
        <ViewerGrid />
      </div>
    </LiveKitRoom>
  );
}
