import React, { useState, useEffect } from 'react';

import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '../../components/iconify';

interface AttendanceStatus {
  label: string;
  style: string;
  isDelete?: boolean;
}

const attendanceStatuses: Record<string, AttendanceStatus> = {
  '欠席': { label: '欠席', style: 'bg-red-200 text-red-900' },
  '遅刻': { label: '遅刻', style: 'bg-orange-200 text-orange-900' },
  '早退': { label: '早退', style: 'bg-amber-200 text-amber-900' },
  '講習': { label: '講習', style: 'bg-blue-200 text-blue-900' },
};

export const WeeklyParticipationCellEditor = ({
                                                attendance,
                                                onSave,
                                                onDelete,
                                                onClose,
                                                anchorEl,
                                                isEditing,
                                                isActive
                                              }: {
  attendance: string | null;
  onSave: (value: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  isEditing: boolean;
  isActive: boolean;
}) => {
  const [value, setValue] = useState<string>("");
  const original = attendance;

  const handleSave = () => {
    if (value?.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  const handleClose = () => {
    if (value !== (original || '')) {
      handleSave();
    }
    onClose();
  };

  const handlePresetClick = (preset: string) => {
    setValue(preset);
    onSave(preset);
    onClose();
  };

  useEffect(() => {
    if (!isActive) return;
    setValue(attendance || "");
  }, [attendance, isActive]);

  return (
    <Popover
      open={isEditing}
      onClose={handleClose}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      sx={{
        '& .MuiPopover-paper': {
          mt: 1,
        },
      }}
    >
      <div className="flex flex-col gap-2 p-1 relative w-24">
        <div className="flex gap-0.5">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
            className="w-17 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 flex-1"
            placeholder="出欠を入力"
          />
          <IconButton
            onClick={() => {
              onDelete();
              onClose();
            }}
            color="error"
          >
            <Iconify icon="solar:trash-bin-minimalistic-2-bold" />
          </IconButton>
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-[150px] overflow-y-auto">
          {Object.entries(attendanceStatuses).map(([key, status]) => (
            <button
              key={key}
              onClick={() => {
                if (status.isDelete) {
                  onDelete();
                  onClose();
                } else {
                  handlePresetClick(key);
                }
              }}
              className={`${status.style} px-2 py-1 rounded text-xs font-bold hover:opacity-80 text-center cursor-pointer`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </Popover>
  );
};
