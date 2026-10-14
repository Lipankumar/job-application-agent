function getIndeedAccessIssue(url, pageText = "") {
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return null;
    }

    if (!/(^|\.)indeed\.com$/i.test(parsedUrl.hostname)) {
        return null;
    }

    const text = String(pageText).toLowerCase();
    const isAuthBotRedirect = parsedUrl.pathname.startsWith("/auth") &&
        (parsedUrl.searchParams.get("from") === "bot-detection-anonymous" ||
            /http error\s*400|400\s+bad request/.test(text));

    if (isAuthBotRedirect) {
        return "Indeed redirected to an authentication endpoint and returned HTTP 400/bot detection.";
    }

    const isVerificationChallenge = /additional verification required|verify you are human|checking your browser|security verification|complete the security check|cf-challenge/.test(text) ||
        (/cloudflare/.test(text) && /ray id|attention required|verification/.test(text));

    if (isVerificationChallenge) {
        const rayId = pageText.match(/Ray ID(?:\s+for this request)?\s*(?:is|[:：])\s*([a-f0-9]{8,})/i)?.[1];
        return `Indeed presented an additional verification/security challenge${rayId ? ` (Ray ID: ${rayId})` : ""}. Complete verification manually in a normal browser session, then retry; automated access cannot continue on this page.`;
    }

    return null;
}

module.exports = { getIndeedAccessIssue };