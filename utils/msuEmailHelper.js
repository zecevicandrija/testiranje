/**
 * MSU Email Helper
 * Sends welcome email to new users created via MSU payment
 */

const { Resend } = require('resend');

async function sendMsuWelcomeEmail(toEmail, plainPassword, firstName = 'Korisnik') {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY nije postavljen - preskačem slanje mejla.');
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
          
          <!-- Main Container -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr>
              <td align="center">
                
                <!-- Content Wrapper -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(135deg, rgba(255,165,0,0.05) 0%, rgba(255,69,0,0.05) 100%);border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg, #ff4500 0%, #ff6b35 100%);padding:40px 30px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">
                        🎉 Dobrodošao u Motion Akademiju!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 30px;background-color:#1a1a1a;">
                      
                      <!-- Welcome Message -->
                      <p style="margin:0 0 30px 0;color:#e0e0e0;font-size:18px;line-height:1.6;text-align:center;">
                        Pozdrav <strong style="color:#ffa500;">${firstName}</strong>! 👋
                      </p>
                      
                      <p style="margin:0 0 30px 0;color:#b0b0b0;font-size:15px;line-height:1.6;text-align:center;">
                        Tvoja kupovina je uspešno završena! Automatski je kreiran nalog za pristup lekcijama.
                      </p>
                      
                      <!-- Credentials Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,165,0,0.2);border-radius:16px;margin:30px 0;overflow:hidden;">
                        <tr>
                          <td style="padding:25px;">
                            <h3 style="margin:0 0 20px 0;color:#ffa500;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:1px;text-align:center;">
                              📧 Tvoji Pristupni Podaci
                            </h3>
                            
                            <!-- Email -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:15px;">
                              <tr>
                                <td style="padding:12px 15px;background:rgba(255,69,0,0.1);border-radius:8px;">
                                  <p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                                  <p style="margin:5px 0 0 0;color:#fff;font-size:15px;font-weight:600;">${toEmail}</p>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Password -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding:12px 15px;background:rgba(255,69,0,0.1);border-radius:8px;">
                                  <p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Lozinka</p>
                                  <p style="margin:5px 0 0 0;color:#ff4500;font-size:18px;font-weight:700;letter-spacing:1px;">${plainPassword}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Login Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://localhost:3000/login" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg, #ff4500 0%, #ff6b35 100%);color:#fff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.5px;box-shadow:0 10px 30px rgba(255,69,0,0.3);text-transform:uppercase;">
                              🚀 Prijavite se sada
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Discord Community Section -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg, rgba(88,101,242,0.1) 0%, rgba(114,137,218,0.1) 100%);border:1px solid rgba(88,101,242,0.3);border-radius:16px;margin:30px 0;overflow:hidden;">
                        <tr>
                          <td style="padding:25px;text-align:center;">
                            <h3 style="margin:0 0 15px 0;color:#5865F2;font-size:18px;font-weight:700;">
                              💬 Pridruži se našoj zajednici!
                            </h3>
                            <p style="margin:0 0 20px 0;color:#b0b0b0;font-size:14px;line-height:1.6;">
                              Uđi u privatnu Discord zajednicu gde možeš postavljati pitanja, deliti rad i povezati se sa drugim članovima.
                            </p>
                            <a href="https://discord.com/invite/motionakademija" style="display:inline-block;padding:14px 32px;background:#5865F2;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;box-shadow:0 8px 24px rgba(88,101,242,0.4);">
                              Otvori Discord
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Note -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0 0;">
                        <tr>
                          <td style="padding:20px;background:rgba(255,165,0,0.05);border-left:4px solid #ffa500;border-radius:8px;">
                            <p style="margin:0;color:#ffa500;font-size:13px;line-height:1.6;">
                              <strong>💡 Savet:</strong> Preporučujemo da promenite lozinku nakon prve prijave. Možete to uraditi u podešavanjima profila.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding:30px;background-color:#0f0f0f;text-align:center;border-top:1px solid rgba(255,165,0,0.1);">
                      <p style="margin:0 0 10px 0;color:#666;font-size:13px;line-height:1.6;">
                        © 2026 Motion Akademija. Sva prava zadržana.
                      </p>
                      <p style="margin:0;color:#555;font-size:12px;">
                        <a href="https://localhost:3000" style="color:#ff4500;text-decoration:none;">localhost:3000</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
                
              </td>
            </tr>
          </table>
          
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'MotionAkademija <office@motionakademija.com>',
      to: toEmail,
      subject: 'Dobrodošli - Vaš nalog je kreiran!',
      html
    });

    return true;
  } catch (err) {
    console.error('Greška pri slanju email-a (Resend):', err.message);
    return false;
  }
}

/**
 * Send subscription renewal confirmation email
 * @param {string} toEmail - User email
 * @param {string} firstName - User first name
 * @param {Date} newExpiryDate - New subscription expiry date
 * @param {number} amount - Amount charged
 * @returns {Promise<boolean>}
 */
