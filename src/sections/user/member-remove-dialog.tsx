import type Member from 'src/api/member';

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
  member: Member;
  open: boolean;
  setOpen: (open: boolean) => void;
  setMembers: React.Dispatch<React.SetStateAction<Member[] | null>>;
};

export function MemberRemoveDialog({ member, open, setOpen, setMembers }: Props) {
  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    handleClose();

    try {
      await member.remove();
      setMembers((prev) => {
        const index = prev!.indexOf(member);
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
      <DialogTitle>部員を削除</DialogTitle>
      <Typography variant="body2" color="textSecondary" px="24px">&#39;{member.name}&#39; を本当に削除しますか？</Typography>
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
