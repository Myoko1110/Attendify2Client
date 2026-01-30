
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { APIError } from 'src/abc/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Loading } from 'src/components/loading';
import { Scrollbar } from 'src/components/scrollbar';

import { emptyRows } from '../utils';
import Group from '../../../api/group';
import { GroupTableRow } from '../group-table-row';
import { GroupTableHead } from '../group-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { GroupAddDialog } from '../group-add-dialog';

// ----------------------------------------------------------------------

export function GroupView() {
  const table = useTable();

  const [groups, setGroups] = useState<Group[] | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const loadMembers = async () => {
    try {
      const g = await Group.getAll();
      setGroups(g);
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
          グループ
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setAddOpen(true)}
        >
          作成
        </Button>
      </Box>

      <Card sx={{
        flex: 1,
        ...(groups === null && {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }),
      }}>
        {groups !== null ? (
          <Scrollbar>
              <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 800 }}>
                  <GroupTableHead
                    order={table.order}
                    orderBy={table.orderBy}
                    rowCount={groups.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        groups
                      )
                    }
                    headLabel={[
                      { id: 'displayName', label: '名前' },
                      { id: 'count', label: '人数' },
                      { id: 'button' },
                      { id: '' },
                    ]}
                  />
                  <TableBody>
                    {groups
                      .map((row) => (
                        <GroupTableRow
                          key={row.id}
                          row={row}
                          setGroups={setGroups}
                          selected={table.selected.includes(row)}
                          onSelectRow={() => table.onSelectRow(row)}
                        />
                      ))}

                    <TableEmptyRows
                      height={54}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, groups.length)}
                    />
                  </TableBody>
                </Table>
                {groups.length === 0 && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" align="center" sx={{ mt: 3, mb: 3, width: '100%' }}>
                      表示するグループがありません。
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            </Scrollbar>
        ) : (
          <Loading />
        )}

      </Card>
      <GroupAddDialog open={addOpen} setOpen={setAddOpen} setGroups={setGroups} />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<keyof Group>('createdAt');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<Group[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: keyof Group) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: Group[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: Group) => {
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
