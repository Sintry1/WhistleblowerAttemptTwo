import { useEffect, useState } from "react";
import "./BrowseReports.css";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import JSEncrypt from "jsencrypt";

export default function Reports() {
  // Initialize state variables for storing reports and decrypted reports
  const [reports, setReports] = useState([]);
  const [decryptedReports, setDecryptedReports] = useState({});

  // Initialize JSEncrypt instance for encryption and decryptio
  const encrypt = new JSEncrypt({ default_key_size: 2048 });

  // Use useEffect hook to fetch reports when the component mounts
  useEffect(() => {
    const token = Cookies.get("JWT");
    if (token) {
      const decodedToken = jwtDecode(token);
      fetchReports(decodedToken.unique_name);
    }
  }, []);

  // Define the host URL for the API
  const host = "http://localhost:5241/";

  // Define an async function to fetch reports from the API
  const fetchReports = async (industry) => {
    try {
      const response = await fetch(
        `${host}api/Regulator/getReports/${industry}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("JWT")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.status !== 204) {
        // Check if the response is not No Content
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  // Define an async function to import a key for decryption
  const importKey = async (keyString) => {
    let keyAsBinaryString = atob(keyString);
    let keyAsArrayBuffer = new Uint8Array(keyAsBinaryString.length);
    for (let i = 0; i < keyAsBinaryString.length; i++) {
      keyAsArrayBuffer[i] = keyAsBinaryString.charCodeAt(i);
    }
    const importedKey = await crypto.subtle.importKey(
      "raw",
      keyAsArrayBuffer,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    return importedKey;
  };

  // Define a function to get the private key from a file
  const getPrivateKey = () => {
    // Get private key from file
    return new Promise((resolve, reject) => {
      // Prompt user to upload file contents
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".txt"; // Specify the accepted file type(s) here
      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          // Process the file contents here
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContents = e.target.result;
            // Set the private key with the file contents
            encrypt.setPrivateKey(fileContents);
            resolve();
          };
          reader.readAsText(file);
        } else {
          reject(new Error("Failed to load file"));
        }
      });
      fileInput.click();
    });
  };

  // Define an async function to decrypt a report given the report ID
  const decryptReport = async (reportId) => {
    // Get the private key from a file
    await getPrivateKey();

    // Find the report that matches the reportId
    const report = reports.find((report) => report.reportID === reportId);

    if (!report) {
      throw new Error(`Report with id ${reportId} not found`);
    }

    // Decrypt the key, salt, and initialization vector (iv) from the report
    let decryptionKey = encrypt.decrypt(report.key);
    let salt = encrypt.decrypt(report.salt);
    let iv = encrypt.decrypt(report.iv);

    // Import the decryption key
    decryptionKey = await importKey(decryptionKey);

    try {
      // Export the decryption key material
      const keyMaterial = await window.crypto.subtle.exportKey(
        "raw",
        decryptionKey
      );

      // Convert the salt and iv from base64 to byte arrays
      salt = new Uint8Array(
        atob(salt)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      iv = new Uint8Array(
        atob(iv)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      // Derive the AES-GCM key using PBKDF2
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

      // Convert the encrypted company name and description from base64 to byte arrays
      const encryptedCompanyData = new Uint8Array(
        atob(report.companyName)
          .split("")
          .map((char) => char.charCodeAt(0))
      );
      const encryptedDescriptionData = new Uint8Array(
        atob(report.description)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      // Decrypt the company name and description using the derived key and iv
      const decryptedCompanyDataBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedCompanyData
      );
      const decryptedDescriptionDataBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedDescriptionData
      );

      // Convert the decrypted data from byte arrays to strings
      const decryptedDataStrings = {
        companyName: new TextDecoder().decode(decryptedCompanyDataBuffer),
        description: new TextDecoder().decode(decryptedDescriptionDataBuffer),
      };

      // Update the state with the decrypted data
      setDecryptedReports((prevState) => ({
        ...prevState,
        [reportId]: decryptedDataStrings,
      }));

      // Return the decrypted data
      return decryptedDataStrings;
    } catch (error) {
      // Log any errors that occur during decryption
      console.error("Error during decryption:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      // Rethrow the error to be caught by the calling function
      throw error;
    }
  };

  return (
    <div className="parent-div">
      <table className="table">
        <thead>
          <tr>
            <th className="narrowcolumn">Industry</th>
            <th className="narrowcolumn">Employer</th>
            <th className="widecolumn">Description</th>
            <th className="narrowcolumn">Decrypt</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.reportID}>
              <td className="narrowcolumn">{report.industryName}</td>
              <td className="narrowcolumn">
                {decryptedReports[report.reportID]?.companyName ||
                  report.companyName}
              </td>
              <td className="widecolumn">
                {decryptedReports[report.reportID]?.description ||
                  report.description}
              </td>
              <td className="narrowcolumn">
                <button onClick={() => decryptReport(report.reportID)}>
                  Decrypt report
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
