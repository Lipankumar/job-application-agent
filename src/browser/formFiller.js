function normalize(text = "") {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function getFieldText(field) {
    return normalize(
        [
            field.getAttribute("name"),
            field.getAttribute("id"),
            field.getAttribute("placeholder"),
            field.getAttribute("aria-label")
        ]
            .filter(Boolean)
            .join(" ")
    );
}

async function fillForm(page, candidate) {

    const result = await page.evaluate((candidate) => {

        function normalize(text = "") {
            return String(text)
                .toLowerCase()
                .trim()
                .replace(/\s+/g, " ");
        }

        function getFieldText(field) {
            return normalize(
                [
                    field.getAttribute("name"),
                    field.getAttribute("id"),
                    field.getAttribute("placeholder"),
                    field.getAttribute("aria-label")
                ]
                    .filter(Boolean)
                    .join(" ")
            );
        }

        function findValue(field) {

            const text = getFieldText(field);

            console.log(
                "Checking:",
                text,
                "| currentCompany:",
                candidate.experience?.currentCompany
            );

            // NAME
            if (
                text.includes("full name") ||
                text.includes("fullname") ||
                text === "name" ||
                text.includes("candidate name")
            ) {
                return candidate.name;
            }

            // EMAIL
            if (
                text.includes("email") ||
                text.includes("e-mail")
            ) {
                return candidate.email;
            }

            // PHONE
            if (
                text.includes("phone") ||
                text.includes("mobile") ||
                text.includes("contact number")
            ) {
                return candidate.phone;
            }

            // LOCATION
            if (
                text.includes("location") ||
                text.includes("city")
            ) {
                return candidate.location;
            }

            // EXPERIENCE
            if (
                text.includes("experience") ||
                text.includes("years of experience")
            ) {
                return candidate.experience?.years;
            }

            // CURRENT COMPANY
            if (
                text.includes("current company") ||
                text.includes("currentcompany") ||
                text.includes("company name") ||
                text.includes("current employer") ||
                text.includes("employer")
            ) {
                return candidate.experience?.currentCompany;
            }

            return null;
        }

        /*
         * Find an experience option that contains
         * the candidate's years of experience.
         *
         * Examples:
         *
         * candidate = 3.8
         *
         * "1-3 Years"  -> false
         * "3-5 Years"  -> true
         */
        function findExperienceOption(select, years) {

            if (typeof years !== "number") {
                return null;
            }

            const options = [...select.options];

            for (const option of options) {

                const text = normalize(option.textContent);

                /*
                 * Match ranges such as:
                 *
                 * 0-1 years
                 * 1-3 years
                 * 3-5 years
                 * 5-7 years
                 */
                const rangeMatch = text.match(
                    /(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/
                );

                if (rangeMatch) {

                    const min = Number(rangeMatch[1]);
                    const max = Number(rangeMatch[2]);

                    if (years >= min && years <= max) {
                        return option;
                    }
                }

                /*
                 * Match options such as:
                 *
                 * "3 years"
                 * "4 years"
                 */
                const singleMatch = text.match(
                    /(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/
                );

                if (singleMatch) {

                    const optionYears = Number(singleMatch[1]);

                    if (Math.round(years) === optionYears) {
                        return option;
                    }
                }
            }

            return null;
        }

        const fields = document.querySelectorAll(
            "input, textarea, select"
        );

        const filled = [];

        fields.forEach(field => {

            const fieldText = getFieldText(field);

            const value = findValue(field);

            console.log(
                "FIELD:",
                fieldText,
                "| VALUE:",
                value
            );

            if (value === null || value === undefined) {
                return;
            }

            /*
             * SELECT
             */
            if (field.tagName === "SELECT") {

                let option = null;

                /*
                 * EXPERIENCE SELECT
                 */
                if (
                    fieldText.includes("experience") &&
                    typeof value === "number"
                ) {
                    option = findExperienceOption(
                        field,
                        value
                    );
                }

                /*
                 * NORMAL SELECT
                 */
                if (!option) {

                    option = [...field.options].find(
                        option =>
                            normalize(option.textContent) ===
                            normalize(String(value))
                    );
                }

                /*
                 * Partial text match fallback
                 */
                if (!option) {

                    option = [...field.options].find(
                        option =>
                            normalize(option.textContent).includes(
                                normalize(String(value))
                            )
                    );
                }

                if (option) {

                    field.value = option.value;

                    field.dispatchEvent(
                        new Event("input", {
                            bubbles: true
                        })
                    );

                    field.dispatchEvent(
                        new Event("change", {
                            bubbles: true
                        })
                    );

                    filled.push({
                        field: fieldText,
                        value: option.textContent.trim()
                    });

                    console.log(
                        "SELECTED:",
                        option.textContent.trim()
                    );
                }

                return;
            }

            /*
             * INPUT / TEXTAREA
             */
            field.focus();

            field.value = String(value);

            field.dispatchEvent(
                new Event("input", {
                    bubbles: true
                })
            );

            field.dispatchEvent(
                new Event("change", {
                    bubbles: true
                })
            );

            filled.push({
                field: fieldText,
                value: String(value)
            });

        });

        return filled;

    }, candidate);

    console.log("\nAutofilled fields:");

    result.forEach(item => {

        console.log(
            `${item.field} → ${item.value}`
        );

    });

    return result;
}

module.exports = {
    fillForm
};