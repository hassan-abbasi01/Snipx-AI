import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to SnipX',
    description: 'This home tour shows how the platform works before you enter the editor.'
  },
  {
    title: 'AI Video Editing',
    description: 'Upload your video and use the editor to trim, enhance audio, and add subtitles.'
  },
  {
    title: 'Smart Processing',
    description: 'The system helps with filler removal, dubbing, thumbnails, and summarization.'
  },
  {
    title: 'Profile & History',
    description: 'Your profile keeps your account data, statistics, and video processing history.'
  },
  {
    title: 'Support & Help',
    description: 'Use support tools if you need guidance or want help with a workflow issue.'
  },
  {
    title: 'Get Started',
    description: 'Now you are ready to explore the app and open the editor when you want to work.'
  },
];

const HomeGuidedTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Always show tour when home loads.
      setIsOpen(true);
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  const closeTour = () => {
    setIsOpen(false);
  };

  const nextStep = () => {
    if (stepIndex >= tourSteps.length - 1) {
      closeTour();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const previousStep = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-purple-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 px-5 py-4 text-white flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/80">First time guide</p>
            <h3 className="text-2xl font-bold mt-1">Home Tour {stepIndex + 1}/{tourSteps.length}</h3>
          </div>
          <button onClick={closeTour} className="text-white/90 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{tourSteps[stepIndex].title}</h4>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">{tourSteps[stepIndex].description}</p>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={closeTour}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={previousStep}
                disabled={stepIndex === 0}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeGuidedTour;