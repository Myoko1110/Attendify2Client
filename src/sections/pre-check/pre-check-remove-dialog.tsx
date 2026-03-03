

import type PreCheck from 'src/api/pre-check';

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
  preCheck: PreCheck;
  open: boolean;
  setOpen: (open: boolean) => void;
  setPreChecks: React.Dispatch<React.SetStateAction<PreCheck[] | null>>;
};

export function PreCheckRemoveDialog({ preCheck, open, setOpen, setPreChecks }: Props) {
  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    handleClose();

    try {
      await preCheck.remove();
      setPreChecks((prev) => {
        const index = prev!.indexOf(preCheck);
        const newPreChecks = [...prev!];
        newPreChecks.splice(index, 1);
        return newPreChecks;
      });
      toast.success('削除しました');
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>グループを削除</DialogTitle>
      <Typography variant="body2" color="textSecondary" px="24px">この事前出欠を本当に削除しますか？送信された事前出欠の情報は保持されます。</Typography>
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
