import { useContext } from 'react';

import { GradeContext } from './grade-context';

export function useGrade() {
  return useContext(GradeContext);
}
