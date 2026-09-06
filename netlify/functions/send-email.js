/**
 * Netlify Serverless Function: send-email
 * Endpoint: POST /.netlify/functions/send-email
 *
 * Mengirim email HTML verifikasi resmi KoneKA dengan kode OTP 5-karakter.
 * Menggunakan Resend API resmi dengan:
 * 1. Inline CID Logo (icon-192.png) sehingga logo selalu tampil sempurna tanpa link 404
 * 2. Multipart Text + HTML fallback untuk memaksimalkan deliverability ke Inbox Utama
 * 3. Header Reply-To resmi untuk reputasi pengirim yang sehat
 */

// Embedded base64 untuk icon-192.png agar selalu siap tanpa dependensi path disk
const ICON_BASE64 = "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";

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { to, name, code, html, subject, text, type } = payload;

    let targetEmail = to;
    if (type === 'admin_notification') {
      targetEmail = process.env.ADMIN_EMAIL || 'Koqw2wq10xnH9wbalao81alqm@gmail.com';
    } else {
      if (!targetEmail || !code) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Email tujuan (to) dan kode (code) wajib diisi' })
        };
      }
    }

    const emailSubject = subject || (code ? 'Kode Verifikasi Akun KoneKA: ' + code : 'Notifikasi Admin KoneKA');
    const recipientName = name || (type === 'admin_notification' ? 'Admin' : 'Warga');

    // Anti-spam optimization: Pastikan selalu ada versi text murni di samping HTML
    const plainText = text || (
      'Halo ' + recipientName + ',\n\n' +
      'Kode verifikasi akun KoneKA Anda: ' + code + '\n\n' +
      'Kode ini berlaku selama 15 menit.\n\n' +
      'Verifikasi Akun KoneKA — Portal Kolaborasi Warga & Pemberdayaan UMKM.\n' +
      'Jangan berikan kode ini kepada siapa pun.'
    );

    // Ganti URL logo yang 404 dengan referensi CID lokal agar gambar pasti ter-load di email client
    let processedHtml = html || '';
    const NETLIFY_ICON_URL = 'https://koneka.netlify.app/icon-192.png';
    if (processedHtml.includes('https://koneka-web.firebaseapp.com/icon-192.png')) {
      processedHtml = processedHtml.replace(/https:\/\/koneka-web\.firebaseapp\.com\/icon-192\.png/g, NETLIFY_ICON_URL);
    }
    if (processedHtml.includes('cid:koneka-logo')) {
      processedHtml = processedHtml.replace(/cid:koneka-logo/g, NETLIFY_ICON_URL);
    }

    // 0. Cek konfigurasi EMAILJS (Bebas DNS, kirim langsung via Gmail)
    const emailjsServiceId = process.env.EMAILJS_SERVICE_ID || 'service_45cinls';
    const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID || 'template_foh0gmm';
    const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY || 'Oe-D89PMSxaBBDxZB';

    if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4500);
        const ejRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://koneka.netlify.app',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify({
            service_id: emailjsServiceId,
            template_id: emailjsTemplateId,
            user_id: emailjsPublicKey,
            template_params: {
              to_email: targetEmail,
              email: targetEmail,
              to_name: recipientName,
              name: recipientName,
              user_name: recipientName,
              otp_code: code,
              code: code,
              subject: emailSubject,
              message: plainText,
              logo_url: NETLIFY_ICON_URL,
              logo: NETLIFY_ICON_URL,
              icon_url: NETLIFY_ICON_URL,
              image_url: NETLIFY_ICON_URL,
              koneka_logo: NETLIFY_ICON_URL,
              html: processedHtml,
              html_content: processedHtml
            }
          })
        });
        clearTimeout(timer);

        if (ejRes.ok) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, provider: 'emailjs' })
          };
        } else {
          const ejErr = await ejRes.text();
          console.warn('EmailJS server dispatch notice:', ejErr);
        }
      } catch (ejEx) {
        console.warn('EmailJS exception:', ejEx.message);
      }
    }

    // 1. Cek konfigurasi RESEND API KEY
    const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEU;
    if (resendApiKey) {
      const fromEmail = process.env.EMAIL_FROM;
      const replyToEmail = process.env.REPLY_TO;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + resendApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [targetEmail],
          reply_to: replyToEmail,
          subject: emailSubject,
          html: processedHtml,
          text: plainText,
          attachments: [
            {
              filename: 'icon-192.png',
              content: ICON_BASE64,
              cid: 'koneka-logo'
            }
          ]
        })
      });

      const resendData = await resendRes.json();
      if (resendRes.ok) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, provider: 'resend', id: resendData.id })
        };
      } else {
        console.warn('Resend dispatch error:', resendData);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            error: resendData.message || 'Gagal mengirim email via Resend',
            resendDetail: resendData
          })
        };
      }
    }

    // 2. Cek konfigurasi BREVO API KEY (Alternatif cadangan)
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      const senderEmail = process.env.BREVO_SENDER_EMAIL;
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'KoneKA Official', email: senderEmail },
          to: [{ email: targetEmail, name: recipientName }],
          subject: emailSubject,
          htmlContent: processedHtml,
          textContent: plainText
        })
      });

      const brevoData = await brevoRes.json();
      if (brevoRes.ok) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, provider: 'brevo', data: brevoData })
        };
      }
    }

    throw new Error('Konfigurasi server bermasalah: Tidak ada API Key (EmailJS/Resend/Brevo) yang ditemukan di environment variables.');

  } catch (err) {
    console.error('Error in send-email function:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
