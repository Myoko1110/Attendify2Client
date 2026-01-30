import { toast } from 'sonner';
import { useState } from 'react';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { APIError } from 'src/abc/api-error';

import Group from '../../api/group';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  setGroups: React.Dispatch<React.SetStateAction<Group[] | null>>;
};

const initialErrorMsg = {
  name: '',
};

export function GroupAddDialog({ open, setOpen, setGroups }: Props) {
  const [name, setName] = useState('');

  const [errorMsg, setErrorMsg] = useState({ ...initialErrorMsg });

  const reset = () => {
    setName('');
    resetErrorMsg();
  };

  const resetErrorMsg = () => {
    setErrorMsg({ ...initialErrorMsg });
  }

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async () => {
    resetErrorMsg();
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMsg({ name: '必須項目です' });
        setName(trimmedName)
        return;
      }

      handleClose();

      const m = await Group.create(trimmedName);
      setGroups((prev): Group[] => [...prev!, m]);

      toast.success("登録しました");

    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>グループを作成</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              autoFocus
              fullWidth
              error={!!errorMsg.name}
              helperText={errorMsg.name}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="contained" color="inherit" onClick={handleSubmit}>
          登録
        </Button>
      </DialogActions>
    </Dialog>
  );
}
