interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner = ({ message = '로딩 중...', className = '' }: LoadingSpinnerProps) => {
  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="text-slate-500 dark:text-slate-400">{message}</div>
    </div>
  );
};

