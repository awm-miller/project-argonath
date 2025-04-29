import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { Resend } from 'npm:resend@2.1.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailPayload {
  job_id: string;
  email: string;
  success: boolean;
  message: string;
  result_url: string | null;
  filename: string | null;
  file_size: number | null;
}

// Initialize Resend with API key
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Verify request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    const payload: EmailPayload = await req.json();
    const { job_id, email, success, message, result_url, filename, file_size } = payload;

    // Validate required fields
    if (!job_id || !email || typeof success !== 'boolean' || !message) {
      throw new Error('Missing required fields');
    }

    // Construct email content
    const subject = success 
      ? `Reverberation Job ${job_id} Completed Successfully`
      : `Reverberation Job ${job_id} Failed`;

    let htmlContent = `<h2>${success ? 'Success!' : 'Error'}</h2>`;
    htmlContent += `<p>${message}</p>`;

    if (success && result_url) {
      const baseUrl = Deno.env.get('BACKEND_API_URL');
      const downloadUrl = result_url.startsWith('http') ? result_url : `${baseUrl}${result_url}`;
      
      htmlContent += `<p>Your results are ready to download:</p>`;
      htmlContent += `<p><a href="${downloadUrl}">${filename || 'Download Results'}</a>`;
      
      if (file_size) {
        const sizeMB = (file_size / (1024 * 1024)).toFixed(2);
        htmlContent += ` (${sizeMB} MB)`;
      }
      
      htmlContent += `</p>`;
      htmlContent += `<p><small>This download link will expire in 24 hours.</small></p>`;
    }

    // Send email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: 'Argonath <noreply@argonath.app>',
      to: email,
      subject,
      html: htmlContent,
    });

    if (emailError) {
      throw emailError;
    }

    // Log email send success
    console.log(`Email sent successfully to ${email} for job ${job_id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred while sending email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});