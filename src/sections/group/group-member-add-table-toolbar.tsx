
import Toolbar from '@mui/material/Toolbar';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type GroupMemberAddTableToolbarProps = {
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export function GroupMemberAddTableToolbar({
  filterName,
  onFilterName,
}: GroupMemberAddTableToolbarProps) {

  return (
    <Toolbar
      sx={{
        height: 64,
        display: 'flex',
        justifyContent: 'space-between',
        p: "0!important",
      }}
    >
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
    </Toolbar>
  );
}
