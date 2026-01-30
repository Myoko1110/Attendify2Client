import type Group from 'src/api/group';
import type Member from 'src/api/member';

import { toast } from 'sonner';
import { useState } from 'react';

import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import { Stack, Dialog, DialogTitle, DialogContent } from '@mui/material';

import { APIError } from 'src/abc/api-error';

import { useTable } from '../user/view';
import { Iconify } from '../../components/iconify';
import { Scrollbar } from '../../components/scrollbar';
import { UserTableHead } from '../user/user-table-head';
import { TableEmptyRows } from '../user/table-empty-rows';
import { emptyRows, applyFilter, getComparator } from '../user/utils';
import { GroupMemberAddTableRow } from './group-member-add-table-row';
import { GroupMemberAddTableToolbar } from './group-member-add-table-toolbar';

export function GroupMemberAddDialog({
  addOpen,
  setAddOpen,
  group,
  nonMembers,
  setMembers,
}: {
  addOpen: boolean;
  setAddOpen: (open: boolean) => void;
  group: Group;
  nonMembers: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}) {
  const handleAddClose = () => {
    setAddOpen(false);
    table.onSelectAllRows(false, nonMembers);
    setFilterName("");
  };

  const table = useTable();
  const [filterName, setFilterName] = useState('');

  const dataFiltered: Member[] = applyFilter({
    inputData: nonMembers || [],
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const handleAddMember = async () => {
    handleAddClose();
    try {
      await group.addMembers(table.selected.map((member) => member.id));
      setMembers((prev) => [...prev, ...table.selected]);
      toast.success('グループに部員を追加しました');
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  return (
    <Dialog open={addOpen} onClose={handleAddClose} maxWidth="lg" fullWidth sx={{ "& .MuiDialog-paper": { minHeight: "calc(100% - 64px)" }}}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: "background.neutral" }}>
        {group.displayName} に部員を追加
        <Stack gap={1} flexDirection="row">
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleAddClose}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            disabled={!table.selected.length}
            onClick={handleAddMember}
          >
            追加
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, bgcolor: "background.paper" }}>
        <GroupMemberAddTableToolbar
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
          }}
        />
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) => table.onSelectAllRows(checked, dataFiltered)}
                headLabel={[
                  { id: 'nameKana', label: '名前' },
                  { id: 'part', label: 'パート' },
                  { id: 'role', label: '役職' },
                  { id: 'generation', label: '学年' },
                  { id: 'email', label: 'メールアドレス' },
                  { id: 'recture', label: '講習', sortable: false },
                ]}
              />
              <TableBody>
                {dataFiltered.map((row) => (
                  <GroupMemberAddTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row)}
                    onSelectRow={() => table.onSelectRow(row)}
                    group={group}
                  />
                ))}

                <TableEmptyRows
                  height={54}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </DialogContent>
    </Dialog>
  );
}
