
import type Group from 'src/api/group';
import type Member from 'src/api/member';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Iconify } from 'src/components/iconify';

import { GroupMembers } from './group-members';
import { GroupEditDialog } from './group-edit-dialog';
import { GroupRemoveDialog } from './group-remove-dialog';

// ----------------------------------------------------------------------

type UserTableRowProps = {
  row: Group;
  setGroups: React.Dispatch<React.SetStateAction<Group[] | null>>;
  selected: boolean;
  onSelectRow: () => void;
};

export function GroupTableRow({ row, selected, onSelectRow, setGroups }: UserTableRowProps) {
  const [members, setMembers] = useState<Member[]>([]);

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);

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

  useEffect(() => {
    if (!row) return;
    row.getMembers().then((m) => setMembers(m));
  }, [row])

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox" >
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>
        <TableCell component="th" scope="row" >
          <Box
            sx={{
              gap: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row.displayName}
          </Box>
        </TableCell>

        <TableCell >{members.length}人</TableCell>

        <TableCell >
          <Button color="inherit" onClick={() => setOpenMembersDialog(true)} variant="contained">部員を表示</Button>
        </TableCell>


        <TableCell  align="right">
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
      <GroupEditDialog group={row} open={openEditDialog} setOpen={setOpenEditDialog} setGroups={setGroups} />
      <GroupRemoveDialog group={row} open={openRemoveDialog} setOpen={setOpenRemoveDialog} setGroups={setGroups} />
      <GroupMembers open={openMembersDialog} setOpen={setOpenMembersDialog} members={members} setMembers={setMembers} group={row} />
    </>
  );
}
