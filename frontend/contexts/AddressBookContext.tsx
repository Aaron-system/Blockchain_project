'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Book = Record<string, string>; // pubkey → label

interface AddressBookContextType {
  book: Book;
  setLabel: (pubkey: string, label: string) => void;
  removeLabel: (pubkey: string) => void;
  getLabel: (pubkey: string) => string | undefined;
}

const AddressBookContext = createContext<AddressBookContextType>({
  book: {},
  setLabel: () => {},
  removeLabel: () => {},
  getLabel: () => undefined,
});

export function AddressBookProvider({ children }: { children: React.ReactNode }) {
  const [book, setBook] = useState<Book>({});

  useEffect(() => {
    const saved = localStorage.getItem('addressBook');
    if (saved) setBook(JSON.parse(saved));
  }, []);

  const persist = (b: Book) => {
    setBook(b);
    localStorage.setItem('addressBook', JSON.stringify(b));
  };

  const setLabel = (pubkey: string, label: string) => persist({ ...book, [pubkey]: label });
  const removeLabel = (pubkey: string) => {
    const next = { ...book };
    delete next[pubkey];
    persist(next);
  };
  const getLabel = (pubkey: string) => book[pubkey];

  return (
    <AddressBookContext.Provider value={{ book, setLabel, removeLabel, getLabel }}>
      {children}
    </AddressBookContext.Provider>
  );
}

export const useAddressBook = () => useContext(AddressBookContext);
