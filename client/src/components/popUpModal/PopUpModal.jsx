import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";

const AUTO_CLOSE_MS = 4000;

const PopUpModal = ({ isOpen, type = "success", message, onClose }) => {
  // Auto-close notification.
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, AUTO_CLOSE_MS);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === "success";
  const bgColor = isSuccess
    ? "bg-green-950/70"
    : "bg-linear-to-br from-red-900/95 to-red-800/90";

  const borderColor = isSuccess
    ? "border-green-700"
    : "border-red-500";

  const textColor = isSuccess
    ? "text-green-200"
    : "text-red-50";

  const iconColor = isSuccess
    ? "text-green-400"
    : "text-red-200";
  const closeButtonHover = isSuccess
    ? "hover:bg-green-800"
    : "hover:bg-red-700/60";

  return (
    <div className="fixed top-5 right-4 z-50 w-[calc(100vw-2rem)] max-w-md animate-slideInRight">
      <div
        className={`
          flex items-start gap-3 px-5 py-4 rounded-xl border 
          ${bgColor} ${borderColor} ${textColor} 
          shadow-[0_14px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-sm w-full
          transition-all duration-300 ease-out overflow-hidden
        `}
      >
        {/* Icon */}
        <div className={`shrink-0 mt-0.5 ${iconColor}`}>
          {isSuccess ? (
            <AiOutlineCheckCircle size={24} />
          ) : (
            <AiOutlineCloseCircle size={24} />
          )}
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="font-medium text-sm">{message}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`
            shrink-0 p-1 rounded-md transition-colors 
            ${closeButtonHover} focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-offset-gray-900
            ${isSuccess ? "focus:ring-green-500" : "focus:ring-red-500"}
          `}
          aria-label="Close notification"
        >
          <MdClose size={20} />
        </button>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.35s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PopUpModal;
