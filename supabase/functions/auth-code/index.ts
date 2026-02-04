import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

// Generate a 6-character alphanumeric code (uppercase letters and numbers)
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded I, O, 0, 1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function sendEmail(email: string, code: string, type: 'signup' | 'login'): Promise<boolean> {
  const subject = type === 'signup' 
    ? "DNF KART - Code de vérification d'inscription"
    : "DNF KART - Code de connexion";

  const title = type === 'signup'
    ? "Bienvenue sur DNF KART !"
    : "Connexion à DNF KART";

  const message = type === 'signup'
    ? "Voici votre code de vérification pour finaliser votre inscription :"
    : "Voici votre code de connexion :";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #050505;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" max-width="500" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #0a0a0a; border-radius: 16px; border: 1px solid #1a1a1a;">
                <tr>
                  <td align="center" style="padding: 40px 40px 20px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 16px; border-radius: 12px; box-shadow: 0 0 30px rgba(220, 38, 38, 0.4);">
                      <span style="font-size: 28px;">🏁</span>
                    </div>
                    <h1 style="margin: 20px 0 0; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">
                      DNF <span style="color: #dc2626;">KART</span>
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 12px; color: #666666; letter-spacing: 3px; text-transform: uppercase;">
                      TEAM ANALYZER
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px;">
                    <h2 style="margin: 0 0 16px; font-size: 22px; color: #ffffff; text-align: center;">
                      ${title}
                    </h2>
                    <p style="margin: 0 0 24px; font-size: 16px; color: #a0a0a0; text-align: center; line-height: 1.6;">
                      ${message}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 0 40px 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 20px 40px; box-shadow: 0 0 20px rgba(220, 38, 38, 0.2);">
                      <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <p style="margin: 0; font-size: 14px; color: #666666; text-align: center; line-height: 1.5;">
                      Ce code expire dans <strong style="color: #dc2626;">10 minutes</strong>.<br>
                      Ne partagez jamais ce code avec personne.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid #1a1a1a;">
                    <p style="margin: 0; font-size: 12px; color: #444444; text-align: center;">
                      Si vous n'avez pas demandé ce code, ignorez cet email.
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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "DNF KART <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("Resend error:", errorData);
    return false;
  }

  console.log("Email sent successfully to:", email);
  return true;
}

// Check if user exists using listUsers with filter
async function checkUserExists(supabase: any, email: string): Promise<boolean> {
  const { data, error } = await supabase.auth.admin.listUsers({
    filter: `email.eq.${email}`,
    page: 1,
    perPage: 1,
  });
  
  if (error) {
    console.error("Error checking user:", error);
    return false;
  }
  
  return data?.users?.length > 0;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { action, email, firstName, lastName, code } = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Clean up expired codes
    await supabase.from('auth_codes').delete().lt('expires_at', new Date().toISOString());

    // ==================== REQUEST SIGNUP CODE ====================
    if (action === 'request_signup_code') {
      if (!firstName || firstName.trim().length < 2) {
        return new Response(
          JSON.stringify({ error: "Le prénom doit contenir au moins 2 caractères" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!lastName || lastName.trim().length < 2) {
        return new Response(
          JSON.stringify({ error: "Le nom doit contenir au moins 2 caractères" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if user already exists
      const userExists = await checkUserExists(supabase, email);
      if (userExists) {
        return new Response(
          JSON.stringify({ error: "Cet email est déjà utilisé" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Generate and store code
      const authCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing codes for this email
      await supabase.from('auth_codes').delete().eq('email', email).eq('type', 'signup');

      // Store the new code
      const { error: insertError } = await supabase.from('auth_codes').insert({
        email,
        code: authCode,
        type: 'signup',
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) {
        console.error("Error storing code:", insertError);
        throw new Error("Erreur lors de la création du code");
      }

      // Send email
      const emailSent = await sendEmail(email, authCode, 'signup');
      if (!emailSent) {
        throw new Error("Erreur lors de l'envoi de l'email");
      }

      console.log(`Signup code sent to ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Code envoyé par email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ==================== VERIFY SIGNUP CODE ====================
    if (action === 'verify_signup_code') {
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ error: "Code invalide" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!firstName || firstName.trim().length < 2 || !lastName || lastName.trim().length < 2) {
        return new Response(
          JSON.stringify({ error: "Prénom et nom requis" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Find valid code
      const { data: authCodeData, error: findError } = await supabase
        .from('auth_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code.toUpperCase())
        .eq('type', 'signup')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (findError || !authCodeData) {
        console.log("Invalid or expired code for:", email);
        return new Response(
          JSON.stringify({ error: "Code invalide ou expiré" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark code as used
      await supabase.from('auth_codes').update({ used: true }).eq('id', authCodeData.id);

      // Generate a random password for the user (they won't need it since login is code-based)
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();

      // Create user with Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`User created successfully: ${email}`);

      // Generate a magic link token to auto-login the user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (linkError || !linkData) {
        console.error("Error generating auto-login link:", linkError);
        return new Response(
          JSON.stringify({ success: true, message: "Compte créé avec succès" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Extract token from the link
      const url = new URL(linkData.properties.action_link);
      const token = url.searchParams.get('token');

      return new Response(
        JSON.stringify({ 
          success: true, 
          token: token,
          message: "Compte créé avec succès" 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ==================== REQUEST LOGIN CODE ====================
    if (action === 'request_login_code') {
      // Check if user exists
      const userExists = await checkUserExists(supabase, email);
      if (!userExists) {
        return new Response(
          JSON.stringify({ error: "Aucun compte avec cet email" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Generate and store code
      const authCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing login codes for this email
      await supabase.from('auth_codes').delete().eq('email', email).eq('type', 'login');

      // Store the new code
      const { error: insertError } = await supabase.from('auth_codes').insert({
        email,
        code: authCode,
        type: 'login',
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) {
        console.error("Error storing code:", insertError);
        throw new Error("Erreur lors de la création du code");
      }

      // Send email
      const emailSent = await sendEmail(email, authCode, 'login');
      if (!emailSent) {
        throw new Error("Erreur lors de l'envoi de l'email");
      }

      console.log(`Login code sent to ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Code envoyé par email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ==================== VERIFY LOGIN CODE ====================
    if (action === 'verify_login_code') {
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ error: "Code invalide" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Find valid code
      const { data: authCodeData, error: findError } = await supabase
        .from('auth_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code.toUpperCase())
        .eq('type', 'login')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (findError || !authCodeData) {
        console.log("Invalid or expired login code for:", email);
        return new Response(
          JSON.stringify({ error: "Code invalide ou expiré" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark code as used
      await supabase.from('auth_codes').update({ used: true }).eq('id', authCodeData.id);

      // Generate a magic link token for the user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      });

      if (linkError || !linkData) {
        console.error("Error generating magic link:", linkError);
        return new Response(
          JSON.stringify({ error: "Erreur de connexion" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Extract token from the link
      const url = new URL(linkData.properties.action_link);
      const token = url.searchParams.get('token');
      const tokenType = url.searchParams.get('type') || 'magiclink';

      console.log(`Login verified for: ${email}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          token: token,
          type: tokenType,
          message: "Connexion réussie" 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Action non reconnue" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in auth-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
