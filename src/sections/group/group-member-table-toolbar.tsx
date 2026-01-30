import type Group from 'src/api/group';
import type Member from 'src/api/member';
import type { SetStateAction } from 'react';

import { toast } from 'sonner';

import { Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { APIError } from 'src/abc/api-error';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type GroupMemberTableToolbarProps = {
  selected: Member[];
  onSelectAllRows: (checked: boolean) => void;
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setMembers: React.Dispatch<SetStateAction<Member[]>>;
  group: Group;
};

export function GroupMemberTableToolbar({
  selected,
  onSelectAllRows,
  filterName,
  onFilterName,
  setMembers,
  group,
}: GroupMemberTableToolbarProps) {
  const numSelected = selected.length;

  const handleRemoveMembers = async () => {
    try {
      await group.removeMembers(selected.map((member) => member.id));
      setMembers((prev) => prev.filter((member) => !selected.includes(member)));
      onSelectAllRows(false);
      toast.success('部員をグループから削除しました');
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  }

  return (
    <Toolbar
      sx={{
        height: 64,
        display: 'flex',
        justifyContent: 'space-between',
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
        ...(numSelected === 0 && {
          p: "0!important"
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} 件選択中
        </Typography>
      ) : (
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
      )}

      {numSelected > 0 && (
        <Stack sx={{ flexDirection: 'row', gap: 1 }}>
          <Tooltip title="削除">
            <IconButton onClick={handleRemoveMembers}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Toolbar>
  );
}
