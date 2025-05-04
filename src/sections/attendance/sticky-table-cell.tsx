import { TableCell } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StickyTableCell = styled(TableCell)(({ theme }) => ({
  minWidth: 150,
  maxWidth: 150,
  width: 150,
  position: 'sticky',
  left: 0,
  zIndex: 5,
  backgroundColor: 'white',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderLeft: `1px solid ${theme.palette.grey[200]}`,
    borderRight: `1px solid ${theme.palette.grey[200]}`,
    background: "transparent",
    zIndex: 0,
  },
}));