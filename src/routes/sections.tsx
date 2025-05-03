import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthLoader } from 'src/components/auth-loader';

// ----------------------------------------------------------------------

export const AttendancePage = lazy(() => import('src/pages/attendance'));
export const UserPage = lazy(() => import('src/pages/user'));
export const InputPage = lazy(() => import('src/pages/input'));
export const SchedulePage = lazy(() => import('src/pages/schedule'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));

const renderFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: 1,
        maxWidth: 320,
        bgcolor: (theme) => varAlpha(theme.vars.palette.text.primaryChannel, 0.16),
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    element: (
      <AuthLoader fallback={renderFallback()}>
        <DashboardLayout>
            <Suspense fallback={renderFallback()}>
              <Outlet />
            </Suspense>
        </DashboardLayout>
      </AuthLoader>
    ),
    children: [
      { index: true, element: <AttendancePage /> },
      { path: 'member', element: <UserPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'input', element: <InputPage /> },
    ],
  },
  {
    path: 'login',
    element: (
      <AuthLayout>
        <SignInPage />
      </AuthLayout>
    ),
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
