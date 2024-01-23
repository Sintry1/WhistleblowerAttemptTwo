import { useState } from "react";
import "./SendReport.css";
import JSEncrypt from "jsencrypt";

export default function SendReport() {
  
  const host = "http://localhost:5241/";

  const [industry, setIndustry] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const encrypt = new JSEncrypt({ default_key_size: 2048 });

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

  const encryptValues = async (inputs, encryptionKey) => {
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
    const ciphers = await Promise.all(
      inputs.map((input) =>
        crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv },
          key,
          new TextEncoder().encode(input)
        )
      )
    );

    return {
      iv: Array.from(iv),
      salt: Array.fromsalt,
      inputs: ciphers.map((cipher) => ({ data: Array.from(new Uint8Array(cipher)) })),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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


      
    encrypt.setPublicKey(publicKey);
    let encryptionKey = await deriveKey();
    let encryptedData = await encryptValues(
      [reportDetails, companyName],
      encryptionKey
    );
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
    // Send report using Axios
    await fetch(`${host}api/Report/sendReport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        IndustryName: industry,
        Iv: encrypt.encrypt(encryptedIv),
        Salt: encrypt.encrypt(encryptedSalt),
        Key: encrypt.encrypt(encryptionKey),
        CompanyName: encryptedCompanyString,
        Description: encryptedReportString
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
