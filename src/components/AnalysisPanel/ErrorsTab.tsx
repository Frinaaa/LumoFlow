import React, { useState, useEffect, useRef } from 'react';
import { generateErrorSamples, ErrorSample } from '../../utils/errorDataset';
import './ErrorsTab.css';

const ErrorsTab: React.FC = () => {
    const [errors, setErrors] = useState<ErrorSample[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        // Load data on mount
        setErrors(generateErrorSamples());
    }, []);

    // The Wheel Effect Logic
    const updateWheel = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const nodes = container.querySelectorAll('.error-node-wrapper');
        const containerHeight = container.clientHeight;
        const centerPoint = containerHeight / 2;

        nodes.forEach((node) => {
            const htmlNode = node as HTMLElement;
            const rect = htmlNode.getBoundingClientRect();
            // Get position relative to the container viewport
            const nodeTop = rect.top - container.getBoundingClientRect().top;
            const nodeCenter = nodeTop + (rect.height / 2);

            // Distance from vertical center
            const dist = Math.abs(centerPoint - nodeCenter);

            // Math: Calculate curve
            // Closer to center = X is 0
            // Further from center = X increases (pushes right)
            // Scale factor 1000 controls the "steepness" of the curve
            const translateX = Math.pow(dist, 2) / 1000;

            // Optional: Fade out items at the very top/bottom
            const opacity = Math.max(0.3, 1 - (dist / (containerHeight * 0.6)));

            // Optional: Rotate slightly for 3D feel
            const rotateX = (nodeCenter - centerPoint) / 20;

            htmlNode.style.transform = `translateX(${translateX}px) rotateX(${-rotateX}deg)`;
            htmlNode.style.opacity = opacity.toString();
        });

        requestRef.current = requestAnimationFrame(updateWheel);
    };

    useEffect(() => {
        // Start animation loop when component mounts
        requestRef.current = requestAnimationFrame(updateWheel);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [errors]); // Re-bind if data changes

    return (
        <div className="errors-wheel-container" ref={containerRef}>
            <div className="wheel-axis"></div>

            {errors.map((item) => (
                <div
                    key={item.id}
                    className="error-node-wrapper"
                    style={{ '--node-color': item.color } as any}
                >
                    <div className="node-number">{item.id}</div>
                    <div className="node-connector"></div>

                    <div className="error-content-card">
                        <span className="error-title">{item.title}</span>
                        <div className="error-desc">{item.explanation}</div>

                        <div className="error-example-box">
                            <code>{item.example}</code>
                        </div>

                        <div className="error-fix-box">
                            <i className="fa-solid fa-wrench"></i>
                            {item.fix}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ErrorsTab;