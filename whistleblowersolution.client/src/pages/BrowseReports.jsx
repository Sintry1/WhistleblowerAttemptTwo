import { useEffect, useState } from "react";
import "./BrowseReports.css";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import JSEncrypt from "jsencrypt";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const encrypt = new JSEncrypt({ default_key_size: 2048 });

  useEffect(() => {
    const token = Cookies.get("JWT");
    if (token) {
      const decodedToken = jwtDecode(token);
      fetchReports(decodedToken.unique_name);
    }
  }, []);

  const host = "http://localhost:5241/";

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
        console.log("Data", data.reports[0]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const getPrivateKey = () => {
    // Get private key from file
    return new Promise((reject) => {
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
          };
          reader.readAsText(file);
        } else {
          reject(new Error("Failed to load file"));
        }
      });
      fileInput.click();
    });
  };

  const decryptReport = async (reportId) => {
    // Get private key from file
    await getPrivateKey();

    const decryptionKey = encrypt.decrypt(reports[reportId - 1].key);
    let salt = encrypt.decrypt(reports[reportId - 1].salt);
    let iv = encrypt.decrypt(reports[reportId - 1].iv);

    try {
      const keyMaterial = await window.crypto.subtle.exportKey(
        "raw",
        decryptionKey
      );
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

      const encryptedCompanyData = new Uint8Array(reports[reportId - 1].companyName)
      const encryptedDescriptionData = new Uint8Array(reports[reportId - 1].description)

      

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

      const decryptedDataStrings = {
        companyName: new TextDecoder().decode(decryptedCompanyDataBuffer),
        description: new TextDecoder().decode(decryptedDescriptionDataBuffer)}

      return decryptedDataStrings;
    } catch (error) {
      console.error("Error during decryption:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      throw error;
    }
  };

  return (
    <div>
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
            <tr key={report.id}>
              <td className="column">{report.industryName}</td>
              <td className="column">{report.companyName}</td>
              <td className="column">{report.description}</td>
              <td className="column">
                <button>Decrypt report</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
