import { useCallback, useRef, useState } from "react";
import { useModal } from "../popUps/useModal";
import apiClient from "../../services/apiClient";

const AUTH_STORAGE_KEY = "auth_user";

export const useSignUp = () => {
	const [loading, setLoading] = useState(false);
	const [authUser, setAuthUser] = useState(() => {
		const cached = sessionStorage.getItem(AUTH_STORAGE_KEY);
		return cached ? JSON.parse(cached) : null;
	});
	const tokenRef = useRef(null);

	const { modal, showSuccess, showError, closeModal } = useModal();

	const signUp = useCallback(
		async ({ name, email, password, passwordConfirm }) => {
			if (loading) {
				return { success: false };
			}

			try {
				setLoading(true);

				const { data } = await apiClient.post("/auth/signup", {
					name,
					email,
					password,
					passwordConfirm,
				});

				tokenRef.current = data?.token || null;
				setAuthUser(data?.user || null);
				sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data?.user || null));
				window.dispatchEvent(new Event("auth-changed"));
				showSuccess(data?.message || "Account created successfully");

				return {
					success: true,
					user: data?.user || null,
				};
			} catch (error) {
				const message =
					error?.response?.data?.message ||
					"Unable to create account. Please try again.";
				showError(message);

				return {
					success: false,
					error: message,
				};
			} finally {
				setLoading(false);
			}
		},
		[loading, showError, showSuccess],
	);

	return {
		authUser,
		loading,
		signUp,
		tokenRef,
		modal,
		closeModal,
	};
};

