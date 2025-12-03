# shared/backend/src/services/email_service.py

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from textwrap import dedent

# --- Email Template Builder Function ---

def build_release_email_html(feature_data: dict, release_notes: str = "") -> str:
    """
    Build a styled HTML email for a feature release,
    matching the application's look & feel.

    Args:
        feature_data (dict): Dictionary containing feature details (title, version, etc.).
        release_notes (str): Additional notes for the release.

    Returns:
        str: The complete HTML content of the email.
    """

    # Extract and sanitize feature data
    feature_id = feature_data.get("feature_id", "")
    title = feature_data.get("title", "Untitled Feature")
    main_feature = feature_data.get("main_feature", "Unknown")
    version = feature_data.get("version", "0.0.0")
    ice_score = feature_data.get("ice_score", "—")
    feature_type = feature_data.get("type", "Unspecified")
    created_at = feature_data.get("created_at", "")

    # Format created date nicely
    formatted_date = ""
    if created_at:
        try:
            # Safely handle various string formats
            if isinstance(created_at, str) and 'T' in created_at:
                formatted_date = datetime.fromisoformat(created_at).strftime("%b %d, %Y")
            else:
                formatted_date = str(created_at)
        except Exception:
            formatted_date = str(created_at)

    # Default release notes
    release_notes = (release_notes or "").strip() or "No additional notes provided."
    release_notes_html = release_notes.replace("\n", "<br/>")

    # --- Style Variables ---
    # NOTE: Keep styles defined in one place for easier maintenance
    header_start = "#072b48"
    header_end = "#093359"
    surface_bg = "#f3f4f6"
    card_bg = "#0b1624"
    accent_blue = "#3b82f6"
    accent_blue_soft = "rgba(59,130,246,0.4)"
    logo_url = "https://via.placeholder.com/100x100.png?text=Valinor"

    # --- HTML Structure (Using dedent for clean multiline strings) ---
    html = dedent(f"""
    <html>
      <body style="margin: 0; padding: 0; background-color: {surface_bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="width: 100%; padding: 24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="max-width: 720px; width: 100%; margin: 0 auto; border-spacing: 0;">
            <tr>
              <td style="padding: 0 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: {card_bg}; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 45px rgba(15,23,42,0.85); border: 1px solid rgba(148,163,184,0.35);">
                  <tr>
                    <td style="padding: 18px 24px 16px 24px; background: linear-gradient(135deg, {header_start}, {header_end}); color: #f9fafb;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td valign="middle" style="width: 72px;">
                            <img src="{logo_url}" alt="Valinor Logo" style="display: block; width: 60px; height: 60px; border-radius: 16px; border: 2px solid rgba(148,163,184,0.5); background-color: rgba(15,23,42,0.6);" />
                          </td>
                          <td valign="middle" style="padding-left: 12px;">
                            <div style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #bfdbfe; margin-bottom: 4px;">
                              Auto1 Valinor · Release Notification
                            </div>
                            <div style="font-size: 18px; font-weight: 700; color: #f9fafb; margin-bottom: 2px;">
                              New Feature Released: {title}
                            </div>
                            <div style="font-size: 12px; color: #d1d5db;">
                              Feature ID <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">#{feature_id}</span>
                              {("&middot; " + formatted_date) if formatted_date else ""}
                            </div>
                          </td>
                          <td valign="middle" align="right" style="white-space: nowrap;">
                            <div style="margin-bottom: 4px;">
                              <span style="display: inline-block; padding: 3px 10px; border-radius: 999px; background-color: rgba(15,23,42,0.6); border: 1px solid rgba(191,219,254,0.6); font-size: 11px; color: #bfdbfe; font-weight: 600;">
                                v{version}
                              </span>
                            </div>
                            <div>
                              <span style="display: inline-block; padding: 3px 10px; border-radius: 999px; background-color: rgba(8,47,73,0.7); border: 1px solid rgba(56,189,248,0.8); font-size: 11px; color: #e0f2fe; font-weight: 500;">
                                {feature_type}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, {accent_blue_soft} 0%, rgba(96,165,250,0.9) 50%, {accent_blue_soft} 100%);"></td>
                  </tr>

                  <tr>
                    <td style="padding: 24px 24px 20px 24px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="font-size: 15px; color: #e5e7eb; padding-bottom: 12px;">
                            Hello team,
                          </td>
                        </tr>
                        <tr>
                          <td style="font-size: 14px; color: #cbd5f5; line-height: 1.6; padding-bottom: 16px;">
                            We’re excited to share that a new feature has just been shipped to the
                            <strong style="color: #f9fafb;">Valinor platform</strong>.
                            Here’s a quick summary of what’s included:
                          </td>
                        </tr>

                        <tr>
                          <td style="padding-bottom: 18px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius: 12px; background: radial-gradient(circle at top left, rgba(59,130,246,0.25), transparent 55%), rgba(15,23,42,0.92); border: 1px solid rgba(55,65,81,0.9);">
                              <tr>
                                <td style="padding: 16px 16px 10px 16px;">
                                  <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #9ca3af; margin-bottom: 4px;">
                                    Feature Overview
                                  </div>
                                  <div style="font-size: 15px; font-weight: 600; color: #e5e7eb;">
                                    {main_feature}
                                  </div>
                                </td>
                                <td align="right" valign="top" style="padding: 16px 16px 10px 0;">
                                  <div style="font-size: 11px; color: #9ca3af; margin-bottom: 4px; text-align: right;">
                                    ICE Score
                                  </div>
                                  <div style="display: inline-block; padding: 4px 10px; border-radius: 999px; background-color: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.6); color: #6ee7b7; font-size: 12px; font-weight: 600;">
                                    {ice_score}
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td colspan="2" style="padding: 8px 16px 14px 16px;">
                                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 12px; color: #9ca3af; border-top: 1px solid rgba(55,65,81,0.85); margin-top: 8px; padding-top: 8px;">
                                    <tr>
                                      <td style="padding: 4px 4px 4px 0; width: 33%;">
                                        <span style="color: #6b7280;">Type</span><br/>
                                        <span style="color: #e5e7eb; font-weight: 500;">{feature_type}</span>
                                      </td>
                                      <td style="padding: 4px 4px; width: 33%;">
                                        <span style="color: #6b7280;">Version</span><br/>
                                        <span style="color: #e5e7eb; font-weight: 500;">{version}</span>
                                      </td>
                                      <td style="padding: 4px 0 4px 4px; width: 34%;">
                                        <span style="color: #6b7280;">Created</span><br/>
                                        <span style="color: #e5e7eb; font-weight: 500;">{formatted_date or "—"}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding-bottom: 16px;">
                            <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.14em; color: #9ca3af; margin-bottom: 8px;">
                              Release Notes
                            </div>
                            <div style="background-color: rgba(15,23,42,0.85); border-radius: 12px; border: 1px solid rgba(55,65,81,0.9); padding: 14px 14px; font-size: 13px; line-height: 1.6; color: #e5e7eb;">
                              {release_notes_html}
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td style="font-size: 12px; color: #9ca3af; padding-top: 18px;">
                            <em>— AUTO1 Valinor Release Bot</em><br/>
                            <span style="color: #6b7280;">Thank you for helping us improve the Valinor experience for everyone.</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #020617; padding: 10px 24px 12px 24px; border-top: 1px solid rgba(31,41,55,0.9);">
                      <div style="text-align: center; font-size: 11px; color: #6b7280;">
                        AUTO1 Valinor Platform · Internal Release Notification<br/>
                        <span style="color: #4b5563;">This message was generated automatically. Replies to this email address are not monitored.</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
    """)

    return html

