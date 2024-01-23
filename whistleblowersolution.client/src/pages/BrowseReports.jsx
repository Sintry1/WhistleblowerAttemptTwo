import { useEffect, useState } from "react";
import "./BrowseReports.css";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export default function Reports() {
  const [decryptedReports, setDecryptedReports] = useState([]);

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
            "Authorization": `Bearer ${Cookies.get("JWT")}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      if (response.status !== 204) { // Check if the response is not No Content
        const data = await response.json();
        console.log("Data", data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
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
          </tr>
        </thead>
        <tbody>
          {decryptedReports.map((report) => (
            <tr key={report.id}>
              <td className="column">{report.industryName}</td>
              <td className="column">{report.companyName}</td>
              <td className="column">{report.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
