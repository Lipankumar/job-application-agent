function normalize(value = "") {
    return String(value).toLowerCase().trim().replace(/\s+/g, " ");
}

function candidateValue(field, candidate) {
    const text = normalize([
        field.label,
        field.name,
        field.id,
        field.placeholder,
        field.ariaLabel,
        field.autocomplete
    ].filter(Boolean).join(" "));

    if (/e-?mail/.test(text)) return candidate.email;
    if (/phone|mobile|telephone|contact number/.test(text)) return candidate.phone;

    if (/first[\s_-]*name|given[\s_-]*name/.test(text)) {
        return candidate.name?.trim().split(/\s+/)[0];
    }
    if (/last[\s_-]*name|family[\s_-]*name|surname/.test(text)) {
        return candidate.name?.trim().split(/\s+/).slice(1).join(" ");
    }
    if (
        /full[\s_-]*name|candidate[\s_-]*name|applicant[\s_-]*name/.test(text) ||
        /(?:^|\s)name(?:\s|$)/.test(normalize(field.name)) ||
        field.autocomplete === "name"
    ) {
        return candidate.name;
    }

    if (/current company|current employer|present employer/.test(text)) {
        return candidate.experience?.currentCompany;
    }
    if (/years? of experience|total experience|experience in years/.test(text)) {
        return candidate.experience?.years;
    }
    if (/current (job )?title|current role/.test(text)) {
        return candidate.experience?.currentRole || candidate.experience?.level;
    }
    if (/location|city/.test(text)) {
        return candidate.location || candidate.preferredLocations?.[0];
    }
    if (/notice period/.test(text)) {
        return candidate.noticePeriod?.days;
    }

    return undefined;
}

function matchingOption(field, value) {
    const expected = normalize(value);

    if (/experience|notice period/.test(normalize(field.description)) && typeof value === "number") {
        for (const option of field.options || []) {
            const range = option.text.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
            if (range && value >= Number(range[1]) && value <= Number(range[2])) {
                return option;
            }

            const single = option.text.match(/(\d+(?:\.\d+)?)/);
            if (single && Math.round(value) === Number(single[1])) {
                return option;
            }
        }
    }

    return (field.options || []).find(option => normalize(option.text) === expected) ||
        (field.options || []).find(option => normalize(option.text).includes(expected));
}

function isBengaluruRelocationQuestion(field, candidate) {
    const question = normalize(`${field.context || ""} ${field.label || ""} ${field.description || ""}`);
    const prefersBengaluru = (candidate.preferredLocations || []).some(location =>
        /bengaluru|bangalore/i.test(location)
    );

    return prefersBengaluru &&
        /bengaluru|bangalore/.test(question) &&
        /resid|relocat|willing to move/.test(question);
}

async function fillForm(page, candidate) {
    const selector = "input, textarea, select, [contenteditable='true']";
    const fields = await page.locator(selector).evaluateAll(elements =>
        elements.map((element, index) => {
            const labels = element.labels
                ? Array.from(element.labels, label => label.innerText)
                : [];
            const labelledBy = (element.getAttribute("aria-labelledby") || "")
                .split(/\s+/)
                .map(id => document.getElementById(id)?.innerText || "");

            return {
                index,
                tag: element.tagName.toLowerCase(),
                type: element.getAttribute("type") || "",
                checked: Boolean(element.checked),
                groupHasChecked: (() => {
                    const group = element.closest("fieldset, [role='group'], [role='radiogroup']") || element.form;
                    return group
                        ? Boolean(group.querySelector("input[type='radio']:checked"))
                        : Boolean(element.checked);
                })(),
                name: element.getAttribute("name") || "",
                id: element.id || "",
                label: [...labels, ...labelledBy].join(" "),
                placeholder: element.getAttribute("placeholder") || "",
                ariaLabel: element.getAttribute("aria-label") || "",
                autocomplete: element.getAttribute("autocomplete") || "",
                context: element.closest("fieldset, [role='group'], [role='radiogroup']")?.innerText ||
                    element.parentElement?.parentElement?.innerText || "",
                description: [
                    ...labels,
                    ...labelledBy,
                    element.getAttribute("name") || "",
                    element.id || "",
                    element.getAttribute("placeholder") || "",
                    element.getAttribute("aria-label") || ""
                ].join(" "),
                visible: Boolean(element.getClientRects().length),
                disabled: element.disabled || element.getAttribute("aria-disabled") === "true",
                readOnly: Boolean(element.readOnly),
                value: element.isContentEditable ? element.innerText : element.value || "",
                options: element.tagName === "SELECT"
                    ? Array.from(element.options, option => ({
                        text: option.textContent.trim(),
                        value: option.value
                    }))
                    : []
            };
        })
    );

    const filled = [];

    for (const field of fields) {
        if (field.type === "radio" && isBengaluruRelocationQuestion(field, candidate)) {
            if (field.groupHasChecked) continue;

            const optionText = normalize(`${field.label} ${field.value}`);
            if (/\byes\b|\bwilling\b|\brelocate\b/.test(optionText)) {
                try {
                    await page.locator(selector).nth(field.index).check();
                    filled.push({ field: field.context || field.label, value: "Yes" });
                } catch (error) {
                    console.log(`⚠️ Could not answer relocation question: ${error.message}`);
                }
            }
            continue;
        }

        if (
            !field.visible || field.disabled || field.readOnly || field.value ||
            ["hidden", "file", "checkbox", "radio", "submit", "button", "password"].includes(field.type)
        ) continue;

        const value = candidateValue(field, candidate);
        if (value === undefined || value === null || value === "") continue;

        const locator = page.locator(selector).nth(field.index);

        try {
            if (field.tag === "select") {
                const option = matchingOption(field, value);
                if (!option || !option.value) continue;
                await locator.selectOption(option.value);
                filled.push({ field: field.description, value: option.text });
            } else if (field.tag === "input" && ["number", "tel"].includes(field.type)) {
                await locator.fill(String(value));
                filled.push({ field: field.description, value: "[profile value]" });
            } else if (field.tag === "input" && ["date", "datetime-local"].includes(field.type)) {
                continue;
            } else {
                await locator.fill(String(value));
                filled.push({ field: field.description, value: "[profile value]" });
            }
        } catch (error) {
            console.log(`⚠️ Could not fill "${field.description}": ${error.message}`);
        }
    }

    console.log(`Autofilled ${filled.length} field(s):`);
    filled.forEach(item => console.log(`  ${item.field} → ${item.value}`));
    return filled;
}

module.exports = { fillForm };
