async function detectForm(page) {
    const formInfo = await page.evaluate(() => {
        const inputs = Array.from(
            document.querySelectorAll(
                "input, textarea, select, button"
            )
        );

        return inputs.map((element, index) => {
            const tag = element.tagName.toLowerCase();

                const labels = element.labels
                    ? Array.from(element.labels, label => label.innerText)
                    : [];
                const labelledBy = (element.getAttribute("aria-labelledby") || "")
                    .split(/\s+/)
                    .map(id => document.getElementById(id)?.innerText || "");

                return {
                index,
                tag,
                type: element.getAttribute("type"),
                name: element.getAttribute("name"),
                id: element.getAttribute("id"),
                    label: [...labels, ...labelledBy].join(" "),
                placeholder: element.getAttribute("placeholder"),
                ariaLabel: element.getAttribute("aria-label"),
                    autocomplete: element.getAttribute("autocomplete"),
                value: element.getAttribute("value"),
                text: element.innerText,
                    required: element.hasAttribute("required"),
                    visible: Boolean(element.getClientRects().length)
            };
        });
    });

    return formInfo;
}

module.exports = {
    detectForm
};