# --- Email Sender Function (Slightly modified to use HTML body) ---

def send_email(to, subject, body_content, cc=None, bcc=None, is_html=True):
    """
    Send an email via SMTP using environment configuration.

    The 'body_content' is treated as the full content (HTML or plain text).

    Args:
        to (str|list): comma-separated string or list of recipients
        subject (str): email subject line
        body_content (str): email body (full content, typically HTML from build_release_email_html)
        cc (str|list, optional): cc recipients
        bcc (str|list, optional): bcc recipients
        is_html (bool, optional): If True, attach as HTML/plain alternative. Defaults to True.
    """

    # --- Parse environment ---
    # NOTE: You should use os.getenv for deployment, but using the provided hardcoded values for the merge
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = "niklas.skoldborg@auto1.com" # os.getenv("SMTP_USER")
    smtp_password = "nasl shmu pvyv fpvt" # os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", "AUTO1 Valinor Release Bot <niklas.skoldborg@auto1.com>")


    if not smtp_host or not smtp_user or not smtp_password:
        raise RuntimeError("SMTP credentials not configured in environment variables.")

    # --- Normalize recipient lists ---
    def normalize(value):
        if not value:
            return []
        if isinstance(value, str):
            return [addr.strip() for addr in value.split(",") if addr.strip()]
        return list(value)

    to_list = normalize(to)
    cc_list = normalize(cc)
    bcc_list = normalize(bcc)
    all_recipients = to_list + cc_list + bcc_list

    if not all_recipients:
        raise ValueError("No recipients specified for email.")

    # --- Build MIME message ---
    msg = MIMEMultipart("alternative") if is_html else MIMEMultipart()
    msg["From"] = smtp_from
    msg["To"] = ", ".join(to_list)
    if cc_list:
        msg["Cc"] = ", ".join(cc_list)
    msg["Subject"] = subject

    # Add plain-text and HTML versions
    if is_html:
        # Create a plain text fallback by stripping HTML (simple fallback)
        plain_body = "This is an HTML email. Please view it in an HTML-compatible client."
        # A more robust solution would strip tags from body_content, but we use a placeholder here.
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(body_content, "html"))
    else:
        msg.attach(MIMEText(body_content, "plain"))


    # --- Send email ---
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            # sendmail expects the list of all recipients (To, Cc, Bcc)
            server.sendmail(smtp_from, all_recipients, msg.as_string())
        print(f"✅ Email sent successfully to {', '.join(to_list)}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        # Re-raise the exception after logging the failure
        raise