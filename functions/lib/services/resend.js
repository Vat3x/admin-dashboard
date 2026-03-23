"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResend = getResend;
const resend_1 = require("resend");
// Lazy-initialize Resend client (only when actually called)
let _resend = null;
function getResend() {
    if (_resend)
        return _resend;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY must be set");
    }
    _resend = new resend_1.Resend(apiKey);
    return _resend;
}
//# sourceMappingURL=resend.js.map