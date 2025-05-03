import { toast } from 'sonner';
import { useState, useEffect, createContext } from 'react';

import Grade from 'src/api/grade';
import { APIError } from 'src/abc/api-error';

// ----------------------------------------------------------------------

export const GradeContext = createContext<Grade[] | null>(null);

export function GradeProvider({ children }: { children: React.ReactNode }) {
  const [grades, setGrades] = useState<Grade[] | null>(null);

  useEffect(() => {
    if (grades === null) {
      (async () => {
        try {
          const g = await Grade.get();
          setGrades(g);
        } catch (e) {
          toast.error(APIError.createToastMessage(e));
        }
      })();
    }
  });

  return <GradeContext.Provider value={grades}>{children}</GradeContext.Provider>;
}