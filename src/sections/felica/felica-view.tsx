import React from 'react';

import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

import { FeliCaReader } from './reader';


// ----------------------------------------------------------------------

export function FelicaView() {

  return (
    <Box
      sx={{
        mb: 5,
      }}
    >
      <Typography variant="h3">出席登録</Typography>

      <FeliCaReader />
      
    </Box>
  );
}
