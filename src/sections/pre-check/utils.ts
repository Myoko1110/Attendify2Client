import type Member from 'src/api/member';

import type PreCheck from '../../api/pre-check';

// ----------------------------------------------------------------------

export const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
} as const;

// ----------------------------------------------------------------------

export function emptyRows(page: number, rowsPerPage: number, arrayLength: number) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

// ----------------------------------------------------------------------

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function partComparator(a: Member, b: Member) {
  if (b.part.score < a.part.score) {
    return -1;
  }
  if (b.part.score > a.part.score) {
    return 1;
  }
  if (b.generation < a.generation) {
    return -1;
  }
  if (b.generation > a.generation) {
    return 1;
  }
  if (b.nameKana < a.nameKana) {
    return -1;
  }
  if (b.nameKana > a.nameKana) {
    return 1;
  }
  return 0;
}

function getRoleComparator(a: Member, b: Member) {
  if (b.role.score < a.role.score) {
    return -1;
  }
  if (b.role.score > a.role.score) {
    return 1;
  }
  if (b.generation < a.generation) {
    return -1;
  }
  if (b.generation > a.generation) {
    return 1;
  }
  if (b.nameKana < a.nameKana) {
    return -1;
  }
  if (b.nameKana > a.nameKana) {
    return 1;
  }
  return 0;
}

// ----------------------------------------------------------------------

export function getComparator<Key extends keyof PreCheck>(
  order: 'asc' | 'desc',
  orderBy: Key,
): (a: PreCheck, b: PreCheck) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
