import type { ButtonProps } from '@mui/material/Button';

// 事前確認の出欠状態
export const preCheckAttendanceStatuses = ['出席', '欠席', '遅刻', '早退', '講習'];

export const preCheckAttendanceStatusColor: Record<string, ButtonProps> = {
  '出席': { color: 'success', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  '欠席': { color: 'error', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  '遅刻': { color: 'orange', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  '早退': { color: 'warning', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
  '講習': { color: 'info', sx: { fontSize: '1.5rem', py: 1.3, height: 64 } },
};

export const preCheckDefaultColor: ButtonProps = {
  color: 'inherit',
  sx: { fontSize: '1.5rem', py: 1.3, height: 64 },
};

export const getPreCheckStatusButtonProps = (
  status: string,
  variant: ButtonProps['variant'],
): ButtonProps => {
  const base = preCheckAttendanceStatusColor[status] || preCheckDefaultColor;
  const { sx, ...rest } = base;
  return {
    ...rest,
    variant,
    sx: {
      ...(sx || {}),
      color: '#fff',
      ...(variant === 'contained' ? { height: 'auto', fontSize: '0.95rem', py: 1.0 } : null),
    },
  };
};
