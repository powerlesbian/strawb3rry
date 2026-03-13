import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { deriveKey, generateSalt, encrypt, decrypt } from '../lib/crypto';
import { useAuth } from './AuthContext';

// A known plaintext used to verify the passphrase is correct on unlock.
const CANARY = 'strawb3rry_vault_v1';

export type VaultStatus = 'loading' | 'not_setup' | 'locked' | 'unlocked';

type CryptoContextType = {
  vaultStatus: VaultStatus;
  setupVault: (passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  encryptValue: (plaintext: string) => Promise<{ ciphertext: string; iv: string }>;
  decryptValue: (ciphertext: string, iv: string) => Promise<string>;
};

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

export function CryptoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Key lives only in memory — clears on page close or lock()
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [vaultStatus, setVaultStatus] = useState<VaultStatus>('loading');

  const checkVault = useCallback(async (userId: string) => {
    setVaultStatus('loading');
    let settled = false;

    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        setVaultStatus('not_setup');
      }
    }, 5000);

    try {
      const { data } = await supabase
        .from('vault_settings')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      clearTimeout(timeoutId);
      if (!settled) {
        settled = true;
        setVaultStatus(data ? 'locked' : 'not_setup');
      }
    } catch {
      clearTimeout(timeoutId);
      if (!settled) {
        settled = true;
        setVaultStatus('not_setup');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkVault(user.id);
    } else {
      setKey(null);
      setVaultStatus('not_setup');
    }
  }, [user, checkVault]);

  const setupVault = useCallback(
    async (passphrase: string) => {
      if (!user) return;
      const salt = generateSalt();
      const derivedKey = await deriveKey(passphrase, salt);
      const { ciphertext: canary, iv: canary_iv } = await encrypt(derivedKey, CANARY);
      await supabase.from('vault_settings').insert({ user_id: user.id, salt, canary, canary_iv });
      setKey(derivedKey);
      setVaultStatus('unlocked');
    },
    [user],
  );

  const unlock = useCallback(
    async (passphrase: string): Promise<boolean> => {
      if (!user) return false;
      const { data } = await supabase
        .from('vault_settings')
        .select('salt, canary, canary_iv')
        .eq('user_id', user.id)
        .single();
      if (!data) return false;
      try {
        const derivedKey = await deriveKey(passphrase, data.salt);
        const decrypted = await decrypt(derivedKey, data.canary, data.canary_iv);
        if (decrypted !== CANARY) return false;
        setKey(derivedKey);
        setVaultStatus('unlocked');
        return true;
      } catch {
        return false;
      }
    },
    [user],
  );

  const lock = useCallback(() => {
    setKey(null);
    setVaultStatus('locked');
  }, []);

  const encryptValue = useCallback(
    async (plaintext: string) => {
      if (!key) throw new Error('Vault is locked');
      return encrypt(key, plaintext);
    },
    [key],
  );

  const decryptValue = useCallback(
    async (ciphertext: string, iv: string) => {
      if (!key) throw new Error('Vault is locked');
      return decrypt(key, ciphertext, iv);
    },
    [key],
  );

  return (
    <CryptoContext.Provider value={{ vaultStatus, setupVault, unlock, lock, encryptValue, decryptValue }}>
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error('useCrypto must be used within CryptoProvider');
  return ctx;
}
