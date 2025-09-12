import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Township = string;

interface TownshipContextValue {
  township: Township;
  setTownship: (township: Township) => void;
  availableTownships: Township[];
}

const TownshipContext = createContext<TownshipContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = "kasilink:twp";

const DEFAULT_TOWNSHIP: Township = "Soweto";

const DEFAULT_TOWNSHIPS: Township[] = [
  "Soweto",
  "Alexandra",
  "Tembisa",
  "Mamelodi",
  "Khayelitsha",
  "Mitchells Plain",
  "KwaMashu",
  "Mdantsane"
];

export const TownshipProvider = ({ children }: { children: ReactNode }) => {
  const [township, setTownshipState] = useState<Township>(DEFAULT_TOWNSHIP);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setTownshipState(stored);
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  const setTownship = (next: Township) => {
    setTownshipState(next);
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, next);
    } catch {
      // Ignore storage write failures
    }
  };

  const value = useMemo<TownshipContextValue>(() => ({
    township,
    setTownship,
    availableTownships: DEFAULT_TOWNSHIPS,
  }), [township]);

  return (
    <TownshipContext.Provider value={value}>{children}</TownshipContext.Provider>
  );
};

export const useTownship = (): TownshipContextValue => {
  const ctx = useContext(TownshipContext);
  if (!ctx) {
    throw new Error("useTownship must be used within a TownshipProvider");
  }
  return ctx;
};

