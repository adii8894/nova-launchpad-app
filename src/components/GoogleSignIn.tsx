import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function GoogleSignIn() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-xs text-neutral-500 px-3 py-2">Loading...</div>;
  }

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 glass px-3 py-2 rounded-xl text-sm hover:border-white/25 w-full"
      >
        {session.user?.image && (
          <img src={session.user.image} alt="" className="w-5 h-5 rounded-full" />
        )}
        <span className="truncate">{session.user?.name ?? session.user?.email}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => signIn("google")}
        className="flex items-center justify-center gap-2 glass px-3 py-2 rounded-xl text-sm hover:border-white/25 w-full"
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.64v3h3.87c2.27-2.09 3.57-5.17 3.57-8.82z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.12-6.74-4.96H1.27v3.1A12 12 0 0 0 12 24z"/>
          <path fill="#FBBC05" d="M5.26 14.28A7.2 7.2 0 0 1 4.88 12c0-.79.14-1.56.38-2.28V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.21 6.87 8.87 4.75 12 4.75z"/>
        </svg>
        Google
      </button>
      <button
        onClick={() => signIn("github")}
        className="flex items-center justify-center gap-2 bg-white/90 hover:bg-white text-black px-3 py-2 rounded-xl text-sm w-full font-medium"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.06-.02-2.08-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        GitHub
      </button>
    </div>
  );
}
