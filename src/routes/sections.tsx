import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { AuthLayout } from 'src/layouts/auth';
import { DashboardLayout } from 'src/layouts/dashboard';

import { AuthLoader } from 'src/components/auth-loader';

// ----------------------------------------------------------------------

export const AttendanceNewPage = lazy(() => import('src/pages/attendance-n'));
export const MemberPage = lazy(() => import('src/pages/member'));
export const GroupPage = lazy(() => import('src/pages/group'));
export const InputPage = lazy(() => import('src/pages/input'));
export const SchedulePage = lazy(() => import('src/pages/schedule'));
export const SignInPage = lazy(() => import('src/pages/sign-in'));
export const PreCheckPage = lazy(() => import('src/pages/pre-check'));
export const PreCheckFormPage = lazy(() => import('src/pages/pre-check-form'));
export const FelicaPage = lazy(() => import('src/pages/felica'));
export const SettingsPage = lazy(() => import('src/pages/settings'));
export const Page404 = lazy(() => import('src/pages/page-not-found'));
export const Page403 = lazy(() => import('src/pages/page-forbidden'));

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
        bgcolor: (theme) => theme.palette.grey[400],
        [`& .${linearProgressClasses.bar}`]: { bgcolor: 'text.primary' },
      }}
    />
  </Box>
);

export const routesSection: RouteObject[] = [
  {
    element: (
      <AuthLoader fallback={renderFallback()} requireDashboardAccess>
        <DashboardLayout>
          <Suspense fallback={renderFallback()}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthLoader>
    ),
    children: [
      { index: true, element: <AttendanceNewPage /> },
      { path: 'member', element: <MemberPage /> },
      { path: 'group', element: <GroupPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'input', element: <InputPage /> },
      { path: 'pre-check', element: <PreCheckPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: 'pre-check/form',
    element: (
      <AuthLoader fallback={renderFallback()} redirect>
        <AuthLayout
          slotProps={{
            content: { sx: { width: '100%', maxWidth: '1200px' } },
            main: { sx: { px: '12px!important' } },
          }}
        >
          <PreCheckFormPage />
        </AuthLayout>
      </AuthLoader>
    ),
  },
  {
    path: 'ic',
    element: (
      <AuthLoader fallback={renderFallback()}>
        <AuthLayout
          slotProps={{
            content: { sx: { p: '0!important' } },
          }}
        >
          <FelicaPage />
        </AuthLayout>
      </AuthLoader>
    ),
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
    path: '403',
    element: <Page403 />,
  },
  {
    path: '404',
    element: <Page404 />,
  },
  { path: '*', element: <Page404 /> },
];
