import { useState } from "react";
import "./SendReport.css";
import JSEncrypt from "jsencrypt";

export default function SendReport() {
  // The host URL for the API
  const host = "http://localhost:5241/";

  // State variables for the industry, company name, and report details
  const [industry, setIndustry] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  // Initialize JSEncrypt for RSA encryption
  const encrypt = new JSEncrypt({ default_key_size: 2048 });

  // Function to derive a cryptographic key using PBKDF2
  const deriveKey = async () => {
    // Generate a random key and salt
    let key = crypto.getRandomValues(new Uint8Array(32));

    let salt = crypto.getRandomValues(new Uint8Array(16));

    // Encode the key and import it into a CryptoKey object
    const encodedKey = new TextEncoder().encode(key);

    const keyMat = await crypto.subtle.importKey(
      "raw",
      encodedKey,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    // Derive a new key from the original key and salt
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

  // Function to encrypt the input values using AES-GCM
  const encryptValues = async (inputs, encryptionKey) => {
    // Export the encryption key to raw data and derive a new key from it
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

    // Generate an initialization vector and encrypt the inputs
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphers = await Promise.all(
      inputs.map((input) =>
        crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv },
          key,
          new TextEncoder().encode(input)
        )
      )
    );

    // Return the encrypted data along with the IV and salt
    return {
      iv: Array.from(iv),
      salt: Array.from(salt),
      inputs: ciphers.map((cipher) => ({
        data: Array.from(new Uint8Array(cipher)),
      })),
    };
  };

  // Function to export a CryptoKey to a base64 string
  const exportkey = async (cryptoKey) => {
    const exportedKey = await crypto.subtle.exportKey("raw", cryptoKey);
    const keyAsUint8Array = new Uint8Array(exportedKey);
    let keyAsString = "";
    for (let i = 0; i < keyAsUint8Array.length; i++) {
      keyAsString += String.fromCharCode(keyAsUint8Array[i]);
    }
    const keyAsBase64 = btoa(keyAsString);
    return keyAsBase64;
  };

  // Function to handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Fetch the public key from the API
    let publicKey = await fetch(
      `${host}api/Regulator/GetPublicKey/${industry}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) => res.publicKey);

    // Set the public key for the JSEncrypt instance
    encrypt.setPublicKey(publicKey);

    // Derive a key, encrypt the report details and company name, and export the key to a base64 string
    let encryptionKey = await deriveKey();
    let encryptedData = await encryptValues(
      [reportDetails, companyName],
      encryptionKey
    );

    encryptionKey = await exportkey(encryptionKey);

    // Convert the IV, salt, and encrypted data to base64 strings
    let encryptedIv = btoa(String.fromCharCode.apply(null, encryptedData.iv));

    let encryptedSalt = btoa(
      String.fromCharCode.apply(null, encryptedData.salt)
    );
    let encryptedReportString = btoa(
      String.fromCharCode.apply(null, encryptedData.inputs[0].data)
    );
    let encryptedCompanyString = btoa(
      String.fromCharCode.apply(null, encryptedData.inputs[1].data)
    );

    // Validate the form inputs
    if (industry === "") {
      alert("Please select an industry");
      return;
    }

    if (companyName === "") {
      alert("Please enter a company name");
      return;
    }

    if (reportDetails === "") {
      alert("Please enter a report description");
      return;
    }

    // Send the report to the API
    await fetch(`${host}api/Report/sendReport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        IndustryName: industry,
        Iv: encrypt.encrypt(encryptedIv),
        Salt: encrypt.encrypt(encryptedSalt),
        Key: encrypt.encrypt(encryptionKey),
        CompanyName: encryptedCompanyString,
        Description: encryptedReportString,
      }),
    }).then((res) => res.json());
  };

  return (
    <div className="container">
      <h2>Submit a Report</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="industry">Industry</label>
          <select
            id="industry"
            className="dropdown"
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select Industry</option>
            <option value="Information Technology">
              Information Technology
            </option>
            <option value="Financial Services">Financial Services</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Law Enforcement">Law Enforcement</option>
            <option value="Leisure">Leisure</option>
            <option value="Hospitality">Hospitality</option>
          </select>
        </div>
        <div>
          <label htmlFor="company">Company Name</label>
          <input
            id="company"
            className="input"
            type="text"
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
          />
        </div>
        <div>
          <label htmlFor="description">Report Details</label>
          <textarea
            onChange={(e) => setReportDetails(e.target.value)}
            id="description"
            className="description"
            placeholder="Description"
          ></textarea>
        </div>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
