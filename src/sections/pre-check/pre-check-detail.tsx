import type PreCheck from 'src/api/pre-check';
import type PreAttendance from 'src/api/pre-attendance';

import { useState, useEffect } from 'react';

import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import { Tab, Tabs, Stack, Dialog, DialogTitle, DialogContent, useMediaQuery } from '@mui/material';

import Member from 'src/api/member';
import Schedule from 'src/api/schedule';

import { Scrollbar } from 'src/components/scrollbar';

import Part from '../../abc/part';
import { emptyRows } from './utils';
import { useTable } from '../user/view';
import { TableEmptyRows } from '../user/table-empty-rows';
import { applyFilter, getComparator } from '../user/utils';
import { PreCheckDetailTableRow } from './pre-check-detail-table-row';
import { PreCheckDetailTableHead } from './pre-check-detail-table-head';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  preCheck: PreCheck;
};

export function PreCheckDetail({ open, setOpen, preCheck }: Props) {
  const handleClose = () => {
    setOpen(false);
  };
  const table = useTable();
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [preAttendances, setPreAttendances] = useState<PreAttendance[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [statusTab, setStatusTab] = useState<'submitted' | 'unsubmitted'>('submitted');

  const submittedMemberIds = new Set(preAttendances.map((attendance) => attendance.memberId));
  const submittedMembers = allMembers.filter((member) => submittedMemberIds.has(member.id));
  const unsubmittedMembers = allMembers.filter((member) => !submittedMemberIds.has(member.id));
  const currentMembers = statusTab === 'submitted' ? submittedMembers : unsubmittedMembers;

  const theme = useTheme();
  const mediaQuery = useMediaQuery(theme.breakpoints.down('sm'));

  const preAttendanceByMemberId = new Map(
    preAttendances.map((attendance) => [attendance.memberId, attendance]),
  );

  const dataFiltered: Member[] = applyFilter({
    inputData: currentMembers,
    comparator: getComparator(table.order, table.orderBy),
    filterName: "",
  });

  useEffect(() => {
    (async () => {
      const all = await Member.get();
      const mem = all.filter((member) => !member.part.equals(Part.ADVISOR));
      setAllMembers(mem);

      const pre = await preCheck.getAttendances();
      setPreAttendances(pre);

      const sch = await Schedule.get();
      setSchedules(sch);
    })();
  }, [preCheck]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={mediaQuery}
      sx={{
        '& .MuiDialog-paper': {
          minHeight: 'calc(100% - 64px)',
          [theme.breakpoints.down('sm')]: { borderRadius: 0 },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'background.neutral',
        }}
      >
        提出状況
        <Stack gap={1} flexDirection="row">
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            閉じる
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.paper' }}
      >
        <Tabs
          value={statusTab}
          onChange={(_, value) => {
            setStatusTab(value);
            table.onResetPage();
          }}
          sx={{ px: 2 }}
        >
          <Tab value="submitted" label={`提出済み (${submittedMembers.length})`} />
          <Tab value="unsubmitted" label={`未提出 (${unsubmittedMembers.length})`} />
        </Tabs>
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <PreCheckDetailTableHead
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
                headLabel={[
                  { id: 'part', label: 'パート' },
                  { id: 'generation', label: '学年' },
                  { id: 'nameKana', label: '名前' },
                  { id: 'createdAt', label: '提出日時' },
                  { id: 'updatedAt', label: '更新日時' },
                  { id: 'btn', label: '' },
                ]}
              />
              <TableBody>
                {dataFiltered.map((row) => {
                  const preAttendance = preAttendanceByMemberId.get(row.id) ?? null;

                  return (
                    <PreCheckDetailTableRow
                      key={row.id}
                      row={row}
                      createdAt={preAttendance?.createdAt ?? null}
                      updatedAt={preAttendance?.updateAt ?? null}
                      preCheck={preCheck}
                      schedules={schedules}
                      preAttendances={preAttendances}
                    />
                  );
                })}

                <TableEmptyRows
                  height={54}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, currentMembers.length)}
                />
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </DialogContent>
    </Dialog>
  );
}
