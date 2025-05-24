// Decodes a JWT token to extract payload information
export function decodeJwt(token) {
    try {
        // JWT tokens are made up of three parts: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid token format');
        }

        // Base64Url decode the payload (second part)
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(
            decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
        );

        return payload;
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
}

// Check if token is expired
export function isTokenExpired(token) {
    const payload = decodeJwt(token);
    if (!payload) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
}
