import type Group from 'src/api/group';

import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Dialog, DialogTitle, DialogActions, DialogContent } from '@mui/material';


type Props = {
  group: Group;
  open: boolean;
  setOpen: (open: boolean) => void;
  setGroups: React.Dispatch<React.SetStateAction<Group[] | null>>;
};

const initialErrorMsg = {
  name: '',
};

export function GroupEditDialog({ group, open, setOpen, setGroups }: Props) {
  const [name, setName] = useState(group.displayName);

  const [errorMsg, setErrorMsg] = useState({ ...initialErrorMsg });

  const reset = useCallback(() => {
    setName(group.displayName);
    resetErrorMsg();
  }, [group.displayName]);

  const resetErrorMsg = () => {
    setErrorMsg({ ...initialErrorMsg });
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async () => {
    resetErrorMsg();
    if (!name.trim()) {
      setErrorMsg({ name: '必須項目です' });
    }

    handleClose();

    const newGroup = await group.rename(name);
    setGroups((prev) => {
      const index = prev!.indexOf(group);
      const updated = [...prev!];
      updated[index] = newGroup;
      return updated;
    });
    toast.success('更新しました');
  };

  useEffect(() => {
    reset();
  }, [group, reset]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>グループを編集</DialogTitle>
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
