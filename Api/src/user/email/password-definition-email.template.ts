interface PasswordDefinitionEmailTemplateParams {
  name: string;
  definePasswordUrl: string;
}

export function buildPasswordDefinitionEmail({
  name,
  definePasswordUrl,
}: PasswordDefinitionEmailTemplateParams) {
  const escapedName = escapeHtml(name);
  const escapedUrl = escapeHtml(definePasswordUrl);

  return {
    subject: 'Set your AWS Manager password',
    text: [
      `Hello, ${name}.`,
      '',
      'Use the link below to set a new password for your AWS Manager account:',
      definePasswordUrl,
      '',
      'If you were not expecting this invitation, you can ignore this email.',
      'AWS Manager',
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Set your AWS Manager password</title>
  </head>
  <body style="margin:0;padding:0;background:#FAFAFA;font-family:Inter,Segoe UI,Arial,sans-serif;color:#09090B;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAFAFA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px 28px;border-bottom:1px solid #F4F4F5;">
                <div style="font-size:12px;line-height:1.5;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7C3AED;">AWS Manager</div>
                <h1 style="margin:10px 0 0 0;font-size:24px;line-height:1.25;font-weight:700;color:#09090B;">Set your password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px 28px 28px;">
                <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#3F3F46;">Hello, <strong style="color:#18181B;">${escapedName}</strong>.</p>
                <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#3F3F46;">Use the button below to set a new password for your AWS Manager account.</p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                  <tr>
                    <td bgcolor="#7C3AED" style="border-radius:8px;">
                      <a href="${escapedUrl}" target="_blank" style="display:inline-block;padding:14px 20px;font-size:14px;line-height:1;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;background:#7C3AED;">Set password</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#71717A;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#52525B;word-break:break-all;">${escapedUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#F4F4F5;border-top:1px solid #E4E4E7;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#71717A;">If you were not expecting this invitation, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
