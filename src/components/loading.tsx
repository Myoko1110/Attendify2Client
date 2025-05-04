import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

export function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flex: '1 1 auto',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
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
  )
}