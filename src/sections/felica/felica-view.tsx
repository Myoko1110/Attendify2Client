import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';


// ----------------------------------------------------------------------

export function FelicaView() {
  
  const onClick = async () => {
    const device = await navigator.usb.requestDevice({ filters: [] });
    console.log(device)
  };

  return (
    <Box
      sx={{
        mb: 5,
      }}
    >
      <Typography variant="h3">事前出欠</Typography>

      <Typography variant="body2" my={1}>
        既に提出済みです。
      </Typography>

      <Button variant="contained" color="primary" onClick={onClick} />
      
    </Box>
  );
}
