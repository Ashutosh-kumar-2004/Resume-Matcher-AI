import { useState } from "react";
import apiClient from "../../services/apiClient";
import PopUpModal from "../popUpModal/PopUpModal";
import { useModal } from "../../hooks/popUps/useModal";

const initialPasswordState = {
  currentPassword: "",
  newPassword: "",
  passwordConfirm: "",
};

const SettingsPage = () => {
  const [form, setForm] = useState(initialPasswordState);
  const [changingPassword, setChangingPassword] = useState(false);
  const { modal, showSuccess, showError, closeModal } = useModal();

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (changingPassword) {
      return;
    }

    if (form.newPassword !== form.passwordConfirm) {
      showError("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      const response = await apiClient.post("/password/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        passwordConfirm: form.passwordConfirm,
      });

      setForm(initialPasswordState);
      showSuccess(response.data?.message || "Password changed successfully");
    } catch (error) {
      showError(error?.response?.data?.message || "Unable to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/65">
          Change your password securely.
        </p>

        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/85">Current Password</span>
            <input
              type="password"
              value={form.currentPassword}
              onChange={handleChange("currentPassword")}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/85">New Password</span>
            <input
              type="password"
              value={form.newPassword}
              onChange={handleChange("newPassword")}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
              required
              minLength={6}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/85">Confirm New Password</span>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={handleChange("passwordConfirm")}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
              required
              minLength={6}
            />
          </label>

          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex items-center rounded-xl bg-linear-to-r from-purple-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-blue-600 disabled:opacity-60"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      <PopUpModal
        isOpen={modal.isOpen}
        type={modal.type}
        message={modal.message}
        onClose={closeModal}
      />
    </section>
  );
};

export default SettingsPage;
