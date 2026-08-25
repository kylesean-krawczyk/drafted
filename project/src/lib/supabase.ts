import { createClient, type LockFunc } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Workaround for a known supabase-js bug (github.com/supabase/supabase-js
// issues #1594, #2013, #2111): the default lock, built on the browser's
// Web Locks API, can get orphaned and hang every future auth-dependent
// call forever. This replaces it with a simple in-memory queue that
// can't get stuck across reloads.
let lockQueue: Promise<unknown> = Promise.resolve();
const inMemoryLock: LockFunc = async (_name, _acquireTimeout, fn) => {
  const previous = lockQueue;
  let release: () => void;
  lockQueue = new Promise((resolve) => {
    release = resolve;
  });
  try {
    await previous;
    return await fn();
  } finally {
    release!();
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: inMemoryLock,
  },
});
if (import.meta.env.DEV || true) {
  (window as unknown as { supabase: typeof supabase }).supabase = supabase;
}
