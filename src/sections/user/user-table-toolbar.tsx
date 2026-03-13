import type Member from 'src/api/member';
import type { SetStateAction } from 'react';

import { memo, useState } from 'react';

import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';

import { BulkStatusPeriodAddDialog } from './bulk-status-period-add-dialog';

// ----------------------------------------------------------------------

type UserTableToolbarProps = {
  selected: Member[];
  onSelectAllRows: (checked: boolean) => void;
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setMembers: React.Dispatch<SetStateAction<Member[] | null>>;
  showGroups: boolean;
  showRoles: boolean;
  onToggleGroups: (checked: boolean) => void;
  onToggleRoles: (checked: boolean) => void;
};

export const UserTableToolbar = memo(function UserTableToolbar({ selected, onSelectAllRows, filterName, onFilterName, setMembers, showGroups, showRoles, onToggleGroups, onToggleRoles }: UserTableToolbarProps) {
  const numSelected = selected.length;
  const [openBulkStatusPeriod, setOpenBulkStatusPeriod] = useState(false);

  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(0, 1, 0, 3),
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} 件選択中
        </Typography>
      ) : (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <OutlinedInput
            fullWidth
            value={filterName}
            onChange={onFilterName}
            placeholder="検索"
            startAdornment={
              <InputAdornment position="start">
                <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            }
            sx={{ maxWidth: 320 }}
          />
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControlLabel
              control={<Switch checked={showGroups} onChange={(e) => onToggleGroups(e.target.checked)} />}
              label="グループ表示"
            />
            <FormControlLabel
              control={<Switch checked={showRoles} onChange={(e) => onToggleRoles(e.target.checked)} />}
              label="ロール表示"
            />
          </Stack>
        </Stack>
      )}

      {numSelected > 0 && (
        <Stack sx={{flexDirection: "row", gap: 1}}>
          <Button onClick={() => setOpenBulkStatusPeriod(true)}>ステータス追加</Button>
          <Tooltip title="Delete">
            <IconButton>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {openBulkStatusPeriod && (
        <BulkStatusPeriodAddDialog 
          open={openBulkStatusPeriod} 
          setOpen={setOpenBulkStatusPeriod} 
          members={selected} 
          onSuccess={(results) => {
            onSelectAllRows(false);
            // Update only the members that had successful additions in-memory
            setMembers((prevMembers) =>
              prevMembers
                ? prevMembers.map((member) => {
                    const hit = results.find((r) => r.memberId === member.id);
                    if (hit) {
                      const copy = member.copy();
                      copy.membershipStatusPeriods = copy.membershipStatusPeriods ? [...copy.membershipStatusPeriods] : [];
                      copy.membershipStatusPeriods.push(hit);
                      return copy;
                    }
                    return member;
                  })
                : null,
            );
          }}
        />
      )}
    </Toolbar>
  );
});
