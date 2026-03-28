import { useState, useCallback } from "react";

export const useModal = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    type: "success", // 'success' or 'error'
    message: "",
  });

  const showModal = useCallback((message, type = "success") => {
    setModal({
      isOpen: true,
      type,
      message,
    });
  }, []);

  const showSuccess = useCallback(
    (message) => {
      showModal(message, "success");
    },
    [showModal],
  );

  const showError = useCallback(
    (message) => {
      showModal(message, "error");
    },
    [showModal],
  );

  const closeModal = useCallback(() => {
    setModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    modal,
    showModal,
    showSuccess,
    showError,
    closeModal,
  };
};
