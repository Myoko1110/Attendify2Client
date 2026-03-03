import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import type { NavItem } from '../nav-config-dashboard';
import type { WorkspacesPopoverProps } from '../components/workspaces-popover';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data: NavItem[];
  bottomData?: NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  workspaces: WorkspacesPopoverProps['data'];
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  bottomData,
  slots,
  workspaces,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid ${varAlpha(theme.palette.grey['500Channel'], 0.12)}`,
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} bottomData={bottomData} slots={slots} workspaces={workspaces} />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  bottomData,
  open,
  slots,
  onClose,
  workspaces,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} bottomData={bottomData} slots={slots} workspaces={workspaces} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, bottomData, slots, workspaces, sx }: NavContentProps) {
  const pathname = usePathname();

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => {
      const isActived = item.path === pathname;

      return (
        <ListItem disableGutters disablePadding key={item.title}>
          <ListItemButton
            disableGutters
            component={RouterLink}
            href={item.path}
            sx={[
              (theme) => ({
                pl: 2,
                py: 1,
                gap: 2,
                pr: 1.5,
                borderRadius: 0.75,
                typography: 'body2',
                fontWeight: 'fontWeightMedium',
                color: theme.palette.text.secondary,
                minHeight: 44,
                ...(isActived && {
                  fontWeight: 'fontWeightSemiBold',
                  color: theme.palette.primary.main,
                  bgcolor: varAlpha(theme.palette.primary.lighterChannel, 0.08),
                  '&:hover': {
                    bgcolor: varAlpha(theme.palette.primary.lighterChannel, 0.16),
                  },
                }),
              }),
            ]}
          >
            <Box component="span" sx={{ width: 24, height: 24 }}>
              {item.icon}
            </Box>

            <Box component="span" sx={{ flexGrow: 1 }}>
              {item.title}
            </Box>

            {item.info && item.info}
          </ListItemButton>
        </ListItem>
      );
    });

  return (
    <>
      <Logo />

      {slots?.topArea}

      {/*<WorkspacesPopover data={workspaces} sx={{ my: 2 }} />*/}

      <Scrollbar
        fillContent
        sx={{ my: 4 }}
        slotProps={{
          contentSx: {
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: '100%',
          },
        }}
      >
        <Box
          component="nav"
          sx={[
            {
              display: 'flex',
              flex: '1 1 auto',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100%',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <Box
            component="ul"
            sx={{
              gap: 0.5,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {renderNavItems(data)}
          </Box>

          {bottomData && bottomData.length > 0 && (
            <Box
                component="ul"
                sx={{
                  gap: 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  mt: 2,
                }}
              >
                {renderNavItems(bottomData)}
              </Box>
          )}
        </Box>
      </Scrollbar>

      {slots?.bottomArea}
    </>
  );
}
