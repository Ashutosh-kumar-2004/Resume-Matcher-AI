import { useEffect, useMemo, useState } from "react";
import apiClient from "../../services/apiClient";
import PopUpModal from "../popUpModal/PopUpModal";
import { useModal } from "../../hooks/popUps/useModal";

const AUTH_STORAGE_KEY = "auth_user_resume_matcher_ai";

const ProfilePage = () => {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contactNumber: "",
    bio: "",
  });

  const { modal, showSuccess, showError, closeModal } = useModal();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await apiClient.get("/profile");
        const user = response.data?.user || {};

        if (!isMounted) {
          return;
        }

        setProfile({
          name: user.name || "",
          email: user.email || "",
          contactNumber: user.contactNumber || "",
          bio: user.bio || "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showError(error?.response?.data?.message || "Failed to load profile");
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [showError]);

  const bioCount = useMemo(() => profile.bio.length, [profile.bio]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (savingProfile) {
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        name: profile.name,
        contactNumber: profile.contactNumber,
        bio: profile.bio,
      };

      const response = await apiClient.put("/profile/update", payload);
      const updated = response.data?.user || {};

      setProfile((prev) => ({
        ...prev,
        name: updated.name || prev.name,
        contactNumber: updated.contactNumber || "",
        bio: updated.bio || "",
      }));

      const cached = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        sessionStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            ...parsed,
            name: updated.name || parsed.name,
          })
        );
        window.dispatchEvent(new Event("auth-changed"));
      }

      showSuccess(response.data?.message || "Profile updated successfully");
    } catch (error) {
      showError(error?.response?.data?.message || "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-white/65">
          Update your profile details used across the app.
        </p>

        {loadingProfile ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/85">Name</span>
              <input
                type="text"
                value={profile.name}
                onChange={handleChange("name")}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/85">Email</span>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-600 dark:border-white/10 dark:bg-white/10 dark:text-white/60"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/85">Contact Number</span>
              <input
                type="text"
                value={profile.contactNumber}
                onChange={handleChange("contactNumber")}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
                placeholder="Optional"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-white/85">Bio</span>
              <textarea
                value={profile.bio}
                onChange={handleChange("bio")}
                rows={4}
                maxLength={500}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
                placeholder="Tell us about your goals"
              />
              <p className="mt-1 text-right text-xs text-gray-500 dark:text-white/50">{bioCount}/500</p>
            </label>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center rounded-xl bg-linear-to-r from-purple-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-blue-600 disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
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

export default ProfilePage;
