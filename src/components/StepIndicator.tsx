'use client';

import React from 'react';

type Step = 'hero' | 'connect' | 'configure' | 'deploy' | 'dashboard';

interface StepIndicatorProps {
  currentStep: Step;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: 'connect', label: 'Connect' },
    { id: 'configure', label: 'Configure' },
    { id: 'deploy', label: 'Deploy' },
    { id: 'dashboard', label: 'Dashboard' }
  ];

  // Determine which steps are active based on the current step
  const isStepActive = (stepId: string) => {
    if (currentStep === 'hero') return false;
    
    switch (stepId) {
      case 'connect':
        return ['connect', 'configure', 'deploy', 'dashboard'].includes(currentStep);
      case 'configure':
        return ['configure', 'deploy', 'dashboard'].includes(currentStep);
      case 'deploy':
        return ['deploy', 'dashboard'].includes(currentStep);
      case 'dashboard':
        return currentStep === 'dashboard';
      default:
        return false;
    }
  };

  if (currentStep === 'hero') return null;

  return (
    <div className="hidden md:flex items-center space-x-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step circle with number */}
          <div 
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              isStepActive(step.id)
                ? 'bg-purple-500 text-white' 
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {index + 1}
          </div>
          
          {/* Step label */}
          <span className="text-sm font-medium text-white">
            {step.label}
          </span>
          
          {/* Arrow between steps (except after the last step) */}
          {index < steps.length - 1 && (
            <div className="mx-2 text-slate-600">→</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
