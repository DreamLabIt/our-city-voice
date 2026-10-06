/**
 * Creates (or promotes) a super admin.
 *
 *   pnpm admin:create
 *   pnpm admin:create --email ada@example.com --name "Ada Lovelace"
 *   pnpm admin:create --email ada@example.com --promote
 *
 * Through docker:
 *
 *   ./dev.sh sh backend          then run it inside the container
 *
 * Why a script and not an endpoint. The first privileged account is the one
 * thing that cannot be authorised by an existing privileged account, so any
 * HTTP route that creates one is either unauthenticated (anybody can become
 * admin) or gated by a setup token that then has to live somewhere. Shell
 * access to the server is the authorisation.
 *
 * Nothing in the running API can mint a super admin. Registration cannot set a
 * role at all, and PATCH /users/:id/role already requires one.
 */
import { createInterface, type Interface } from "node:readline/promises";
import { parseArgs } from "node:util";

import { prisma } from "../src/db/prisma.js";
import { hashPassword } from "../src/lib/password.js";

const MIN_PASSWORD_LENGTH = 8;

/** Thrown to unwind to the finally block that closes stdin and Prisma. */
class ExitSignal extends Error {}

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exitCode = 1;
  throw new ExitSignal();
}

/**
 * A line reader that does not lose input.
 *
 * readline's `question()` only resolves on the next 'line' event after it is
 * called. Piped input arrives as one chunk, readline emits every line in it
 * synchronously, and so every line after the first is emitted while nothing is
 * waiting and is dropped. `printf 'pw\npw\n' | pnpm admin:create` then hangs
 * forever on the confirmation prompt.
 *
 * Queueing the lines as they arrive fixes that: a reader that is already behind
 * takes from the queue instead of waiting for input that has been and gone.
 */
class LineSource {
  private readonly readline: Interface;
  private readonly queue: string[] = [];
  private readonly waiting: Array<(line: string | null) => void> = [];
  private ended = false;

  constructor() {
    this.readline = createInterface({ input: process.stdin, output: process.stdout });
    this.readline.on("line", (line) => {
      const waiter = this.waiting.shift();
      if (waiter) waiter(line);
      else this.queue.push(line);
    });
    this.readline.on("close", () => {
      this.ended = true;
      // Anything still waiting will never be answered. Resolving with null lets
      // the caller report "no input" rather than hanging.
      while (this.waiting.length > 0) this.waiting.shift()?.(null);
    });
  }

  /** The prompt is written here rather than by readline, which is not echoing. */
  async question(prompt: string): Promise<string> {
    process.stdout.write(prompt);

    const queued = this.queue.shift();
    // Not echoed. This same reader takes passwords when input is piped, and
    // printing a queued line would put one on stdout.
    if (queued !== undefined) return queued;

    if (this.ended) return "";

    return new Promise<string>((resolve) => {
      this.waiting.push((line) => resolve(line ?? ""));
    });
  }

  close(): void {
    this.readline.close();
  }
}

let lines: LineSource | null = null;

function lineReader(): LineSource {
  lines ??= new LineSource();
  return lines;
}

async function ask(question: string): Promise<string> {
  return (await lineReader().question(question)).trim();
}

/**
 * Reads a line without echoing it.
 *
 * Raw mode by hand rather than readline's internal _writeToOutput hook, which
 * is private API and has moved between Node versions. The cost is handling
 * backspace and ctrl-c here, which is the loop below.
 */
function readSecretFromTty(question: string): Promise<string> {
  const stdin = process.stdin;
  process.stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  return new Promise<string>((resolve, reject) => {
    let value = "";

    const cleanup = (): void => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      process.stdout.write("\n");
    };

    const onData = (chunk: string): void => {
      for (const char of chunk) {
        switch (char) {
          case "\r":
          case "\n":
            cleanup();
            resolve(value);
            return;
          case "\u0003": // ctrl-c
            cleanup();
            reject(new ExitSignal());
            return;
          case "\u007f": // backspace
          case "\b":
            value = value.slice(0, -1);
            break;
          default:
            // Skip the rest of the control range, so arrow keys and escape
            // sequences do not end up inside the password.
            if (char >= " ") value += char;
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function askSecret(question: string): Promise<string> {
  // Piped input. There is no terminal to switch echo off on, and nothing is
  // being displayed anyway, so the queued reader handles it.
  if (!process.stdin.isTTY) return lineReader().question(question);

  // readline and raw mode both want to own stdin, so the reader is retired
  // before taking over. Every visible prompt comes first.
  lines?.close();
  lines = null;

  return readSecretFromTty(question);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      /** Turn an account that already exists into a super admin. */
      promote: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  console.log("\n  OurCityVoice: create a super admin\n");

  const email = (values.email ?? (await ask("  Email:     "))).trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail("That does not look like an email address.");
  }

  const existing = await prisma.user.findFirst({
    where: { email },
    select: { id: true, name: true, role: true },
  });

  if (existing) {
    if (!values.promote) {
      fail(
        `${email} already has an account (${existing.name}, role ${existing.role}).\n` +
          "  Re-run with --promote to make that account a super admin.",
      );
    }

    if (existing.role === "super_admin") {
      console.log(`  ${email} is already a super admin. Nothing to do.\n`);
      return;
    }

    await prisma.user.update({ where: { id: existing.id }, data: { role: "super_admin" } });

    // Their current access token still says role: user. It expires on its own,
    // but revoking the refresh tokens means the next sign-in picks up the new
    // role instead of waiting out the old one.
    await prisma.refreshToken.updateMany({
      where: { userId: existing.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    console.log(`  Promoted ${existing.name} <${email}> to super_admin.`);
    console.log("  Existing sessions were ended, so they need to sign in again.\n");
    return;
  }

  if (values.promote) {
    fail(`No account exists for ${email}, so there is nothing to promote.`);
  }

  const name = (values.name ?? (await ask("  Full name: "))).trim();
  if (name.length < 2) fail("Please give a name of at least 2 characters.");

  const password = await askSecret("  Password:  ");
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const confirmation = await askSecret("  Again:     ");
  if (password !== confirmation) fail("Those passwords do not match.");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "super_admin",
      // Created by hand by somebody with server access, so treat the address as
      // confirmed. Nothing checks this column yet; setting it keeps the row
      // honest for when a verification flow exists.
      emailVerifiedAt: new Date(),
    },
    select: { id: true, name: true, email: true },
  });

  console.log(`\n  Created super admin #${user.id} ${user.name} <${user.email}>\n`);
}

try {
  await main();
} catch (error) {
  if (!(error instanceof ExitSignal)) {
    console.error("\n  Failed:", error instanceof Error ? error.message : error, "\n");
    process.exitCode = 1;
  }
} finally {
  // Without this the readline interface keeps stdin open and the process never
  // exits, even after main() has returned.
  lines?.close();
  await prisma.$disconnect();
}
