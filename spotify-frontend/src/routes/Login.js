const login = async () => {
    try {
        setError(""); // Clear any previous errors
        setIsLoading(true);
        
        // Basic validation
        if (!email || !password) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        // Trim whitespace from email
        const trimmedEmail = email.trim();
        
        const data = { 
            email: trimmedEmail, 
            password: password 
        };
        
        console.log("Attempting login with:", { email: trimmedEmail });
        
        const response = await makeUnauthenticatedPOSTRequest(
            "/auth/login",
            data
        );

        console.log('Login response:', response);

        if (response.error) {
            setError(response.error);
            setIsLoading(false);
            return;
        }

        if (response && response.token) {
            const token = response.token;
            const date = new Date();
            date.setDate(date.getDate() + 30);
            setCookie("token", token, {
                path: "/",
                expires: date,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production"
            });
            navigate("/home");
        } else {
            console.error('Invalid response structure:', response);
            setError("Server response missing token. Please try again.");
        }
    } catch (error) {
        console.error("Login error:", error);
        setError(error.message || "Login failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
}; 