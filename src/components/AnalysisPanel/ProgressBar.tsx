import React, { useRef } from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, onStepChange }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = e instanceof MouseEvent ? e.clientX : (e as any).clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newStep = Math.floor(percent * (totalSteps - 1));
    onStepChange(newStep);
  };

  React.useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleProgressDrag(e);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, totalSteps]);

  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar"
        ref={progressBarRef}
        onClick={(e) => handleProgressDrag(e)}
        onMouseDown={() => setIsDragging(true)}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`
          }}
        />
        <div
          className="progress-bar-thumb"
          style={{
            left: `${((currentStep + 1) / totalSteps) * 100}%`
          }}
          onMouseDown={() => setIsDragging(true)}
        />
      </div>
      <div className="step-counter">
        {currentStep + 1} / {totalSteps}
      </div>
    </div>
  );
};

export default ProgressBar;
