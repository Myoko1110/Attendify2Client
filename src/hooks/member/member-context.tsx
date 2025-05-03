import type Member from 'src/api/member';

import { useState, createContext } from 'react';

// ----------------------------------------------------------------------

export type MemberContextType = {
  member: Member | null;
  setMember: (member: Member | null) => void;
};

export const MemberContext = createContext<MemberContextType>({
  member: null,
  setMember: () => {},
});

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  return <MemberContext.Provider value={{ member, setMember }}>{children}</MemberContext.Provider>;
}