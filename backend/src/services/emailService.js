import { Resend } from 'resend';

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new Resend(apiKey);
};

const escapeHtml = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Sends a notification email when a new quotation is submitted.
 * Uses Resend API — no SMTP required.
 *
 * @param {Object} quotationData - The quotation document object
 */
export const sendQuotationEmail = async (quotationData) => {
    try {
        const resend = getResendClient();

        if (!resend) {
            console.warn('[EmailService] RESEND_API_KEY not set in environment. Skipping email dispatch. Quotation is saved in MongoDB.');
            return { success: false, reason: 'RESEND_API_KEY not configured' };
        }

        const receiver = process.env.QUOTE_RECEIVER_EMAIL || 'freelancehq@gmail.com';
        const senderDomain = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        const safeFullName = escapeHtml(quotationData.fullName);
        const safeCompanyName = escapeHtml(quotationData.companyName);
        const safeEmail = escapeHtml(quotationData.email);
        const safePhone = escapeHtml(quotationData.phone);
        const safeProjectName = escapeHtml(quotationData.projectName);
        const safeDescription = escapeHtml(quotationData.description);
        const safeWebsiteUrl = escapeHtml(quotationData.websiteUrl);
        const safeOtherService = escapeHtml(quotationData.otherService);
        const safeAdditionalInfo = escapeHtml(quotationData.additionalInformation);
        const safeBudget = escapeHtml(quotationData.budget);
        const safeTimeline = escapeHtml(quotationData.timeline);
        const safeServices = (quotationData.services || []).map(escapeHtml).join(', ');
        const safeContactPreference = (quotationData.contactPreference || []).map(escapeHtml).join(', ');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; background: #0a0a0a; color: #e0e0e0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 30px 20px; }
            .header { background: linear-gradient(135deg, #0d0d0d, #1a1a2e); border: 1px solid #00e5ff33; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .header h1 { color: #00e5ff; font-size: 22px; margin: 0 0 5px 0; letter-spacing: 2px; }
            .header p { color: #888; font-size: 13px; margin: 0; }
            .badge { display: inline-block; background: #00e5ff20; border: 1px solid #00e5ff55; color: #00e5ff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
            .section { background: #111; border: 1px solid #222; border-radius: 6px; padding: 15px; margin-bottom: 15px; }
            .section h3 { color: #00e5ff; font-size: 13px; letter-spacing: 1px; margin: 0 0 12px 0; text-transform: uppercase; }
            .row { display: flex; margin-bottom: 8px; }
            .label { color: #888; font-size: 13px; min-width: 160px; }
            .value { color: #fff; font-size: 13px; flex: 1; }
            .desc-block { background: #0d0d0d; border-left: 3px solid #00e5ff; padding: 10px 15px; border-radius: 4px; margin-top: 8px; color: #ccc; font-size: 13px; line-height: 1.6; }
            .footer { text-align: center; color: #444; font-size: 11px; margin-top: 25px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Z E R 0 O N E</h1>
              <p>New Project Enquiry Received</p>
            </div>

            <span class="badge">REQUEST ID: ${escapeHtml(quotationData.requestId)}</span>

            <div class="section">
              <h3>Client Details</h3>
              <div class="row"><span class="label">Full Name</span><span class="value">${safeFullName}</span></div>
              <div class="row"><span class="label">Company</span><span class="value">${safeCompanyName || 'N/A'}</span></div>
              <div class="row"><span class="label">Email</span><span class="value">${safeEmail}</span></div>
              <div class="row"><span class="label">Phone</span><span class="value">${safePhone}</span></div>
            </div>

            <div class="section">
              <h3>Services Required</h3>
              <div class="row"><span class="label">Services</span><span class="value">${safeServices}</span></div>
              ${safeOtherService ? `<div class="row"><span class="label">Custom Service</span><span class="value">${safeOtherService}</span></div>` : ''}
            </div>

            <div class="section">
              <h3>Project Details</h3>
              <div class="row"><span class="label">Project Name</span><span class="value">${safeProjectName}</span></div>
              <div class="row"><span class="label">Existing Website</span><span class="value">${quotationData.hasExistingWebsite ? 'Yes' : 'No'}</span></div>
              ${safeWebsiteUrl ? `<div class="row"><span class="label">Website URL</span><span class="value">${safeWebsiteUrl}</span></div>` : ''}
              <div class="desc-block">${safeDescription}</div>
            </div>

            <div class="section">
              <h3>Budget & Timeline</h3>
              <div class="row"><span class="label">Budget</span><span class="value">${safeBudget}</span></div>
              <div class="row"><span class="label">Timeline</span><span class="value">${safeTimeline}</span></div>
              <div class="row"><span class="label">Contact Preference</span><span class="value">${safeContactPreference}</span></div>
            </div>

            ${safeAdditionalInfo ? `
            <div class="section">
              <h3>Additional Information</h3>
              <div class="desc-block">${safeAdditionalInfo}</div>
            </div>
            ` : ''}

            <div class="section">
              <h3>Submission Info</h3>
              <div class="row"><span class="label">Submission Date</span><span class="value">${new Date(quotationData.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span></div>
              <div class="row"><span class="label">Status</span><span class="value">${escapeHtml(quotationData.status) || 'New'}</span></div>
            </div>

            <div class="footer">
              <p>ZER0ONE Automated Notification · MongoDB · ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body>
        </html>`;

        const { data, error } = await resend.emails.send({
            from: `ZER0ONE Enquiries <${senderDomain}>`,
            to: [receiver],
            subject: `[ZER0ONE] New Project Enquiry — ${escapeHtml(quotationData.requestId)} — ${safeFullName}`,
            html: htmlContent,
            replyTo: quotationData.email
        });

        if (error) {
            console.error(
                '[EmailService] Resend API error details:',
                JSON.stringify(error)
            );
            throw new Error(
                `Resend API Error: ${error.message || JSON.stringify(error)}`
            );
        }

        console.log(`[EmailService] Quotation notification sent via Resend. ID: ${data?.id}`);
        return { success: true, messageId: data?.id };

    } catch (error) {
        console.error('[EmailService] Failed to send quotation email:', error.message);
        return { success: false, error: error.message };
    }
};

export default {
    sendQuotationEmail
};
