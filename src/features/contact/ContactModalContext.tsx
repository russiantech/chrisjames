import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ContactMode = 'message' | 'brief';

interface ContactModalValue {
  isOpen: boolean;
  mode: ContactMode;
  open: (mode?: ContactMode) => void;
  close: () => void;
}

const ContactModalContext = createContext<ContactModalValue | null>(null);

export function ContactModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ContactMode>('message');

  const value = useMemo<ContactModalValue>(
    () => ({
      isOpen,
      mode,
      open: (nextMode = 'message') => {
        setMode(nextMode);
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
    }),
    [isOpen, mode],
  );

  return <ContactModalContext.Provider value={value}>{children}</ContactModalContext.Provider>;
}

export function useContactModal(): ContactModalValue {
  const context = useContext(ContactModalContext);
  if (context === null) {
    throw new Error('useContactModal must be used inside <ContactModalProvider>.');
  }
  return context;
}
