async function detectForm(page) {
    const formInfo = await page.evaluate(() => {
        const inputs = Array.from(
            document.querySelectorAll(
                "input, textarea, select, button"
            )
        );

        return inputs.map((element, index) => {
            const tag = element.tagName.toLowerCase();

            return {
                index,
                tag,
                type: element.getAttribute("type"),
                name: element.getAttribute("name"),
                id: element.getAttribute("id"),
                placeholder: element.getAttribute("placeholder"),
                ariaLabel: element.getAttribute("aria-label"),
                value: element.getAttribute("value"),
                text: element.innerText,
                required: element.hasAttribute("required")
            };
        });
    });

    return formInfo;
}

module.exports = {
    detectForm
};