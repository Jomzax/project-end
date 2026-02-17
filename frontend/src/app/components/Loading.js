import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function Loading({ fullScreen = false, size = 100 }) {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        fetch('/animations/wave-loading.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error('Failed to load animation:', err));
    }, []);

    if (!animationData) return null;

    const overlayStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        ...(fullScreen && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 9999,
        })
    };

    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size
    };

    return (
        <div style={overlayStyle}>
            <div style={containerStyle}>
                <Lottie
                    animationData={animationData}
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
}
