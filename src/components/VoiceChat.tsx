import React, { useEffect, useState, useCallback } from "react";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";

function ParticipantList() {
  const participants = useParticipants();
  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <div key={p.identity} className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              p.isSpeaking ? "bg-buy animate-pulse" : "bg-neutral-600"
            }`}
          />
          <span className="truncate">{p.identity}</span>
          {p.isMicrophoneEnabled === false && <span className="text-neutral-500 text-xs">(muted)</span>}
        </div>
      ))}
    </div>
  );
}

function Controls() {
  const { localParticipant } = useLocalParticipant();
  const [muted, setMuted] = useState(false);

  const toggleMute = useCallback(async () => {
    const next = !muted;
    await localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted, localParticipant]);

  return (
    <button
      onClick={toggleMute}
      className={`w-full py-2 rounded-xl text-sm font-medium ${
        muted ? "bg-sell text-black" : "gradient-btn text-white"
      }`}
    >
      {muted ? "Unmute" : "Mute"}
    </button>
  );
}

export default function VoiceChat({ mint, identity }: { mint: string; identity: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    try {
      const res = await fetch(
        `/api/livekit/token?room=voice-${mint}&identity=${encodeURIComponent(identity)}&canPublish=true`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get token");
      setToken(data.token);
      setUrl(data.url);
      setJoined(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (!joined) {
    return (
      <div className="glass rounded-2xl p-4">
        <h3 className="display font-semibold mb-2">🎙️ Voice chat</h3>
        <p className="text-sm text-neutral-400 mb-3">Join the live voice room for this coin.</p>
        <button onClick={join} className="gradient-btn text-white text-sm font-medium px-4 py-2 rounded-xl">
          Join voice chat
        </button>
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
      audio={true}
      video={false}
      onDisconnected={() => setJoined(false)}
    >
      <div className="glass rounded-2xl p-4">
        <h3 className="display font-semibold mb-3">🎙️ Voice chat — live</h3>
        <ParticipantList />
        <div className="mt-3">
          <Controls />
        </div>
      </div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
