function normalizePostedAt(value) {
    if (!value) {
        return null;
    }

    // Already a valid date/timestamp
    const directDate = new Date(value);

    if (!Number.isNaN(directDate.getTime())) {
        return directDate.toISOString();
    }

    const text = String(value)
        .toLowerCase()
        .trim();

    const now = Date.now();

    // "just now"
    if (
        text.includes("just now") ||
        text.includes("moments ago")
    ) {
        return new Date(now).toISOString();
    }

    // "2 hours ago"
    const hoursMatch = text.match(
        /(\d+(?:\.\d+)?)\s*hours?\s*ago/
    );

    if (hoursMatch) {
        const hours = Number(hoursMatch[1]);

        return new Date(
            now - hours * 60 * 60 * 1000
        ).toISOString();
    }

    // "30 minutes ago"
    const minutesMatch = text.match(
        /(\d+)\s*minutes?\s*ago/
    );

    if (minutesMatch) {
        const minutes = Number(minutesMatch[1]);

        return new Date(
            now - minutes * 60 * 1000
        ).toISOString();
    }

    // "1 day ago"
    const daysMatch = text.match(
        /(\d+)\s*days?\s*ago/
    );

    if (daysMatch) {
        const days = Number(daysMatch[1]);

        return new Date(
            now - days * 24 * 60 * 60 * 1000
        ).toISOString();
    }

    return null;
}

module.exports = normalizePostedAt;