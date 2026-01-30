import type Group from 'src/api/group';
import type Member from 'src/api/member';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useGrade } from 'src/hooks/grade';

import { Iconify } from 'src/components/iconify';

import { APIError } from '../../abc/api-error';

// ----------------------------------------------------------------------

type UserTableRowProps = {
  row: Member;
  selected: boolean;
  onSelectRow: () => void;
  group: Group;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
};

export function GroupMemberTableRow({ row, selected, onSelectRow, group, setMembers }: UserTableRowProps) {
  const grade = useGrade();

  const handleRemove = async () => {
    try {
      await group.removeMember(row.id);
      setMembers((prev) => prev.filter((member) => member.id !== row.id));
      toast.success("部員をグループを削除しました");
    } catch (e) {
      toast.error(APIError.createToastMessage(e))
    }
  }

  return (
    <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
      <TableCell padding="checkbox" >
        <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
      </TableCell>
        <TableCell component="th" scope="row" >
          <Box
            sx={{
              gap: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row.name}
          </Box>
        </TableCell>

        <TableCell >{row.part.enShort}</TableCell>

        <TableCell >{row.role?.displayName || "-"}</TableCell>

        <TableCell >{grade && row.getGrade(grade)?.displayName}</TableCell>

        <TableCell >{row.email}</TableCell>

        <TableCell >{row.lectureDay.map((l) => l.jp).join(", ")}</TableCell>

        <TableCell  align="right">
          <IconButton sx={{p:.75}} color="error" onClick={handleRemove}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </TableCell>
      </TableRow>
  );
}
