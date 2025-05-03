import { useContext } from 'react';

import { MemberContext } from './member-context';

export function useMember() {
  return useContext(MemberContext);
}
