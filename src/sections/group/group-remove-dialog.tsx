
import type Group from 'src/api/group';

import { toast } from 'sonner';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  Dialog,
  DialogTitle,
  DialogActions,
} from '@mui/material';

import { APIError } from 'src/abc/api-error';

type Props = {
  group: Group;
  open: boolean;
  setOpen: (open: boolean) => void;
  setGroups: React.Dispatch<React.SetStateAction<Group[] | null>>;
};

export function GroupRemoveDialog({ group, open, setOpen, setGroups }: Props) {
  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    handleClose();

    try {
      await group.remove();
      setGroups((prev) => {
        const index = prev!.indexOf(group);
        const newMembers = [...prev!];
        newMembers.splice(index, 1);
        return newMembers;
      });
      toast.success('削除しました');
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>グループを削除</DialogTitle>
      <Typography variant="body2" color="textSecondary" px="24px">グループ &#39;{group.displayName}&#39; を本当に削除しますか？</Typography>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          キャンセル
        </Button>
        <Button variant="contained" color="error" onClick={handleSubmit}>
          削除
        </Button>
      </DialogActions>
    </Dialog>
  );
}
