import type { SetStateAction } from 'react';

import { toast } from 'sonner';

import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import Member from 'src/api/member';

import { Iconify } from 'src/components/iconify';

import { APIError } from '../../abc/api-error';

// ----------------------------------------------------------------------

type UserTableToolbarProps = {
  selected: Member[];
  onSelectAllRows: (checked: boolean) => void;
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setMembers: React.Dispatch<SetStateAction<Member[] | null>>;
};

export function UserTableToolbar({ selected, onSelectAllRows, filterName, onFilterName, setMembers }: UserTableToolbarProps) {
  const numSelected = selected.length;

  const handleSetCompetition = async (is_competition: boolean) => {
    try {
      await Member.setCompetition(selected, is_competition);
      setMembers((prevMembers) =>
        prevMembers
          ? prevMembers.map((member) => {
            if (selected.includes(member)) {
              const newMember = member.copy();
              newMember.isCompetitionMember = is_competition;
              return newMember;
            } else {
              return member;
            }
          })
          : null
      );

      toast.success('コンクールメンバー情報を更新しました');
      onSelectAllRows(false);
    } catch (e) {
      toast.error(APIError.createToastMessage(e))
    }
  }

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
        <Stack sx={{flexDirection: "row", gap: 1}}>
          <Button onClick={() => handleSetCompetition(true)}>コンクールメンバーにする</Button>
          <Button onClick={() => handleSetCompetition(false)}>コンクールメンバーから外す</Button>
          <Tooltip title="Delete">
            <IconButton>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Toolbar>
  );
}
