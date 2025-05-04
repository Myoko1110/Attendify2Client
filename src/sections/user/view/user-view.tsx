import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

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

  const dataFiltered: Member[] = applyFilter({
    inputData: members || [],
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const loadMembers = async () => {
    try {
      const m = await Member.get();
      setMembers(m);
    } catch (e) {
      toast.error(APIError.createToastMessage(e))
    }
  };

  useEffect(() => {
    loadMembers();
  }, [])

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

      <Card sx={{ flex: 1 }}>
        {members !== null ? (
          <>
            <UserTableToolbar
              selected={table.selected}
              onSelectAllRows={(checked) =>
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
                      { id: 'grade', label: '学年' },
                      { id: 'email', label: 'メールアドレス' },
                      { id: 'recture', label: '講習' },
                      { id: '' },
                      { id: '' },
                    ]}
                  />
                  <TableBody>
                    {dataFiltered
                      .map((row) => (
                        <UserTableRow
                          key={row.id}
                          row={row}
                          setMembers={setMembers}
                          selected={table.selected.includes(row)}
                          onSelectRow={() => table.onSelectRow(row)}
                        />
                      ))}

                    <TableEmptyRows
                      height={54}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, members.length)}
                    />

                    {notFound && <TableNoData searchQuery={filterName} />}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </>
        ) : (
          <Loading />
        )}

      </Card>
      <MemberAddDialog open={addOpen} setOpen={setAddOpen} setMembers={setMembers} />
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
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: Member[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: Member) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

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
    [onResetPage]
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
