import { createClient, type LockFunc } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

(window as any).supabase = supabase;
