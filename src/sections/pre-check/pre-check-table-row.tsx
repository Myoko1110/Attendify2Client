

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Iconify } from 'src/components/iconify';

import { fDate } from '../../utils/format-time';
import { PreCheckDetail } from './pre-check-detail';
import { RouterLink } from '../../routes/components';
import { PreCheckEditDialog } from './pre-check-edit-dialog';
import { PreCheckRemoveDialog } from './pre-check-remove-dialog';

import type PreCheck from '../../api/pre-check';
import type PreAttendance from '../../api/pre-attendance';

// ----------------------------------------------------------------------

type UserTableRowProps = {
  row: PreCheck;
  setPreChecks: React.Dispatch<React.SetStateAction<PreCheck[] | null>>;
  selected: boolean;
  onSelectRow: () => void;
};

export function PreCheckTableRow({ row, selected, onSelectRow, setPreChecks }: UserTableRowProps) {
  const theme = useTheme();

  const [preAttendances, setPreAttendances] = useState<PreAttendance[]>([]);

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [openMembersDialog, setOpenDetailDialog] = useState(false);

  const formLink = `/pre-check/form?id=${row.id}`;

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleEditOpen = () => {
    setOpenEditDialog(true);
    handleClosePopover();
  }

  const handleRemoveOpen = () => {
    setOpenRemoveDialog(true);
    handleClosePopover();
  }

  const handleDetailOpen = () => {
    setOpenDetailDialog(true);
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(location.origin + formLink);
    toast.success("クリップボードにリンクをコピーしました。")
  };

  useEffect(() => {
    if (!row) return;
    row.getAttendances().then((p) => setPreAttendances(p));
  }, [row]);

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>
        <TableCell component="th" scope="row">
          <Box
            sx={{
              gap: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {fDate(row.startDate.toDayjs())} ~ {fDate(row.endDate.toDayjs())}
          </Box>
        </TableCell>

        <TableCell>
          <Button variant="contained" color="inherit" onClick={handleDetailOpen}>
            提出状況
          </Button>
        </TableCell>

        <TableCell>
          <Link component={RouterLink} href={formLink} target="_blank" underline="always">
            フォーム
          </Link>
          <Tooltip title="クリップボードにコピー">
            <IconButton sx={{ mx: 0.5 }} onClick={copyToClipboard}>
              <Iconify icon="material-symbols:content-copy-outline" color="#1877f2" />
            </IconButton>
          </Tooltip>
        </TableCell>

        <TableCell align="right">
          <IconButton sx={{ p: 0.75 }} onClick={handleOpenPopover}>
            <Iconify width={16} icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem onClick={handleEditOpen}>
            <Iconify icon="solar:pen-bold" />
            編集
          </MenuItem>

          <MenuItem onClick={handleRemoveOpen} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            削除
          </MenuItem>
        </MenuList>
      </Popover>
      <PreCheckEditDialog
        preCheck={row}
        open={openEditDialog}
        setOpen={setOpenEditDialog}
        setPreChecks={setPreChecks}
      />
      <PreCheckRemoveDialog
        preCheck={row}
        open={openRemoveDialog}
        setOpen={setOpenRemoveDialog}
        setPreChecks={setPreChecks}
      />
      <PreCheckDetail open={openMembersDialog} setOpen={setOpenDetailDialog} preCheck={row} />
    </>
  );
}
