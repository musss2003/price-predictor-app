import React, { createContext, ReactNode, useContext, useState } from "react";

export type PredictionInput = {
  city: string;
  m2: number;
  floor: number;
  built: number;
};

export type PredictionRecord = {
  id: string;
  createdAt: string;
  input: PredictionInput;
  price: number;
};

type PredictionHistoryContextType = {
  history: PredictionRecord[];
  addRecord: (input: PredictionInput, price: number) => void;
  clearHistory: () => void;
};

const PredictionHistoryContext = createContext<PredictionHistoryContextType | undefined>(
  undefined
);

export function PredictionHistoryProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [history, setHistory] = useState<PredictionRecord[]>([]);

  const addRecord = (input: PredictionInput, price: number) => {
    setHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        input,
        price,
      },
      ...prev,
    ]);
  };

  const clearHistory = () => setHistory([]);

  return (
    <PredictionHistoryContext.Provider value={{ history, addRecord, clearHistory }}>
      {children}
    </PredictionHistoryContext.Provider>
  );
}

export function usePredictionHistory() {
  const ctx = useContext(PredictionHistoryContext);
  if (!ctx) {
    throw new Error("usePredictionHistory must be used within PredictionHistoryProvider");
  }
  return ctx;
}
