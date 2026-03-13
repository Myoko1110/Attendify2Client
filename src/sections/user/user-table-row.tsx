import type Member from 'src/api/member';
import type { MembershipStatusPeriod } from 'src/api/member';

import React, { memo, useRef, useState, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { useGrade } from 'src/hooks/grade';

import { getStatusAt } from 'src/utils/get-status-at';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { StatusPeriod } from './status-period';
import { MemberEditDialog } from './member-edit-dialog';
import { MemberRemoveDialog } from './member-remove-dialog';
import WeeklyParticipationCell from './weekly-participation-cell';
import { WeeklyParticipationEditCell } from './weekly-participation-edit-cell';

// ----------------------------------------------------------------------

type UserTableRowProps = {
  row: Member;
  setMembers: React.Dispatch<React.SetStateAction<Member[] | null>>;
  roleDisplayMap: Map<string, string>;
  memberRoleKeys: string[];
  showGroups: boolean;
  showRoles: boolean;
  selected: boolean;
  onSelectRow: (row: Member) => void;
};

export const UserTableRow = memo(function UserTableRow({
  row,
  selected,
  onSelectRow,
  setMembers,
  roleDisplayMap,
  memberRoleKeys,
  showGroups,
  showRoles,
}: UserTableRowProps) {
  const grade = useGrade();
  const editableRoleKeys = memberRoleKeys;

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [openParticipation, setOpenParticipation] = useState(false);

  const anchorEl = useRef<HTMLDivElement | null>(null);

  const [statusPeriods, setStatusPeriods] = useState(row.membershipStatusPeriods);
  const [statusAt, setStatusAt] = useState<MembershipStatusPeriod | null>(
    getStatusAt(statusPeriods),
  );

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleEditOpen = () => {
    setOpenEditDialog(true);
    handleClosePopover();
  };

  const handleRemoveOpen = () => {
    setOpenRemoveDialog(true);
    handleClosePopover();
  };

  const handleSelectRow = useCallback(() => {
    onSelectRow(row);
  }, [onSelectRow, row]);

  useEffect(() => {
    setStatusAt(getStatusAt(statusPeriods));
  }, [statusPeriods]);

  return (
    <>
      <TableRow
        hover
        tabIndex={-1}
        role="checkbox"
        selected={selected}
        sx={openParticipation ? { bgcolor: (theme) => theme.palette.background.neutral } : {}}
      >
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={handleSelectRow} />
        </TableCell>

        <TableCell>{row.part.enShort}</TableCell>

        <TableCell>{grade && row.getGrade(grade)?.displayName}</TableCell>

        <TableCell component="th" scope="row">
          <Stack flexDirection="row" gap={0.5}>
            {row.name}
          </Stack>
        </TableCell>

        {showGroups && (
          <TableCell>
            <Stack flexDirection="row" gap={0.5}>
              {row.groups?.map((g) => (
                <Label key={g.id}>{g.displayName}</Label>
              ))}
            </Stack>
          </TableCell>
        )}

        {showRoles && (
          <TableCell>
            <Stack flexDirection="row" gap={0.5} flexWrap="wrap">
              {editableRoleKeys.length > 0 ? (
                editableRoleKeys.map((roleKey) => (
                  <Label key={roleKey} color="default">
                    {roleDisplayMap.get(roleKey) || roleKey}
                  </Label>
                ))
              ) : (
                '-'
              )}
            </Stack>
          </TableCell>
        )}

        <TableCell>{row.email}</TableCell>

        <TableCell>
          <Stack flexDirection="row" justifyContent="center" ref={anchorEl}>
            {statusAt ? (
              <Label
                color="warning"
                onClick={() => setOpenParticipation(true)}
                sx={{ cursor: 'pointer' }}
              >
                {statusAt.status.displayName}
              </Label>
            ) : (
              <WeeklyParticipationCell
                weeklyParticipation={row.weeklyParticipations ?? []}
                onClick={() => setOpenParticipation(true)}
              />
            )}
          </Stack>
        </TableCell>

        <Popover
          open={openParticipation}
          anchorEl={anchorEl.current}
          onClose={() => setOpenParticipation(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <StatusPeriod
            member={row}
            statusAt={statusAt}
            statusPeriods={statusPeriods}
            setStatusPeriods={setStatusPeriods}
          />
          <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
            {row.weeklyParticipations?.map((wp, index) => (
              <WeeklyParticipationEditCell key={index} wp={wp} member={row} />
            ))}
          </Box>
        </Popover>

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
      <MemberEditDialog
        member={row}
        open={openEditDialog}
        setOpen={setOpenEditDialog}
        setGroups={setMembers}
      />
      <MemberRemoveDialog
        member={row}
        open={openRemoveDialog}
        setOpen={setOpenRemoveDialog}
        setGroups={setMembers}
      />
    </>
  );
});
