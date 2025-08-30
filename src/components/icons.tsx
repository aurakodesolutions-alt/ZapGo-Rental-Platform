import type { SVGProps } from 'react';

export function ZapGoLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path
                fill="#0066ff"
                d="M2.33316 2L14.3332 2L11.6665 10L-0.333496 10L2.33316 2Z"
            />
            <path
                fill="#3322cc"
                d="M12.3332 12H17.6665L22.9998 12L20.3332 20H8.33316L12.3332 12Z"
            />
        </svg>
    );
}
