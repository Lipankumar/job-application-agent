
function normalize(text = "") {
    return text
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
            return text
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
                candidate.currentCompany
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
                return candidate.experience;
            }

            // CURRENT COMPANY
            if (
                text.includes("current company") ||
                text.includes("currentcompany") ||
                text.includes("company name") ||
                text.includes("current employer") ||
                text.includes("employer")
            ) {
                console.log(">>> CURRENT COMPANY MATCHED");

                return candidate.currentCompany;
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

                const option = [...field.options].find(
                    option =>
                        normalize(option.textContent) ===
                        normalize(String(value))
                );

                if (option) {

                    field.value = option.value;

                    field.dispatchEvent(
                        new Event("change", {
                            bubbles: true
                        })
                    );
                }

            }

            /*
             * INPUT / TEXTAREA
             */
            else {

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
            }

            filled.push({
                field: fieldText,
                value: value
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

