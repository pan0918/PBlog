import tls from "tls";
import { buildModerationEmail, type ModerationEmailInput } from "./messageWall";

type SmtpResponse = {
  code: number;
  text: string;
};

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function dotStuff(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function buildMimeMessage({
  from,
  html,
  subject,
  text,
  to,
}: {
  from: string;
  html: string;
  subject: string;
  text: string;
  to: string;
}) {
  const boundary = `pb-message-wall-${Date.now().toString(36)}`;
  const fromLabel = encodeHeader("PBlog 留言墙");

  return [
    `From: ${fromLabel} <${from}>`,
    `To: <${to}>`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    dotStuff(text),
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    dotStuff(html),
    "",
    `--${boundary}--`,
  ].join("\r\n");
}

function parseSmtpResponse(buffer: string): { response: SmtpResponse; rest: string } | null {
  const lines = buffer.split(/\r\n|\n/);
  let consumedLines = 0;
  let lastLine = "";

  for (const line of lines) {
    if (!line) break;
    consumedLines += 1;
    lastLine = line;
    if (/^\d{3} /.test(line)) {
      const code = Number(line.slice(0, 3));
      const rest = lines.slice(consumedLines).join("\r\n");
      return { response: { code, text: lines.slice(0, consumedLines).join("\n") }, rest };
    }
  }

  if (/^\d{3} /.test(lastLine)) {
    const code = Number(lastLine.slice(0, 3));
    return { response: { code, text: lines.slice(0, consumedLines).join("\n") }, rest: "" };
  }

  return null;
}

async function sendWithSmtp({
  from,
  host,
  pass,
  port,
  to,
  user,
  message,
}: {
  from: string;
  host: string;
  pass: string;
  port: number;
  to: string;
  user: string;
  message: string;
}) {
  const socket = tls.connect({ host, port, servername: host });
  socket.setTimeout(12_000);

  let buffer = "";

  const readResponse = () =>
    new Promise<SmtpResponse>((resolve, reject) => {
      const cleanup = () => {
        socket.off("data", onData);
        socket.off("error", onError);
        socket.off("timeout", onTimeout);
      };
      const tryResolve = () => {
        const parsed = parseSmtpResponse(buffer);
        if (!parsed) return false;
        buffer = parsed.rest;
        cleanup();
        resolve(parsed.response);
        return true;
      };
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        tryResolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onTimeout = () => {
        cleanup();
        reject(new Error("SMTP connection timed out"));
      };

      if (tryResolve()) return;
      socket.on("data", onData);
      socket.once("error", onError);
      socket.once("timeout", onTimeout);
    });

  const write = (line: string) =>
    new Promise<void>((resolve, reject) => {
      socket.write(`${line}\r\n`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

  const command = async (line: string, expectedCodes: number[]) => {
    await write(line);
    const response = await readResponse();
    if (!expectedCodes.includes(response.code)) {
      throw new Error(`SMTP command failed with ${response.code}: ${response.text}`);
    }
  };

  try {
    const greeting = await readResponse();
    if (greeting.code !== 220) {
      throw new Error(`SMTP greeting failed with ${greeting.code}: ${greeting.text}`);
    }

    await command("EHLO pblog.local", [250]);
    await command("AUTH LOGIN", [334]);
    await command(Buffer.from(user).toString("base64"), [334]);
    await command(Buffer.from(pass).toString("base64"), [235]);
    await command(`MAIL FROM:<${from}>`, [250]);
    await command(`RCPT TO:<${to}>`, [250, 251]);
    await command("DATA", [354]);
    await write(`${message}\r\n.`);
    const dataResponse = await readResponse();
    if (dataResponse.code !== 250) {
      throw new Error(`SMTP DATA failed with ${dataResponse.code}: ${dataResponse.text}`);
    }
    await command("QUIT", [221]);
  } finally {
    socket.end();
  }
}

export async function sendModerationEmail(input: ModerationEmailInput) {
  const user = process.env.MESSAGE_EMAIL_USER || process.env.SMTP_USER || "pckblog@163.com";
  const pass = process.env.MESSAGE_EMAIL_PASS || process.env.SMTP_PASS || process.env.EMAIL_AUTH_CODE;
  const to = process.env.MESSAGE_NOTIFY_TO || process.env.SMTP_TO || "pckblog@163.com";
  const host = process.env.MESSAGE_SMTP_HOST || "smtp.163.com";
  const port = Number(process.env.MESSAGE_SMTP_PORT || 465);

  if (!pass) {
    throw new EmailConfigurationError("缺少 163 邮箱授权码：请配置 MESSAGE_EMAIL_PASS");
  }

  const email = buildModerationEmail(input);
  const message = buildMimeMessage({
    from: user,
    html: email.html,
    subject: email.subject,
    text: email.text,
    to,
  });

  await sendWithSmtp({ from: user, host, message, pass, port, to, user });
}
