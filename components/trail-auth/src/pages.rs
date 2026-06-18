pub(crate) fn verify_email_page() -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify email</title>
  <style>
    body {{
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      font-family: -apple-system, sans-serif;
    }}
    .card {{
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      margin: 1rem;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="card">
    <p>Your email has been verified. You can close this tab and sign in.</p>
    <a href="/">Go to sign in</a>
  </div>
</body>
</html>"#
    )
}
