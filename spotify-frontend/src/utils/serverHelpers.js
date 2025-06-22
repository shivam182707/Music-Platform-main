export const makeUnauthenticatedPOSTRequest = async (route, body) => {
    try {
        console.log('Making request to:', backendUrl + route);
        console.log('Request body:', body);
        
        const response = await fetch(backendUrl + route, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            // If the server sends an error message, use it
            if (data && data.error) {
                throw new Error(data.error);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error("API Error:", error);
        return { error: error.message || "Something went wrong" };
    }
}; 