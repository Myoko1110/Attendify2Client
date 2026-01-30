import type Group from 'src/api/group';

import { useMemo, useState, useEffect } from 'react';

import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import {
  Stack,
  Dialog,
  DialogTitle, DialogContent,
} from '@mui/material';

import Member from 'src/api/member';

import { useTable } from '../user/view';
import { Iconify } from '../../components/iconify';
import { Scrollbar } from '../../components/scrollbar';
import { UserTableHead } from '../user/user-table-head';
import { TableEmptyRows } from '../user/table-empty-rows';
import { GroupMemberTableRow } from './group-member-table-row';
import { GroupMemberAddDialog } from './group-member-add-dialog';
import { emptyRows, applyFilter, getComparator } from '../user/utils';
import { GroupMemberTableToolbar } from './group-member-table-toolbar';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  group: Group;
};


export function GroupMembers({ open, setOpen, members, setMembers, group }: Props) {
  const handleClose = () => {
    setOpen(false);
  }
  const table = useTable();
  const [addOpen, setAddOpen] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  const [filterName, setFilterName] = useState('');

  const dataFiltered: Member[] = applyFilter({
    inputData: members || [],
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const nonMembers = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.id));
    return allMembers.filter((member) => !memberIds.has(member.id));
  }, [allMembers, members]);
  
  useEffect(() => {
    (async () => {
      const all = await Member.get();
      setAllMembers(all);
    })();
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth sx={{ "& .MuiDialog-paper": { minHeight: "calc(100% - 64px)" }}}>
      <DialogTitle sx={{display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "background.neutral"}}>
        {group.displayName} の部員
        <Stack gap={1} flexDirection="row">
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClose}
          >
            閉じる
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setAddOpen(true)}
          >
            追加
          </Button>
        </Stack>

      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, bgcolor: "background.paper" }}>
        <GroupMemberTableToolbar
          selected={table.selected}
          onSelectAllRows={(checked: boolean) =>
            table.onSelectAllRows(
              checked,
              members
            )
          }
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
          setMembers={setMembers}
          group={group}
        />
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={members.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    members
                  )
                }
                headLabel={[
                  { id: 'nameKana', label: '名前' },
                  { id: 'part', label: 'パート' },
                  { id: 'role', label: '役職' },
                  { id: 'generation', label: '学年' },
                  { id: 'email', label: 'メールアドレス' },
                  { id: 'recture', label: '講習', sortable: false },
                  { id: '' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .map((row) => (
                    <GroupMemberTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row)}
                      onSelectRow={() => table.onSelectRow(row)}
                      group={group}
                      setMembers={setMembers}
                    />
                  ))}

                <TableEmptyRows
                  height={54}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, members.length)}
                />
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </DialogContent>
      <GroupMemberAddDialog addOpen={addOpen} setAddOpen={setAddOpen} group={group} nonMembers={nonMembers} setMembers={setMembers} />
    </Dialog>
  );
}
