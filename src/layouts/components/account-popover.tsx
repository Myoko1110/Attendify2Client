import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { useMember } from 'src/hooks/member';

import Auth from 'src/api/auth';

// ----------------------------------------------------------------------

export function AccountPopover() {
  const { member, setMember } = useMember();
  const router = useRouter();

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleLogout = useCallback(async () => {
    await Auth.logout();
    setMember(null);
    router.push('/login');
  }, [router, setMember]);

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          p: '2px',
          width: 40,
          height: 40,
          background: (theme) =>
            `conic-gradient(${theme.palette.primary.light}, ${theme.palette.warning.light}, ${theme.palette.primary.light})`,
        }}
      >
        <Avatar alt={member?.name} sx={{ width: 1, height: 1 }} />
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 280 },
          },
        }}
      >
        <Stack direction="row" alignItems="center">
          <Box
            sx={{
              background: (theme) =>
                `conic-gradient(${theme.palette.primary.light}, ${theme.palette.warning.light}, ${theme.palette.primary.light})`,
              borderRadius: '100%',
              m: 1.5,
              p: '2px',
            }}
          >
            <Avatar alt={member?.name} sx={{ width: 36, height: 36 }} />
          </Box>
          <Box sx={{ p: 0, py: 1.5, pr: 1.5 }}>
            <Typography variant="subtitle2" noWrap>
              {member?.name}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              {member?.email}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button fullWidth color="error" size="medium" variant="text" onClick={handleLogout}>
            ログアウト
          </Button>
        </Box>
      </Popover>
    </>
  );
}
