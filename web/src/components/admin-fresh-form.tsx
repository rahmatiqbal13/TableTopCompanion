"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Routes stay mounted but hidden after you leave them, so a blank form would
 * still hold what was just saved when you come back to it. This starts the
 * form over once it has been submitted; unsaved writing is left alone.
 */
export function FreshAfterSubmit({ children }: { children: React.ReactNode }) {
  const [round, setRound] = useState(0);
  const submitted = useRef(false);
  useLayoutEffect(() => () => {
    if (submitted.current) {
      submitted.current = false;
      setRound((r) => r + 1);
    }
  }, []);
  return <div key={round} onSubmit={() => { submitted.current = true; }}>{children}</div>;
}
