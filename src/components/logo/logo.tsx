import type { LinkProps } from '@mui/material/Link';

import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  ...other
}: LogoProps) {
  const singleLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlSpace="preserve"
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinejoin: "round",
        strokeMiterlimit: 2,
      }}
    >
      <g transform="matrix(1.1025,0,0,0.811976,-54.1392,-45.7682)">
        <path
          d="M395.105,112.433L96.044,215.559C96.044,155.503 131.868,98.588 176.098,98.588L386.511,98.588C389.414,98.588 392.281,98.798 395.105,99.207L395.105,112.433Z"
          fill="rgb(86,130,237)"
        />
      </g>
      <g transform="matrix(1.1025,0,0,0.811976,-54.1392,-35.0292)">
        <path
          d="M465.664,190.304C466.313,195.874 466.65,201.584 466.65,207.401L466.65,425.026C466.65,485.081 430.741,533.839 386.511,533.839L375.567,533.839L286.146,612.001L303.844,533.839L176.098,533.839C131.868,533.839 95.959,485.081 95.959,425.026L95.959,207.401C95.959,147.345 131.868,98.588 176.098,98.588L386.511,98.588C389.414,98.588 392.281,98.798 395.105,99.207L250.885,381.618L194.781,328.142L167.337,385.883L255.621,456.704L465.664,190.304Z"
          fill="url(#_Linear1)"
        />
      </g>
      <defs>
        <linearGradient
          id="_Linear1"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="userSpaceOnUse"
          gradientTransform="matrix(2.31532e-14,513.413,-385.698,3.20676e-14,245.575,98.5879)"
        >
          <stop offset="0" stopColor="rgb(39,102,255)" stopOpacity="1" />
          <stop offset="1" stopColor="rgb(0,75,255)" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>

  );

  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {singleLogo}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
