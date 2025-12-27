import React from 'react';

export const Logo = ({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        fill="none"
        className={className}
        {...props}
    >
        <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" /> {/* Orange-500 */}
                <stop offset="100%" stopColor="#EA580C" /> {/* Orange-600 */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        {/* Outer Ring Segment */}
        <path
            d="M50 10 A 40 40 0 0 1 90 50"
            stroke="url(#logo-gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            className="opacity-80"
        />

        {/* Inner Hub Shape - Stylized S */}
        <path
            d="M35 35 H 65 A 10 10 0 0 1 65 55 A 10 10 0 0 0 35 55 A 10 10 0 0 1 35 75 H 65"
            stroke="url(#logo-gradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
        />

        {/* Connection Dot */}
        <circle cx="65" cy="25" r="5" fill="#F97316" />
    </svg>
);
