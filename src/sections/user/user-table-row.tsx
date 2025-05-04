import type Member from 'src/api/member';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useGrade } from 'src/hooks/grade';

import { Iconify } from 'src/components/iconify';

import { MemberEditDialog } from './member-edit-dialog';
import { MemberRemoveDialog } from './member-remove-dialog';

// ----------------------------------------------------------------------

type UserTableRowProps = {
  row: Member;
  setMembers: React.Dispatch<React.SetStateAction<Member[] | null>>;
  selected: boolean;
  onSelectRow: () => void;
};

export function UserTableRow({ row, selected, onSelectRow, setMembers }: UserTableRowProps) {
  const grade = useGrade();
  
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);

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

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox" sx={{ border: 0 }}>
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell component="th" scope="row" sx={{ border: 0 }}>
          <Box
            sx={{
              gap: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row.name}
          </Box>
        </TableCell>

        <TableCell sx={{ border: 0 }}>{row.part.enShort}</TableCell>

        <TableCell sx={{ border: 0 }}>{row.role?.displayName || "-"}</TableCell>

        <TableCell sx={{ border: 0 }}>{grade && row.getGrade(grade)?.displayName}</TableCell>

        <TableCell sx={{ border: 0 }}>{row.email}</TableCell>

        <TableCell sx={{ border: 0 }}>{row.lectureDay.map((l) => l.jp).join(", ")}</TableCell>

        <TableCell sx={{ border: 0 }}>{row.isCompetitionMember && "コンクールメンバー"}</TableCell>

        <TableCell sx={{ border: 0 }} align="right">
          <IconButton sx={{p:.75}} onClick={handleOpenPopover}>
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
      <MemberEditDialog member={row} open={openEditDialog} setOpen={setOpenEditDialog} setMembers={setMembers} />
      <MemberRemoveDialog member={row} open={openRemoveDialog} setOpen={setOpenRemoveDialog} setMembers={setMembers} />
    </>
  );
}
