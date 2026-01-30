import type Group from 'src/api/group';
import type Member from 'src/api/member';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';

import { useGrade } from 'src/hooks/grade';

import { APIError } from '../../abc/api-error';

// ----------------------------------------------------------------------

type UserTableAddRowProps = {
  row: Member;
  selected: boolean;
  onSelectRow: () => void;
  group: Group;
};

export function GroupMemberAddTableRow({ row, selected, onSelectRow, group }: UserTableAddRowProps) {
  const grade = useGrade();

  const handleRemove = async () => {
    try {
      await group.removeMember(row.id);
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

        <TableCell >{row.isCompetitionMember && "コンクールメンバー"}</TableCell>
      </TableRow>
  );
}
