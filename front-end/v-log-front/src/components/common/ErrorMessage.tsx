interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage = ({ message, onRetry, className = '' }: ErrorMessageProps) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-4 ${className}`}>
      <div className="text-red-500 dark:text-red-400">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-slate-900 rounded-lg hover:bg-primary/90 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
};

