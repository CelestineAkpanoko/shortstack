'use client';

import { useSession } from "next-auth/react";
import { useState } from "react";

export function SessionDebugger() {
  const { data: session, status } = useSession();
  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md text-sm z-50"
      >
        Debug Session
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[400px] overflow-auto bg-black bg-opacity-90 text-green-400 p-4 rounded-md text-xs font-mono z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Session Debugger</h3>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-white"
        >
          Close
        </button>
      </div>
      <p>Status: <strong>{status}</strong></p>
      <p className="mt-2 mb-1">Session Data:</p>
      <pre className="overflow-auto">
        {JSON.stringify(session, null, 2)}
      </pre>
      <button 
        onClick={() => window.location.href = "/api/auth/session-check"}
        className="mt-2 bg-blue-700 text-white px-2 py-1 rounded text-sm"
      >
        Check Session API
      </button>
    </div>
  );
}