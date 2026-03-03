
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
import PreCheck from '../../../api/pre-check';
import { TableEmptyRows } from '../table-empty-rows';
import { PreCheckTableRow } from '../pre-check-table-row';
import { PreCheckAddDialog } from '../pre-check-add-dialog';
import { PreCheckTableHead } from '../pre-check-table-head';


// ----------------------------------------------------------------------

export function PreCheckView() {
  const table = useTable();

  const [preChecks, setPreChecks] = useState<PreCheck[] | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const loadMembers = async () => {
    try {
      const g = await PreCheck.getAll();
      setPreChecks(g);
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
          事前出欠
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

      <Card
        sx={{
          flex: 1,
          ...(preChecks === null && {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }),
        }}
      >
        {preChecks !== null ? (
          <Scrollbar>
            <TableContainer sx={{ overflow: 'unset' }}>
              <Table sx={{ minWidth: 800 }}>
                <PreCheckTableHead
                  order={table.order}
                  orderBy={table.orderBy}
                  rowCount={preChecks.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) => table.onSelectAllRows(checked, preChecks)}
                  headLabel={[
                    { id: 'displayName', label: '期間' },
                    { id: 'count', label: '' },
                    { id: 'button' },
                    { id: '' },
                  ]}
                />
                <TableBody>
                  {preChecks.map((row) => (
                    <PreCheckTableRow
                      key={row.id}
                      row={row}
                      setPreChecks={setPreChecks}
                      selected={table.selected.includes(row)}
                      onSelectRow={() => table.onSelectRow(row)}
                    />
                  ))}

                  <TableEmptyRows
                    height={54}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, preChecks.length)}
                  />
                </TableBody>
              </Table>
              {preChecks.length === 0 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" align="center" sx={{ mt: 3, mb: 3, width: '100%' }}>
                    表示する事前出欠がありません。
                  </Typography>
                </Box>
              )}
            </TableContainer>
          </Scrollbar>
        ) : (
          <Loading />
        )}
      </Card>
      <PreCheckAddDialog open={addOpen} setOpen={setAddOpen} setPreChecks={setPreChecks} />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<keyof PreCheck>('startDate');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<PreCheck[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: keyof PreCheck) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy],
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: PreCheck[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: PreCheck) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected],
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
