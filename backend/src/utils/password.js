import crypto from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(crypto.pbkdf2);

const ALGO = "pbkdf2";
const DIGEST = "sha512";
const ITERATIONS = 120000;
const KEY_LENGTH = 64;

export const isHashedPassword = (value) => {
  return typeof value === "string" && value.startsWith(`${ALGO}$`);
};

export const hashPassword = async (plainPassword) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await pbkdf2Async(plainPassword, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `${ALGO}$${ITERATIONS}$${salt}$${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (plainPassword, storedPassword) => {
  if (!isHashedPassword(storedPassword)) {
    return false;
  }

  const [algo, iterationsRaw, salt, expectedHashHex] = storedPassword.split("$");
  if (algo !== ALGO || !iterationsRaw || !salt || !expectedHashHex) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const derivedKey = await pbkdf2Async(plainPassword, salt, iterations, KEY_LENGTH, DIGEST);
  const expectedHash = Buffer.from(expectedHashHex, "hex");

  if (expectedHash.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, derivedKey);
};
