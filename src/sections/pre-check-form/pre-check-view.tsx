import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';

import { useMember } from 'src/hooks/member';

import PreCheck from 'src/api/pre-check';
import PreAttendance from 'src/api/pre-attendance';

import { Loading } from 'src/components/loading';

import { fDate } from '../../utils/format-time';
import { PreCheckInput } from './pre-check-input';

import type { WeeklyParticipation } from '../../api/member';

// ----------------------------------------------------------------------

export function PreCheckView() {
  const [preCheck, setPreCheck] = useState<PreCheck>();
  const [preAttendances, setPreAttendances] = useState<PreAttendance[]>();
  const [weeklyParticipations, setWeeklyParticipations] = useState<WeeklyParticipation[]>([]);
  const { member } = useMember();

  const [page, setPage] = useState(0);

  const [searchParams] = useSearchParams();
  const checkId = searchParams.get('id');

  const [notExists, setNotExists] = useState(false);

  useEffect(() => {
    if (!member || !checkId) {
      setNotExists(true);
      return;
    }
    (async () => {
      const _preCheck = await PreCheck.get(checkId);
      if (!_preCheck) {
        setNotExists(true);
        return;
      }
      setPreCheck(_preCheck);

      const p = await PreAttendance.get({ member, preCheck: _preCheck });
      setPreAttendances(p);
      setPage(p.length > 0 ? 1 : 0);

      const wp = await member.getWeeklyParticipation();
      setWeeklyParticipations(wp);
    })();
  }, [checkId, member]);

  const isLoading = !member || !checkId || !preCheck || !preAttendances;

  return (
    <>
      {notExists ? (
        <Typography>指定された事前出欠は、存在しません。</Typography>
      ) : isLoading ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loading />
        </Box>
      ) : page === 0 ? (
        <PreCheckInput
          preCheck={preCheck}
          weeklyParticipations={weeklyParticipations}
          member={member}
          mode="create"
          onSubmitted={(result: PreAttendance[]) => {
            setPreAttendances(result);
            setPage(3);
          }}
        />
      ) : page === 2 ? (
        <PreCheckInput
          preCheck={preCheck}
          weeklyParticipations={weeklyParticipations}
          member={member}
          preAttendances={preAttendances}
          mode="edit"
          onSubmitted={(result: PreAttendance[]) => {
            setPreAttendances(result);
            setPage(3);
          }}
        />
      ) : page === 1 ? (
        <Box
          sx={{
            mb: 5,
          }}
        >
          <Typography variant="body2">
            {fDate(preCheck.startDate.toDayjs())} ~ {fDate(preCheck.endDate.toDayjs())}
          </Typography>
          <Typography variant="h3">事前出欠</Typography>

          <Typography variant="body2" my={1}>
            既に提出済みです。
          </Typography>

          <Button variant="contained" color="inherit" onClick={() => setPage(2)}>
            回答を編集
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            mb: 5,
          }}
        >
          <Typography variant="body2">
            {fDate(preCheck.startDate.toDayjs())} ~ {fDate(preCheck.endDate.toDayjs())}
          </Typography>
          <Typography variant="h3">事前出欠</Typography>

          <Typography variant="body2" my={1}>
            回答ありがとうございます。送信しました。
            <br />
          </Typography>

          <Button variant="contained" color="inherit" onClick={() => setPage(2)}>
            回答を編集
          </Button>
        </Box>
      )}
    </>
  );
}
