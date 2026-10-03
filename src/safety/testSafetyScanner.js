const { scanForm } = require("./safetyScanner");

const fields = [
    {
        name: "full_name",
        id: "full-name",
        placeholder: "Full Name",
        type: "text",
        label: "Full Name"
    },
    {
        name: "email",
        id: "email",
        placeholder: "Email",
        type: "email",
        label: "Email"
    },
    {
        name: "captcha",
        id: "captcha",
        placeholder: "",
        type: "text",
        label: "Verify you are human"
    }
];

const result = scanForm(fields);

console.log(JSON.stringify(result, null, 2));