async function sendSubscriptionRenewalEmail(toEmail, firstName, newExpiryDate, amount) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY nije postavljen - preskačem slanje mejla.');
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const formattedDate = new Date(newExpiryDate).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
          
          <!-- Main Container -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr>
              <td align="center">
                
                <!-- Content Wrapper -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(135deg, rgba(34,193,195,0.05) 0%, rgba(253,187,45,0.05) 100%);border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg, #22c1c3 0%, #fdbb2d 100%);padding:40px 30px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">
                        ✅ Pretplata Produžena!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 30px;background-color:#1a1a1a;">
                      
                      <!-- Welcome Message -->
                      <p style="margin:0 0 30px 0;color:#e0e0e0;font-size:18px;line-height:1.6;text-align:center;">
                        Pozdrav <strong style="color:#22c1c3;">${firstName}</strong>! 👋
                      </p>
                      
                      <p style="margin:0 0 30px 0;color:#b0b0b0;font-size:15px;line-height:1.6;text-align:center;">
                        Tvoja pretplata na Motion Akademiju je uspešno produžena!
                      </p>
                      
                      <!-- Subscription Details Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,0,0,0.4);border:1px solid rgba(34,193,195,0.3);border-radius:16px;margin:30px 0;overflow:hidden;">
                        <tr>
                          <td style="padding:25px;">
                            <h3 style="margin:0 0 20px 0;color:#22c1c3;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:1px;text-align:center;">
                              📋 Detalji Pretplate
                            </h3>
                            
                            <!-- Amount Charged -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:15px;">
                              <tr>
                                <td style="padding:12px 15px;background:rgba(34,193,195,0.1);border-radius:8px;">
                                  <p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Iznos Naplaćen</p>
                                  <p style="margin:5px 0 0 0;color:#fff;font-size:20px;font-weight:700;">${amount} RSD</p>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- New Expiry Date -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding:12px 15px;background:rgba(253,187,45,0.1);border-radius:8px;">
                                  <p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Vaš Pristup Ističe</p>
                                  <p style="margin:5px 0 0 0;color:#fdbb2d;font-size:18px;font-weight:700;">${formattedDate}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Access Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://localhost:3000/profil" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg, #22c1c3 0%, #fdbb2d 100%);color:#fff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.5px;box-shadow:0 10px 30px rgba(34,193,195,0.3);text-transform:uppercase;">
                              🚀 Pogledaj Profil
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Info Note -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 0 0;">
                        <tr>
                          <td style="padding:20px;background:rgba(34,193,195,0.05);border-left:4px solid #22c1c3;border-radius:8px;">
                            <p style="margin:0;color:#22c1c3;font-size:13px;line-height:1.6;">
                              <strong>💡 Info:</strong> Tvoja pretplata će se automatski produžavati svakog meseca. Možeš otkazati automatsko produžavanje u bilo kom trenutku na svom profilu.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding:30px;background-color:#0f0f0f;text-align:center;border-top:1px solid rgba(34,193,195,0.1);">
                      <p style="margin:0 0 10px 0;color:#666;font-size:13px;line-height:1.6;">
                        © 2026 Motion Akademija. Sva prava zadržana.
                      </p>
                      <p style="margin:0;color:#555;font-size:12px;">
                        <a href="https://localhost:3000" style="color:#22c1c3;text-decoration:none;">localhost:3000</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
                
              </td>
            </tr>
          </table>
          
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'MotionAkademija <office@motionakademija.com>',
      to: toEmail,
      subject: '✅ Vaša pretplata je produžena!',
      html
    });

    return true;
  } catch (err) {
    console.error('Greška pri slanju email-a (Resend):', err.message);
    return false;
  }
}

/**
 * Send subscription payment failed email
 * @param {string} toEmail - User email
 * @param {string} firstName - User first name
 * @returns {Promise<boolean>}
 */
async function sendSubscriptionPaymentFailedEmail(toEmail, firstName) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY nije postavljen - preskačem slanje mejla.');
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(135deg, rgba(255,69,0,0.05) 0%, rgba(220,20,60,0.05) 100%);border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                  <tr>
                    <td style="background:linear-gradient(135deg, #ff4500 0%, #dc143c 100%);padding:40px 30px;text-align:center;">
                      <h1 style="margin:0;color:#fff;font-size:32px;font-weight:800;letter-spacing:-0.5px;">
                        ⚠️ Problem sa Plaćanjem
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 30px;background-color:#1a1a1a;">
                      <p style="margin:0 0 30px 0;color:#e0e0e0;font-size:18px;line-height:1.6;text-align:center;">
                        Pozdrav <strong style="color:#ff4500;">${firstName}</strong>,
                      </p>
                      <p style="margin:0 0 30px 0;color:#b0b0b0;font-size:15px;line-height:1.6;text-align:center;">
                        Nažalost, nismo uspeli da naplatimo tvoju pretplatu. Molimo te da ažuriraš podatke o plaćanju.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://localhost:3000/produzivanje" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg, #ff4500 0%, #dc143c 100%);color:#fff;text-decoration:none;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.5px;box-shadow:0 10px 30px rgba(255,69,0,0.3);text-transform:uppercase;">
                              Obnovi Pretplatu
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px;background-color:#0f0f0f;text-align:center;border-top:1px solid rgba(255,69,0,0.1);">
                      <p style="margin:0 0 10px 0;color:#666;font-size:13px;line-height:1.6;">
                        © 2026 Motion Akademija. Sva prava zadržana.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'MotionAkademija <office@motionakademija.com>',
      to: toEmail,
      subject: '⚠️ Problem sa plaćanjem pretplate',
      html
    });

    return true;
  } catch (err) {
    console.error('Greška pri slanju email-a (Resend):', err.message);
    return false;
  }
}

module.exports = {
  sendMsuWelcomeEmail,
  sendSubscriptionRenewalEmail,
  sendSubscriptionPaymentFailedEmail
};
