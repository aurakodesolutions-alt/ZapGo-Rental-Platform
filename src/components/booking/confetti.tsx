"use client";

import React, { useEffect, useState } from 'react';

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className="absolute w-2 h-4" style={style}></div>
);

export const Confetti: React.FC = () => {
    const [pieces, setPieces] = useState<React.ReactElement[]>([]);

    useEffect(() => {
        const confettiCount = 100;
        const newPieces = Array.from({ length: confettiCount }).map((_, index) => {
            const style: React.CSSProperties = {
                left: `${Math.random() * 100}%`,
                animation: `confetti-fall ${3 + Math.random() * 2}s ${Math.random() * 5}s linear infinite`,
                backgroundColor: ['#80C42F', '#143863', '#659F37', '#F7FAFC'][Math.floor(Math.random() * 4)],
                transform: `rotate(${Math.random() * 360}deg)`,
            };
            return <ConfettiPiece key={index} style={style} />;
        });
        setPieces(newPieces);
    }, []);

    return <div className="fixed inset-0 w-full h-full pointer-events-none z-[100] overflow-hidden">{pieces}</div>;
};
