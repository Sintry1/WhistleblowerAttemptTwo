import { useState } from "react";
import bcrypt from "bcryptjs";
import JSEncrypt from "jsencrypt";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [industry, setIndustry] = useState("");

  const host = "http://localhost:5090/";

  const encrypt = JSEncrypt({ default_key_size: 2048 });

  const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    return hashedPassword;
  };

  const deriveKey = async () => {
    let key = crypto.getRandomValues(new Uint8Array(32));

    let salt = crypto.getRandomValues(new Uint8Array(16));

    const encodedKey = new TextEncoder().encode(key);

    const keyMat = await crypto.subtle.importKey(
      "raw",
      encodedKey,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: { name: "SHA-256" },
      },
      keyMat,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    return derivedKey;
  };

  const encryptValue = async (input, encryptionKey) => {
    const keyMaterial = await crypto.subtle.exportKey("raw", encryptionKey);

    let salt = crypto.getRandomValues(new Uint8Array(16));

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: { name: "SHA-256" },
      },
      await crypto.subtle.importKey(
        "raw",
        keyMaterial,
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      ),
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      new TextEncoder().encode(input)
    );

    return {
      iv: iv,
      salt: salt,
      input: new Uint8Array(cipher),
    };
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleRepeatPasswordChange = (e) => {
    setRepeatPassword(e.target.value);
  };

  const handleIndustryChange = (e) => {
    setIndustry(e.target.value);
  };

  const registerRegulator = async (email, password, industry) => {
    const hashedPassword = hashPassword(password);
    let encryptionKey = await deriveKey();
    let encryptedUser = await encryptValue(email, encryptionKey);
    let encryptedUsernameString = btoa(
      String.fromCharCode.apply(null, encryptedUser.input)
    );
    let encryptedUserIvString = btoa(
      String.fromCharCode.apply(null, encryptedUser.iv)
    );
    let encryptedUserSaltString = btoa(
      String.fromCharCode.apply(null, encryptedUser.salt)
    );
    let encryptedUsername = encrypt.encrypt(encryptedUsernameString);
    let encryptedIV = encrypt.encrypt(encryptedUserIvString);
    let encryptedSalt = encrypt.encrypt(encryptedUserSaltString);

    let response;
    try {
      response = await fetch(`${host}api/Regulator/createRegulator`, {
        method: "POST",
        body: JSON.stringify({
          Username: encryptedUsername,
          HashedPassword: hashedPassword,
          IndustryName: industry,
          Iv: encryptedIV,
          Salt: encryptedSalt,
          PublicKey: encrypt.getPublicKey(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Network error:", err);
      return;
    }
    if (!response.ok) {
      console.error("Response error:", response.status);
      return;
    }
    const data = await response.json();
    return data;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      email === "" ||
      password === "" ||
      repeatPassword === "" ||
      industry === ""
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== repeatPassword) {
      alert("Passwords do not match");
      return;
    }

    registerRegulator(email, password, industry);

    // Reset form fields
    setEmail("");
    setPassword("");
    setRepeatPassword("");
    setIndustry("");
  };

  return (
    <div>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
        />
        <input
          type="password"
          placeholder="Repeat Password"
          value={repeatPassword}
          onChange={handleRepeatPasswordChange}
        />
        <select value={industry} onChange={handleIndustryChange}>
          <option value="">Select Industry</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Financial Services">Financial Services</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Law Enforcement">Law Enforcement</option>
          <option value="Leisure">Leisure</option>
          <option value="Hospitality">Hospitality</option>
          {/* Add more options as needed */}
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
