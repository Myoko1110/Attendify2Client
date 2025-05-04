import { toast } from 'sonner';
import { useState, useEffect, createContext } from 'react';

import Grade from 'src/api/grade';
import { APIError } from 'src/abc/api-error';

import { useMember } from '../member';

// ----------------------------------------------------------------------

export const GradeContext = createContext<Grade[] | null>(null);

export function GradeProvider({ children }: { children: React.ReactNode }) {
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const { member } = useMember();

  useEffect(() => {
    if (grades === null) {
      (async () => {
        try {
          const g = await Grade.get();
          setGrades(g);
        } catch (e) {
          if (member) toast.error(APIError.createToastMessage(e));
        }
      })();
    }
  });

  return <GradeContext.Provider value={grades}>{children}</GradeContext.Provider>;
}