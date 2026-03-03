import type { ButtonProps } from '@mui/material/Button';

// 出欠状態
export const attendanceStatuses = ['出席', '欠席', '遅刻', '早退', '講習', '無欠', '出停'];

export const attendanceStatusColor: Record<string, ButtonProps> = {
  '出席': { color: 'success' },
  '欠席': { color: 'error' },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  '遅刻': { color: 'orange' },
  '早退': { color: 'warning' },
  '講習': { color: 'info' },
  '無欠': {
    color: "primary",
    sx: {
      backgroundImage:
        'linear-gradient(-45deg, black 25%, #87741e 25%, #87741e 50%, black 50%, black 75%, #87741e 75%, #87741e)',
      backgroundSize: '60px 60px',
    },
  },
  '出停': { color: "inherit" },
};

export const defaultColor: ButtonProps = {
  color: 'inherit',
  sx: { fontSize: '1.5rem', py: 1.3, height: 64 },
};

export const getStatusButtonProps = (
  status: string,
  variant: ButtonProps['variant'],
): ButtonProps => {
  const base = attendanceStatusColor[status] || defaultColor;
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
