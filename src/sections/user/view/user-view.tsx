import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import Member from 'src/api/member';
import { APIError } from 'src/abc/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Loading } from 'src/components/loading';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { MemberAddDialog } from '../member-add-dialog';
import { UserTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

// ----------------------------------------------------------------------

export function UserView() {
  const table = useTable();

  const [members, setMembers] = useState<Member[] | null>(null);

  const [filterName, setFilterName] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  // O(1) で選択状態を確認するための Set
  const selectedSet = useMemo(
    () => new Set(table.selected.map((m) => m.id)),
    [table.selected]
  );

  const handleSelectAllRows = useCallback(
    (checked: boolean) => {
      table.onSelectAllRows(checked, members || []);
    },
    [table, members]
  );

  const dataFiltered: Member[] = applyFilter({
    inputData: members || [],
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const loadMembers = async () => {
    try {
      const m = await Member.get({ includeGroups: true, includeWeeklyParticipation: true, includeStatusPeriods: true });
      setMembers(m);
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          部員
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setAddOpen(true)}
        >
          登録
        </Button>
      </Box>

      <Card
        sx={{
          flex: 1,
          ...(members === null && {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }),
        }}
      >
        {members !== null ? (
          <>
            <UserTableToolbar
              selected={table.selected}
              onSelectAllRows={handleSelectAllRows}
              filterName={filterName}
              onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
                setFilterName(event.target.value);
                table.onResetPage();
              }}
              setMembers={setMembers}
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
                    onSelectAllRows={handleSelectAllRows}
                    headLabel={[
                      { id: 'nameKana', label: '名前' },
                      { id: 'groups' , label: 'グループ', sortable: false },
                      { id: 'part', label: 'パート' },
                      { id: 'role', label: '役職' },
                      { id: 'generation', label: '学年' },
                      { id: 'email', label: 'メールアドレス' },
                      { id: 'pariticipationInfo', label: '参加情報', sortable: false, align: 'center' },
                      { id: '' },
                    ]}
                  />
                  <TableBody>
                    {dataFiltered.map((row) => (
                      <UserTableRow
                        key={row.id}
                        row={row}
                        setMembers={setMembers}
                        selected={selectedSet.has(row.id)}
                        onSelectRow={table.onSelectRow}
                      />
                    ))}

                    <TableEmptyRows
                      height={54}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, members.length)}
                    />

                    {notFound && <TableNoData searchQuery={filterName} />}
                  </TableBody>
                </Table>
                {members.length === 0 && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" align="center" sx={{ mt: 3, mb: 3, width: '100%' }}>
                      部員が登録されていません。右上の登録ボタンから追加して下さい。
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            </Scrollbar>
          </>
        ) : (
          <Loading />
        )}
      </Card>
      <MemberAddDialog open={addOpen} setOpen={setAddOpen} setGroups={setMembers} />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<keyof Member>('part');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<Member[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: keyof Member) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy],
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: Member[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback((inputValue: Member) => {
    setSelected((prev) => {
      const isSelected = prev.includes(inputValue);
      return isSelected
        ? prev.filter((value) => value !== inputValue)
        : [...prev, inputValue];
    });
  }, []);

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((_e: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage],
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}
