import type Grade from 'src/api/grade';
import type { ChangeEvent } from 'react';

import React, { useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import {
  Box, List,
  Stack,
  Drawer,
  ListItem,
  FormGroup,
  IconButton, Typography,
  ButtonGroup,
  FormControlLabel, CircularProgress,
} from '@mui/material';

import { useGrade } from 'src/hooks/grade';

import Group from 'src/api/group';

import { Iconify } from 'src/components/iconify';


export interface AttendanceFilterState {
  grades: number[];              // 学年（generation）
  groupIds: string[];            // グループID
}

export function AttendanceFilter({
                                   filterOpen,
                                   value,
                                   onChange,
                                    loading,
                                 }: {
  filterOpen: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  value: AttendanceFilterState;
  onChange: (next: AttendanceFilterState) => void;
  loading?: boolean;
}) {

  const grade = useGrade();
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const groups = await Group.getAll();
        setAvailableGroups(groups);
      } catch (error) {
        console.error('Failed to fetch groups:', error);
      }
    };
    fetchGroups();
  }, []);

  const getGradesByType = (type?: string): number[] => {
    if (!type) {
      return grade?.map(g => g.generation) || [];
    }

    return (grade || [])
      .filter(g => g.type === type)
      .map(g => g.generation);
  };

  const handleGradeToggle = (e: ChangeEvent<HTMLInputElement>, g: Grade, ) => {
    const nextGrades = e.target.checked
      ? [...value.grades, g.generation]
      : value.grades.filter(gen => gen !== g.generation);

    onChange({
      ...value,
      grades: nextGrades,
    });
  }

  const handleGroupToggle = (groupId: string) => {
    const nextGroupIds = value.groupIds.includes(groupId)
      ? value.groupIds.filter(id => id !== groupId)
      : [...value.groupIds, groupId];

    onChange({
      ...value,
      groupIds: nextGroupIds,
    });
  }

  return (
    <Drawer
    open={filterOpen[0]}
    onClose={() => filterOpen[1](false)}
    anchor="right"
    sx={{
      "& .MuiBackdrop-root": {
        backgroundColor: "transparent",
      },
    }}
  >
    <Box sx={{ px: 2, py: 2.5, width: 280 }}>
      <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h6">フィルター</Typography>
        <IconButton onClick={() => filterOpen[1](false)}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>
      <List>
        <ListItem disablePadding sx={{ mb: 3 }}>
          <FormGroup sx={{ width: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>学年</Typography>
            <ButtonGroup variant="outlined" aria-label="Basic button group" sx={{ mb: 1 }}>
              <Button onClick={() => onChange({ ...value, grades: getGradesByType() })} fullWidth>全体</Button>
              <Button onClick={() => onChange({ ...value, grades: getGradesByType("junior") })} fullWidth>中学</Button>
              <Button onClick={() => onChange({ ...value, grades: getGradesByType("senior") })} fullWidth>高校</Button>
            </ButtonGroup>
            {grade?.map((g) => (
              <FormControlLabel
                key={g.generation}
                value={g.generation}
                control={
                  <Checkbox
                    checked={value.grades.includes(g.generation)}
                    onChange={(e) => handleGradeToggle(e, g)}
                  />
                }
                label={g.displayName}

              />
            ))}

          </FormGroup>
        </ListItem>
        <ListItem disablePadding>
          <FormGroup sx={{ width: "100%" }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>グループ</Typography>
            {availableGroups.map((group) => (
              <FormControlLabel
                key={group.id}
                control={
                  <Checkbox
                    checked={value.groupIds.includes(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                  />
                }
                label={group.displayName}
              />
            ))}
          </FormGroup>
        </ListItem>
      </List>
    </Box>
    {loading && (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    )}
  </Drawer>
  );
}