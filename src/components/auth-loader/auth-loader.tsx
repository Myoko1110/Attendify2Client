import { useState, useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useMember } from 'src/hooks/member';

import Member from 'src/api/member';

export function AuthLoader({
                             children,
                             fallback,
                           }: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const router = useRouter();

  const { member, setMember } = useMember();
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    (async () => {
      if (member) {
        setIsLogin(true);
      } else {
        try {
          const self = await Member.getSelf();
          setIsLogin(true);
          setMember(self);
        } catch (_e) {
          router.replace('/login');
        }
      }
    })();
  }, [member, router, setMember]);

  return isLogin ? children : fallback;
}
