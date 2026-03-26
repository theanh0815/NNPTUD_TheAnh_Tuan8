const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "7e0ae75ce2465e",
        pass: "4b40beb4dadfc5",
    },
});
module.exports = {
    sendMail: async function (to,url) {
        const info = await transporter.sendMail({
            from: 'hehehe@gmail.com',
            to: to,
            subject: "reset password URL",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href="+url+">day</a> de doi pass", // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
    },
    sendPasswordMail: async function (to, password) {
        if (!transporter.options.auth.user) {
            console.log(`============= MOCK EMAIL =============\nTo: ${to}\nPassword: ${password}\n======================================`);
            return;
        }
        try {
            const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <img src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=600" alt="Welcome Image" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 20px; text-align: center; color: #333;">
                    <h2 style="color: #4CAF50;">Welcome Aboard!</h2>
                    <p>Your account has been successfully imported and created.</p>
                    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50; font-size: 18px;">
                        Your temporary password is:<br>
                        <strong><span style="font-size: 24px; color: #000; letter-spacing: 2px;">${password}</span></strong>
                    </div>
                    <p style="font-size: 14px; color: #777;">Please log in and change this password immediately to secure your account.</p>
                </div>
            </div>`;

            const info = await transporter.sendMail({
                from: '"Admin System" <hehehe@gmail.com>',
                to: to,
                subject: "✨ Welcome! Here is your new Account Password",
                text: "Your account has been created. Your password is: " + password, // Plain-text version of the message
                html: htmlContent, // HTML version of the message
            });

            console.log("Password email sent:", info.messageId);
        } catch (error) {
            console.error("Email sending failed:", error.message);
        }
    }
}
