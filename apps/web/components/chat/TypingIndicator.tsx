export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[70%] sm:max-w-[60%]">
        <div className="px-4 py-3 rounded-2xl bg-base-200 text-base-content rounded-bl-sm">
          <div className="flex items-center gap-1">
            <div className="flex gap-1 ml-2">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 