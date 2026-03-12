import { useState, useEffect } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useGrade } from 'src/hooks/grade';
import { useMember } from 'src/hooks/member';

import Member from 'src/api/member';

import { ForbiddenView } from 'src/sections/error';

export function AuthLoader({
  children,
  fallback,
  redirect,
  requireDashboardAccess = false,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  redirect?: boolean;
  requireDashboardAccess?: boolean;
}) {
  const router = useRouter();

  const { member, setMember } = useMember();
  const grade = useGrade();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  const redirectTo = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    (async () => {
      if (member) {
        if (requireDashboardAccess && grade) {
          setHasPermission(member.canAccessDashboard());
        } else {
          setHasPermission(true);
        }
        setIsLoading(false);
      } else {
        try {
          const self = await Member.getSelf({ includeGroups: true, includeStatusPeriods: true, includeRoles: true });
          if (requireDashboardAccess && grade) {
            setHasPermission(self.canAccessDashboard());
          } else {
            setHasPermission(true);
          }

          setIsLoading(false);
          setMember(self);
        } catch (e: unknown) {
          router.replace(`/login${redirect ? `?redirect=${redirectTo}` : ''}`);
        }
      }
    })();
  }, [member, router, setMember, requireDashboardAccess, grade, redirect, redirectTo]);

  if (!isLoading && requireDashboardAccess && !hasPermission) {
    return <ForbiddenView />;
  }

  if (!isLoading) {
    if (requireDashboardAccess) {
      return hasPermission ? children : fallback;
    }
    return children;
  }

  return fallback;
}
