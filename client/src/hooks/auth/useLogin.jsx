import { useCallback, useRef, useState } from "react";
import { useModal } from "../popUps/useModal";
import apiClient from "../../services/apiClient";

const AUTH_STORAGE_KEY = "auth_user";

export const useLogin = () => {
	const [loading, setLoading] = useState(false);
	const [authUser, setAuthUser] = useState(() => {
		const cached = sessionStorage.getItem(AUTH_STORAGE_KEY);
		return cached ? JSON.parse(cached) : null;
	});
	const tokenRef = useRef(null);

	const { modal, showSuccess, showError, closeModal } = useModal();

	const login = useCallback(
		async ({ email, password }) => {
			if (loading) {
				return { success: false };
			}

			try {
				setLoading(true);

				const { data } = await apiClient.post("/auth/login", {
					email,
					password,
				});

				tokenRef.current = data?.token || null;
				setAuthUser(data?.user || null);
				sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data?.user || null));
				window.dispatchEvent(new Event("auth-changed"));
				showSuccess(data?.message || "Login successful");

				return {
					success: true,
					user: data?.user || null,
				};
			} catch (error) {
				const message =
					error?.response?.data?.message || "Unable to login. Please try again.";
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

	const logout = useCallback(async () => {
		try {
			await apiClient.post("/auth/logout");
		} finally {
			tokenRef.current = null;
			setAuthUser(null);
			sessionStorage.removeItem(AUTH_STORAGE_KEY);
			window.dispatchEvent(new Event("auth-changed"));
		}
	}, []);

	return {
		authUser,
		loading,
		login,
		logout,
		tokenRef,
		modal,
		closeModal,
	};
};

